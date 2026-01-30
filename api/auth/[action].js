import twilio from 'twilio';
import { createClient } from '@supabase/supabase-js';
import { randomBytes, randomInt } from 'crypto';

// Initialize Supabase
const supabase = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY
    ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
    : null;

// Initialize Twilio - only if credentials are available
const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
    ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    : null;

// Check if test mode is enabled (only for development/testing)
const TEST_MODE_ENABLED = process.env.ALLOW_TEST_BYPASS === 'true';

// ============================================
// RATE LIMITING (in-memory, per-instance)
// For production, use Redis/Upstash for distributed rate limiting
// ============================================
const rateLimitStore = new Map();

// Rate limit configuration (can be overridden via env vars)
const RATE_LIMITS = {
    sendOtp: {
        maxAttempts: parseInt(process.env.RATE_LIMIT_OTP_SEND || '3', 10),
        windowMs: parseInt(process.env.RATE_LIMIT_OTP_SEND_WINDOW || '3600000', 10), // 1 hour
    },
    verifyOtp: {
        maxAttempts: parseInt(process.env.RATE_LIMIT_OTP_VERIFY || '5', 10),
        windowMs: parseInt(process.env.RATE_LIMIT_OTP_VERIFY_WINDOW || '600000', 10), // 10 minutes
    }
};

function checkRateLimit(key, limitConfig) {
    const now = Date.now();
    const record = rateLimitStore.get(key);

    // Clean up old entries periodically
    if (rateLimitStore.size > 10000) {
        for (const [k, v] of rateLimitStore.entries()) {
            if (now - v.firstAttempt > limitConfig.windowMs) {
                rateLimitStore.delete(k);
            }
        }
    }

    if (!record || now - record.firstAttempt > limitConfig.windowMs) {
        // First attempt or window expired
        rateLimitStore.set(key, { attempts: 1, firstAttempt: now });
        return { allowed: true, remaining: limitConfig.maxAttempts - 1 };
    }

    if (record.attempts >= limitConfig.maxAttempts) {
        const resetIn = Math.ceil((record.firstAttempt + limitConfig.windowMs - now) / 1000);
        return { allowed: false, resetIn };
    }

    record.attempts++;
    return { allowed: true, remaining: limitConfig.maxAttempts - record.attempts };
}

// ============================================
// INPUT VALIDATION
// ============================================
function validatePhone(phone) {
    if (!phone || typeof phone !== 'string') {
        return { valid: false, error: 'Phone number is required' };
    }

    // Remove all non-digits
    const digits = phone.replace(/\D/g, '');

    // Must be 10-15 digits (E.164 allows up to 15)
    if (digits.length < 10 || digits.length > 15) {
        return { valid: false, error: 'Phone number must be 10-15 digits' };
    }

    return { valid: true };
}

function validateDisplayName(name) {
    if (!name || typeof name !== 'string') {
        return { valid: false, error: 'Display name is required' };
    }

    const trimmed = name.trim();

    if (trimmed.length < 1 || trimmed.length > 50) {
        return { valid: false, error: 'Display name must be 1-50 characters' };
    }

    // Basic XSS prevention - remove HTML tags
    const sanitized = trimmed.replace(/<[^>]*>/g, '');

    return { valid: true, sanitized };
}

function validateOtpCode(code) {
    if (!code || typeof code !== 'string') {
        return { valid: false, error: 'Verification code is required' };
    }

    // Must be exactly 6 digits
    if (!/^\d{6}$/.test(code)) {
        return { valid: false, error: 'Verification code must be 6 digits' };
    }

    return { valid: true };
}

// ============================================
// HELPER FUNCTIONS
// ============================================
function generateOtp() {
    return randomInt(100000, 999999).toString();
}

function generateToken() {
    return 'sess_' + randomBytes(24).toString('hex');
}

function normalizePhone(phone) {
    let digits = phone.replace(/\D/g, '');
    if (digits.length === 10) {
        digits = '1' + digits;
    }
    return '+' + digits;
}

// CORS headers - restrict to allowed origins
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:3000').split(',');

function getCorsHeaders(req) {
    const origin = req.headers.origin || '';
    const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
    return {
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Credentials': 'true',
    };
}

