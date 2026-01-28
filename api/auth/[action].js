import twilio from 'twilio';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase
const supabase = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY
    ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
    : null;

// Initialize Twilio
const twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
);

// Helper functions
function generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

function generateToken() {
    return 'sess_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

function normalizePhone(phone) {
    let digits = phone.replace(/\D/g, '');
    if (digits.length === 10) {
        digits = '1' + digits;
    }
    return '+' + digits;
}

// CORS headers
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default async function handler(req, res) {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).json({});
    }

    // Set CORS headers
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
            if (!phone) {
                return res.status(400).json({ error: 'Phone number is required' });
            }

            const normalizedPhone = normalizePhone(phone);

            // TEST ACCOUNT BYPASS - Use phone: 5550001234 and code: 123456
            if (normalizedPhone === '+15550001234') {
                console.log('Test account detected, skipping SMS');
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

            // Debug logging - remove after fixing
            console.log('Twilio credentials check:', {
                accountSid: process.env.TWILIO_ACCOUNT_SID?.substring(0, 10) + '...',
                authTokenLength: process.env.TWILIO_AUTH_TOKEN?.length,
                messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID,
                messagingServiceSidLength: process.env.TWILIO_MESSAGING_SERVICE_SID?.length
            });

            if (process.env.TWILIO_MESSAGING_SERVICE_SID) {
                messageOptions.messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
            } else {
                messageOptions.from = process.env.TWILIO_PHONE_NUMBER;
            }

            console.log('Sending message with options:', JSON.stringify(messageOptions, null, 2));
            await twilioClient.messages.create(messageOptions);
            return res.status(200).json({ success: true, phone: normalizedPhone });
        }

        // ============================================
        // VERIFY OTP
        // ============================================
        if (action === 'verify-otp' && req.method === 'POST') {
            const { phone, code } = req.body;
            if (!phone || !code) {
                return res.status(400).json({ error: 'Phone and code are required' });
            }

            const normalizedPhone = normalizePhone(phone);

            // TEST ACCOUNT BYPASS - works without database
            if (normalizedPhone === '+15550001234' && code === '123456') {
                console.log('Test account verified, creating mock session');
                const testToken = 'test_session_' + Date.now();
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

            // TEST ACCOUNT SESSION - works without database
            if (token.startsWith('test_session_')) {
                global.testSessions = global.testSessions || {};
                const testUser = global.testSessions[token];
                if (testUser) {
                    return res.status(200).json({ user: testUser });
                }
                // Even if not in memory, accept any test_session_ token
                return res.status(200).json({
                    user: { id: 'test-user-001', phone: '+15550001234', displayName: 'Test User' }
                });
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
                    user: { id: session.users.id, phone: session.users.phone, displayName: session.users.display_name }
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

            // TEST ACCOUNT - works without database
            if (token.startsWith('test_session_') || userId === 'test-user-001') {
                global.testSessions = global.testSessions || {};
                if (global.testSessions[token]) {
                    global.testSessions[token].displayName = displayName;
                }
                return res.status(200).json({
                    success: true,
                    user: { id: 'test-user-001', phone: '+15550001234', displayName }
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
                    .update({ display_name: displayName })
                    .eq('id', userId)
                    .select()
                    .single();

                return res.status(200).json({
                    success: true,
                    user: { id: user.id, phone: user.phone, displayName: user.display_name }
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
        console.error('API Error:', error);
        return res.status(500).json({ error: error.message });
    }
}