export default async function handler(req, res) {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).json({});
    }

    // Set CORS headers
    const corsHeaders = getCorsHeaders(req);
    Object.entries(corsHeaders).forEach(([key, value]) => {
        res.setHeader(key, value);
    });

    const { action } = req.query;

    try {
        // ============================================
        // SEND OTP
        // ============================================
        if (action === 'send-otp' && req.method === 'POST') {
            const { phone } = req.body;

            // Validate phone number
            const phoneValidation = validatePhone(phone);
            if (!phoneValidation.valid) {
                return res.status(400).json({ error: phoneValidation.error });
            }

            const normalizedPhone = normalizePhone(phone);

            // TEST ACCOUNT BYPASS - Only enabled when ALLOW_TEST_BYPASS=true
            if (TEST_MODE_ENABLED && normalizedPhone === '+15550001234') {
                console.log('[TEST MODE] Test account detected, skipping SMS');
                // Store test OTP in database if available
                if (supabase) {
                    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
                    await supabase.from('otp_codes').insert({
                        phone: normalizedPhone,
                        code: '123456',
                        expires_at: expiresAt
                    });
                }
                return res.status(200).json({ success: true, phone: normalizedPhone, testMode: true });
            }

            // Rate limiting - check before sending SMS (protects Twilio costs)
            const rateLimitKey = `send-otp:${normalizedPhone}`;
            const rateCheck = checkRateLimit(rateLimitKey, RATE_LIMITS.sendOtp);
            if (!rateCheck.allowed) {
                return res.status(429).json({
                    error: `Too many attempts. Please try again in ${rateCheck.resetIn} seconds.`,
                    retryAfter: rateCheck.resetIn
                });
            }

            // Check if Twilio is configured
            if (!process.env.TWILIO_MESSAGING_SERVICE_SID && !process.env.TWILIO_PHONE_NUMBER) {
                return res.status(500).json({ error: 'SMS not configured. Add TWILIO environment variables in Vercel.' });
            }

            // Check if Supabase is configured  
            if (!supabase) {
                return res.status(500).json({ error: 'Database not configured. Add SUPABASE environment variables in Vercel.' });
            }

            const code = generateOtp();
            const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

            // Store OTP
            await supabase.from('otp_codes').insert({ phone: normalizedPhone, code, expires_at: expiresAt });

            // Send SMS
            const messageOptions = {
                to: normalizedPhone,
                body: `Your Where In World code is: ${code}\n\nExpires in 10 minutes.`
            };

            // Check if Twilio client is initialized
            if (!twilioClient) {
                return res.status(500).json({ error: 'SMS service not configured. Add TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in Vercel.' });
            }

            if (process.env.TWILIO_MESSAGING_SERVICE_SID) {
                messageOptions.messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
            } else {
                messageOptions.from = process.env.TWILIO_PHONE_NUMBER;
            }

            await twilioClient.messages.create(messageOptions);
            return res.status(200).json({ success: true, phone: normalizedPhone });
        }

        // ============================================
        // VERIFY OTP
        // ============================================
        if (action === 'verify-otp' && req.method === 'POST') {
            const { phone, code } = req.body;

            // Validate inputs
            const phoneValidation = validatePhone(phone);
            if (!phoneValidation.valid) {
                return res.status(400).json({ error: phoneValidation.error });
            }

            const codeValidation = validateOtpCode(code);
            if (!codeValidation.valid) {
                return res.status(400).json({ error: codeValidation.error });
            }

            const normalizedPhone = normalizePhone(phone);

            // Rate limiting - prevent brute force OTP guessing
            const rateLimitKey = `verify-otp:${normalizedPhone}`;
            const rateCheck = checkRateLimit(rateLimitKey, RATE_LIMITS.verifyOtp);
            if (!rateCheck.allowed) {
                return res.status(429).json({
                    error: `Too many verification attempts. Please try again in ${rateCheck.resetIn} seconds.`,
                    retryAfter: rateCheck.resetIn
                });
            }

            // TEST ACCOUNT BYPASS - Only enabled when ALLOW_TEST_BYPASS=true
            if (TEST_MODE_ENABLED && normalizedPhone === '+15550001234' && code === '123456') {
                console.log('[TEST MODE] Test account verified, creating mock session');
                const testToken = 'test_session_' + randomBytes(16).toString('hex');
                // Store in global for session lookup (serverless-safe within same instance)
                global.testSessions = global.testSessions || {};
                global.testSessions[testToken] = {
                    id: 'test-user-001',
                    phone: '+15550001234',
                    displayName: null
                };
                return res.status(200).json({
                    success: true,
                    user: { id: 'test-user-001', phone: '+15550001234', displayName: null },
                    sessionToken: testToken
                });
            }

            // Verify OTP with Supabase
            if (supabase) {
                const { data: otpData } = await supabase
                    .from('otp_codes')
                    .select('*')
                    .eq('phone', normalizedPhone)
                    .eq('code', code)
                    .eq('used', false)
                    .gt('expires_at', new Date().toISOString())
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single();

                if (!otpData) {
                    return res.status(401).json({ error: 'Invalid or expired code' });
                }

                // Mark as used
                await supabase.from('otp_codes').update({ used: true }).eq('id', otpData.id);

                // Find or create user
                let { data: user } = await supabase.from('users').select('*').eq('phone', normalizedPhone).single();
                if (!user) {
                    const { data: newUser } = await supabase.from('users').insert({ phone: normalizedPhone }).select().single();
                    user = newUser;
                }

                // Create session
                const token = generateToken();
                const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
                await supabase.from('sessions').insert({ user_id: user.id, token, expires_at: expiresAt });

                return res.status(200).json({
                    success: true,
                    user: { id: user.id, phone: user.phone, displayName: user.display_name },
                    sessionToken: token
                });
            }

            return res.status(500).json({ error: 'Database not configured' });
        }

        // ============================================
        // GET SESSION
        // ============================================
        if (action === 'session' && req.method === 'GET') {
            const token = req.headers.authorization?.replace('Bearer ', '');
            if (!token) {
                return res.status(401).json({ error: 'Not authenticated' });
            }

            // TEST ACCOUNT SESSION - Only enabled when ALLOW_TEST_BYPASS=true
            if (TEST_MODE_ENABLED && token.startsWith('test_session_')) {
                global.testSessions = global.testSessions || {};
                const testUser = global.testSessions[token];
                if (testUser) {
                    return res.status(200).json({ user: testUser });
                }
                // Return unauthorized if test session not found (more secure)
                return res.status(401).json({ error: 'Session expired' });
            }

            if (supabase) {
                const { data: session } = await supabase
                    .from('sessions')
                    .select('*, users(*)')
                    .eq('token', token)
                    .gt('expires_at', new Date().toISOString())
                    .single();

                if (!session?.users) {
                    return res.status(401).json({ error: 'Session expired' });
                }

                return res.status(200).json({
                    user: {
                        id: session.users.id,
                        phone: session.users.phone,
                        display_name: session.users.display_name,
                        avatar_url: session.users.avatar_url
                    }
                });
            }

            return res.status(500).json({ error: 'Database not configured' });
        }

        // ============================================
        // UPDATE NAME
        // ============================================
        if (action === 'update-name' && req.method === 'POST') {
            const token = req.headers.authorization?.replace('Bearer ', '');
            const { userId, displayName } = req.body;

            if (!token || !userId || !displayName) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            // Validate and sanitize display name
            const nameValidation = validateDisplayName(displayName);
            if (!nameValidation.valid) {
                return res.status(400).json({ error: nameValidation.error });
            }
            const sanitizedName = nameValidation.sanitized;

            // TEST ACCOUNT - Only enabled when ALLOW_TEST_BYPASS=true
            if (TEST_MODE_ENABLED && (token.startsWith('test_session_') || userId === 'test-user-001')) {
                global.testSessions = global.testSessions || {};
                if (global.testSessions[token]) {
                    global.testSessions[token].displayName = sanitizedName;
                }
                return res.status(200).json({
                    success: true,
                    user: { id: 'test-user-001', phone: '+15550001234', displayName: sanitizedName }
                });
            }

            if (supabase) {
                // Verify session
                const { data: session } = await supabase
                    .from('sessions')
                    .select('*, users(*)')
                    .eq('token', token)
                    .single();

                if (!session || session.users?.id !== userId) {
                    return res.status(401).json({ error: 'Invalid session' });
                }

                // Update user
                const { data: user } = await supabase
                    .from('users')
                    .update({ display_name: sanitizedName })
                    .eq('id', userId)
                    .select()
                    .single();

                return res.status(200).json({
                    success: true,
                    user: { id: user.id, phone: user.phone, display_name: user.display_name }
                });
            }

            return res.status(500).json({ error: 'Database not configured' });
        }

        // ============================================
        // UPDATE AVATAR
        // ============================================
        if (action === 'update-avatar' && req.method === 'POST') {
            const token = req.headers.authorization?.replace('Bearer ', '');
            const { userId, avatarUrl } = req.body;

            if (!token || !userId || !avatarUrl) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            // Basic URL validation
            if (!avatarUrl.startsWith('http://') && !avatarUrl.startsWith('https://')) {
                return res.status(400).json({ error: 'Invalid avatar URL' });
            }

            // TEST ACCOUNT - Only enabled when ALLOW_TEST_BYPASS=true
            if (TEST_MODE_ENABLED && (token.startsWith('test_session_') || userId === 'test-user-001')) {
                global.testSessions = global.testSessions || {};
                if (global.testSessions[token]) {
                    global.testSessions[token].avatarUrl = avatarUrl;
                }
                return res.status(200).json({
                    success: true,
                    user: { id: 'test-user-001', phone: '+15550001234', displayName: global.testSessions[token]?.displayName, avatarUrl }
                });
            }

            if (supabase) {
                // Verify session
                const { data: session } = await supabase
                    .from('sessions')
                    .select('*, users(*)')
                    .eq('token', token)
                    .single();

                if (!session || session.users?.id !== userId) {
                    return res.status(401).json({ error: 'Invalid session' });
                }

                // Update user
                const { data: user } = await supabase
                    .from('users')
                    .update({ avatar_url: avatarUrl })
                    .eq('id', userId)
                    .select()
                    .single();

                return res.status(200).json({
                    success: true,
                    user: { id: user.id, phone: user.phone, display_name: user.display_name, avatar_url: user.avatar_url }
                });
            }

            return res.status(500).json({ error: 'Database not configured' });
        }

        // ============================================
        // LOGOUT
        // ============================================
        if (action === 'logout' && req.method === 'POST') {
            const token = req.headers.authorization?.replace('Bearer ', '');
            if (token && supabase) {
                await supabase.from('sessions').delete().eq('token', token);
            }
            return res.status(200).json({ success: true });
        }

        // ============================================
        // UPDATE LOCATION
        // ============================================
        if (action === 'update-location' && req.method === 'POST') {
            const token = req.headers.authorization?.replace('Bearer ', '');
            const { city, country, lat, lng } = req.body;

            if (!token) {
                return res.status(401).json({ error: 'Not authenticated' });
            }

            if (!city || lat === undefined || lng === undefined) {
                return res.status(400).json({ error: 'Missing location data' });
            }

            if (supabase) {
                // Verify session
                const { data: session } = await supabase
                    .from('sessions')
                    .select('*, users(*)')
                    .eq('token', token)
                    .gt('expires_at', new Date().toISOString())
                    .single();

                if (!session?.users) {
                    return res.status(401).json({ error: 'Session expired' });
                }

                // Upsert location (insert or update)
                const { error: locationError } = await supabase
                    .from('locations')
                    .upsert({
                        user_id: session.users.id,
                        city,
                        country: country || '',
                        lat,
                        lng,
                        updated_at: new Date().toISOString()
                    }, {
                        onConflict: 'user_id'
                    });

                if (locationError) {
                    console.error('Location update error:', locationError);
                    return res.status(500).json({ error: 'Failed to update location' });
                }

                return res.status(200).json({
                    success: true,
                    location: { city, country, lat, lng }
                });
            }

            return res.status(500).json({ error: 'Database not configured' });
        }

        // ============================================
        // HEALTH CHECK
        // ============================================
        if (action === 'health') {
            return res.status(200).json({
                status: 'ok',
                database: supabase ? 'supabase' : 'not-configured',
                twilio: process.env.TWILIO_MESSAGING_SERVICE_SID ? 'messaging-service' : 'not-configured'
            });
        }

        return res.status(404).json({ error: 'Not found' });

    } catch (error) {
        console.error('Auth API Error:', error);
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error code:', error.code);
        console.error('Error status:', error.status);
        console.error('Full error object:', JSON.stringify(error, null, 2));

        // Twilio Error Codes - https://www.twilio.com/docs/api/errors
        const twilioErrorCode = error.code || error.status;

        // Authentication & Credential Errors
        if (twilioErrorCode === 20003 || error.message?.includes('authenticate')) {
            return res.status(500).json({ error: 'SMS service authentication failed. Check Twilio credentials.' });
        }
        if (twilioErrorCode === 20008) {
            return res.status(500).json({ error: 'Twilio resource not found. Check Messaging Service SID.' });
        }

        // Phone Number Errors
        if (twilioErrorCode === 21211) {
            return res.status(400).json({ error: 'Invalid phone number. Please check the format and try again.' });
        }
        if (twilioErrorCode === 21214) {
            return res.status(400).json({ error: 'Phone number is not a valid mobile number for SMS.' });
        }
        if (twilioErrorCode === 21217) {
            return res.status(400).json({ error: 'Phone number is not a valid number.' });
        }
        if (twilioErrorCode === 21608 || error.message?.includes('unverified')) {
            return res.status(400).json({ error: 'Phone number not verified in Twilio trial account. Add this number to verified caller IDs.' });
        }
        if (twilioErrorCode === 21610) {
            return res.status(400).json({ error: 'This phone number has opted out of receiving messages.' });
        }
        if (twilioErrorCode === 21612) {
            return res.status(400).json({ error: 'Phone number is unreachable or invalid.' });
        }
        if (twilioErrorCode === 21614) {
            return res.status(400).json({ error: 'This phone number is not SMS-capable.' });
        }
        if (twilioErrorCode === 21408) {
            return res.status(400).json({ error: 'Cannot send SMS to this region.' });
        }

        // Messaging Service Errors
        if (twilioErrorCode === 21703 || error.message?.includes('MessagingServiceSid')) {
            return res.status(500).json({ error: 'Twilio Messaging Service not configured correctly.' });
        }
        if (twilioErrorCode === 21704) {
            return res.status(500).json({ error: 'Messaging Service has no phone numbers configured.' });
        }
        if (twilioErrorCode === 21705) {
            return res.status(500).json({ error: 'Messaging Service is invalid or has no phone numbers. Check TWILIO_MESSAGING_SERVICE_SID.' });
        }
        if (twilioErrorCode === 21710) {
            return res.status(500).json({ error: 'Messaging Service not found.' });
        }

        // Rate Limiting / Carrier Issues
        if (twilioErrorCode === 21611) {
            return res.status(429).json({ error: 'Too many messages sent. Please wait a moment and try again.' });
        }
        if (twilioErrorCode === 30003 || twilioErrorCode === 30005 || twilioErrorCode === 30006) {
            return res.status(400).json({ error: 'Phone number is unreachable. Please check the number and try again.' });
        }
        if (twilioErrorCode === 30007) {
            return res.status(400).json({ error: 'Message filtered by carrier. This may be a spam protection filter.' });
        }
        if (twilioErrorCode === 30034) {
            return res.status(429).json({ error: 'Message blocked due to A2P regulations. Please try again later.' });
        }

        // A2P / 10DLC Errors (common for US numbers)
        if (twilioErrorCode === 30035 || twilioErrorCode === 30036) {
            return res.status(500).json({ error: 'A2P registration issue. Contact support.' });
        }

        // Database / Supabase Errors
        if (error.message?.includes('supabase') || error.message?.includes('database') || error.code === 'PGRST') {
            return res.status(500).json({ error: 'Database connection error. Please try again.' });
        }

        // Generic Twilio errors with message
        if (error.message?.includes('Twilio') || error.message?.includes('twilio')) {
            return res.status(500).json({ error: `SMS service error: ${error.message.substring(0, 100)}` });
        }

        // Fallback: Include error code in response for debugging
        const errorDetail = twilioErrorCode ? ` (Code: ${twilioErrorCode})` : '';
        return res.status(500).json({ error: `An unexpected error occurred${errorDetail}. Please try again.` });
    }
}
