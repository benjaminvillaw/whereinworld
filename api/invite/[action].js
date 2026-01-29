import twilio from 'twilio';
import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';

// Initialize Supabase
const supabase = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY
    ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
    : null;

// Initialize Twilio
const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
    ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    : null;

// Check if test mode is enabled (only for development/testing)
const TEST_MODE_ENABLED = process.env.ALLOW_TEST_BYPASS === 'true';

// Generate short invite code using crypto
function generateInviteCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const bytes = randomBytes(6);
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(bytes[i] % chars.length);
    }
    return code;
}

// Normalize phone number
function normalizePhone(phone) {
    let digits = phone.replace(/\D/g, '');
    if (digits.length === 10) {
        digits = '1' + digits;
    }
    return '+' + digits;
}

// Get base URL for invite links
function getBaseUrl(req) {
    const host = req.headers.host || 'localhost:3000';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    return `${protocol}://${host}`;
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

// ============================================
// RATE LIMITING (in-memory, per-instance)
// ============================================
const rateLimitStore = new Map();

const RATE_LIMITS = {
    inviteSms: {
        maxAttempts: parseInt(process.env.RATE_LIMIT_INVITE_SMS || '5', 10),
        windowMs: parseInt(process.env.RATE_LIMIT_INVITE_SMS_WINDOW || '3600000', 10), // 1 hour
    }
};

function checkRateLimit(key, limitConfig) {
    const now = Date.now();
    const record = rateLimitStore.get(key);

    if (rateLimitStore.size > 10000) {
        for (const [k, v] of rateLimitStore.entries()) {
            if (now - v.firstAttempt > limitConfig.windowMs) {
                rateLimitStore.delete(k);
            }
        }
    }

    if (!record || now - record.firstAttempt > limitConfig.windowMs) {
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
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10 || digits.length > 15) {
        return { valid: false, error: 'Phone number must be 10-15 digits' };
    }
    return { valid: true };
}

function validateInviteCode(code) {
    if (!code || typeof code !== 'string') {
        return { valid: false, error: 'Invite code is required' };
    }
    // Must be 4-8 alphanumeric characters
    const cleaned = code.trim().toUpperCase();
    if (!/^[A-Z0-9]{4,8}$/.test(cleaned)) {
        return { valid: false, error: 'Invalid invite code format' };
    }
    return { valid: true, cleaned };
}

// Validate session and get user
async function getSessionUser(token) {
    if (!token) return null;

    // Test account bypass - Only enabled when ALLOW_TEST_BYPASS=true
    if (TEST_MODE_ENABLED && token.startsWith('test_session_')) {
        global.testSessions = global.testSessions || {};
        const testUser = global.testSessions[token];
        if (testUser) return testUser;
        // Don't auto-create test users - must have valid session
        return null;
    }

    if (supabase) {
        const { data: session } = await supabase
            .from('sessions')
            .select('*, users(*)')
            .eq('token', token)
            .gt('expires_at', new Date().toISOString())
            .single();

        if (session?.users) {
            return {
                id: session.users.id,
                phone: session.users.phone,
                displayName: session.users.display_name
            };
        }
    }
    return null;
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
    const token = req.headers.authorization?.replace('Bearer ', '');

    try {
        // ============================================
        // CREATE INVITE - Generate invite code/link
        // ============================================
        if (action === 'create' && req.method === 'POST') {
            const user = await getSessionUser(token);
            if (!user) {
                return res.status(401).json({ error: 'Not authenticated' });
            }

            // Test account bypass - Only enabled when ALLOW_TEST_BYPASS=true
            if (TEST_MODE_ENABLED && user.id === 'test-user-001') {
                const code = generateInviteCode();
                const inviteUrl = `${getBaseUrl(req)}/join/${code}`;
                return res.status(200).json({
                    success: true,
                    invite: {
                        code,
                        url: inviteUrl,
                        createdAt: new Date().toISOString()
                    }
                });
            }

            if (!supabase) {
                return res.status(500).json({ error: 'Database not configured' });
            }

            // Check if user already has an active invite
            const { data: existingInvite } = await supabase
                .from('invites')
                .select('*')
                .eq('user_id', user.id)
                .is('phone_sent_to', null)
                .is('accepted_at', null)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (existingInvite) {
                const inviteUrl = `${getBaseUrl(req)}/join/${existingInvite.code}`;
                return res.status(200).json({
                    success: true,
                    invite: {
                        id: existingInvite.id,
                        code: existingInvite.code,
                        url: inviteUrl,
                        createdAt: existingInvite.created_at
                    }
                });
            }

            // Create new invite
            const code = generateInviteCode();
            const { data: invite, error } = await supabase
                .from('invites')
                .insert({
                    user_id: user.id,
                    code
                })
                .select()
                .single();

            if (error) throw error;

            const inviteUrl = `${getBaseUrl(req)}/join/${invite.code}`;
            return res.status(200).json({
                success: true,
                invite: {
                    id: invite.id,
                    code: invite.code,
                    url: inviteUrl,
                    createdAt: invite.created_at
                }
            });
        }

        // ============================================
        // SEND SMS - Send invite via SMS
        // ============================================
        if (action === 'send-sms' && req.method === 'POST') {
            const user = await getSessionUser(token);
            if (!user) {
                return res.status(401).json({ error: 'Not authenticated' });
            }

            const { phone } = req.body;

            // Validate phone
            const phoneValidation = validatePhone(phone);
            if (!phoneValidation.valid) {
                return res.status(400).json({ error: phoneValidation.error });
            }

            const normalizedPhone = normalizePhone(phone);

            // Test account bypass - Only enabled when ALLOW_TEST_BYPASS=true
            if (TEST_MODE_ENABLED && user.id === 'test-user-001') {
                const code = generateInviteCode();
                return res.status(200).json({
                    success: true,
                    testMode: true,
                    invite: { code, phoneSentTo: normalizedPhone }
                });
            }

            // Rate limiting - prevent SMS spam
            const rateLimitKey = `invite-sms:${user.id}`;
            const rateCheck = checkRateLimit(rateLimitKey, RATE_LIMITS.inviteSms);
            if (!rateCheck.allowed) {
                return res.status(429).json({
                    error: `Too many invites sent. Please try again in ${rateCheck.resetIn} seconds.`,
                    retryAfter: rateCheck.resetIn
                });
            }

            if (!supabase) {
                return res.status(500).json({ error: 'Database not configured' });
            }

            if (!twilioClient) {
                return res.status(500).json({ error: 'SMS not configured' });
            }

            // Create invite for this phone
            const code = generateInviteCode();
            const { data: invite, error } = await supabase
                .from('invites')
                .insert({
                    user_id: user.id,
                    code,
                    phone_sent_to: normalizedPhone
                })
                .select()
                .single();

            if (error) throw error;

            // Send SMS
            const inviteUrl = `${getBaseUrl(req)}/join/${code}`;
            const senderName = user.displayName || 'Your friend';

            const messageOptions = {
                to: normalizedPhone,
                body: `${senderName} invited you to Where In World! See where your friends are: ${inviteUrl}`
            };

            if (process.env.TWILIO_MESSAGING_SERVICE_SID) {
                messageOptions.messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
            } else if (process.env.TWILIO_PHONE_NUMBER) {
                messageOptions.from = process.env.TWILIO_PHONE_NUMBER;
            }

            await twilioClient.messages.create(messageOptions);

            return res.status(200).json({
                success: true,
                invite: {
                    id: invite.id,
                    code: invite.code,
                    phoneSentTo: normalizedPhone
                }
            });
        }

        // ============================================
        // LOOKUP - Look up invite by code
        // ============================================
        if (action === 'lookup' && req.method === 'GET') {
            const { code } = req.query;

            // Validate invite code
            const codeValidation = validateInviteCode(code);
            if (!codeValidation.valid) {
                return res.status(400).json({ error: codeValidation.error });
            }

            // Test mode bypass
            if (!supabase) {
                return res.status(200).json({
                    success: true,
                    invite: {
                        code: codeValidation.cleaned,
                        inviterName: 'Demo User',
                        valid: true
                    }
                });
            }

            const { data: invite } = await supabase
                .from('invites')
                .select('*, users!invites_user_id_fkey(display_name, phone)')
                .eq('code', codeValidation.cleaned)
                .is('accepted_at', null)
                .single();

            if (!invite) {
                return res.status(404).json({ error: 'Invite not found or already used' });
            }

            // Check expiration
            if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
                return res.status(410).json({ error: 'Invite has expired' });
            }

            return res.status(200).json({
                success: true,
                invite: {
                    code: invite.code,
                    inviterName: invite.users?.display_name || 'A friend',
                    valid: true
                }
            });
        }

        // ============================================
        // ACCEPT - Accept invite and create friendship
        // ============================================
        if (action === 'accept' && req.method === 'POST') {
            const user = await getSessionUser(token);
            if (!user) {
                return res.status(401).json({ error: 'Not authenticated' });
            }

            const { code } = req.body;

            // Validate invite code
            const codeValidation = validateInviteCode(code);
            if (!codeValidation.valid) {
                return res.status(400).json({ error: codeValidation.error });
            }

            // Test account bypass - Only enabled when ALLOW_TEST_BYPASS=true
            if (TEST_MODE_ENABLED && user.id === 'test-user-001') {
                return res.status(200).json({
                    success: true,
                    testMode: true,
                    message: 'Friendship created'
                });
            }

            if (!supabase) {
                return res.status(500).json({ error: 'Database not configured' });
            }

            // Find the invite
            const { data: invite } = await supabase
                .from('invites')
                .select('*')
                .eq('code', codeValidation.cleaned)
                .is('accepted_at', null)
                .single();

            if (!invite) {
                return res.status(404).json({ error: 'Invite not found or already used' });
            }

            // Can't accept your own invite
            if (invite.user_id === user.id) {
                return res.status(400).json({ error: 'Cannot accept your own invite' });
            }

            // Check expiration
            if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
                return res.status(410).json({ error: 'Invite has expired' });
            }

            // Mark invite as accepted
            await supabase
                .from('invites')
                .update({
                    accepted_at: new Date().toISOString(),
                    accepted_by: user.id
                })
                .eq('id', invite.id);

            // Create friendship (order user IDs to prevent duplicates)
            const [userA, userB] = [invite.user_id, user.id].sort();

            const { error: friendshipError } = await supabase
                .from('friendships')
                .insert({
                    user_a: userA,
                    user_b: userB,
                    created_via_invite: invite.id
                });

            // Ignore duplicate key error (friendship already exists)
            if (friendshipError && !friendshipError.message.includes('duplicate')) {
                throw friendshipError;
            }

            return res.status(200).json({
                success: true,
                message: 'Friendship created'
            });
        }

        // ============================================
        // MY INVITES - List user's sent invites
        // ============================================
        if (action === 'my-invites' && req.method === 'GET') {
            const user = await getSessionUser(token);
            if (!user) {
                return res.status(401).json({ error: 'Not authenticated' });
            }

            // Test account bypass - Only enabled when ALLOW_TEST_BYPASS=true
            if (TEST_MODE_ENABLED && user.id === 'test-user-001') {
                return res.status(200).json({
                    success: true,
                    invites: []
                });
            }

            if (!supabase) {
                return res.status(500).json({ error: 'Database not configured' });
            }

            const { data: invites } = await supabase
                .from('invites')
                .select('*, accepted_user:users!invites_accepted_by_fkey(display_name)')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(20);

            return res.status(200).json({
                success: true,
                invites: (invites || []).map(inv => ({
                    id: inv.id,
                    code: inv.code,
                    phoneSentTo: inv.phone_sent_to,
                    createdAt: inv.created_at,
                    acceptedAt: inv.accepted_at,
                    acceptedBy: inv.accepted_user?.display_name
                }))
            });
        }

        return res.status(404).json({ error: 'Not found' });

    } catch (error) {
        console.error('Invite API Error:', error);
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error code:', error.code);
        console.error('Error status:', error.status);

        // Twilio Error Codes
        const twilioErrorCode = error.code || error.status;

        // Authentication & Credential Errors
        if (twilioErrorCode === 20003 || error.message?.includes('authenticate')) {
            return res.status(500).json({ error: 'SMS service authentication failed. Check Twilio credentials.' });
        }

        // Phone Number Errors
        if (twilioErrorCode === 21211) {
            return res.status(400).json({ error: 'Invalid phone number. Please check the format.' });
        }
        if (twilioErrorCode === 21608 || error.message?.includes('unverified')) {
            return res.status(400).json({ error: 'Phone number not verified in Twilio trial account.' });
        }
        if (twilioErrorCode === 21610) {
            return res.status(400).json({ error: 'This phone number has opted out of receiving messages.' });
        }
        if (twilioErrorCode === 21614) {
            return res.status(400).json({ error: 'This phone number is not SMS-capable.' });
        }

        // Messaging Service Errors
        if (twilioErrorCode === 21703 || twilioErrorCode === 21704 || twilioErrorCode === 21705 || twilioErrorCode === 21710) {
            return res.status(500).json({ error: 'Twilio Messaging Service not configured correctly.' });
        }

        // Carrier Issues
        if (twilioErrorCode === 30003 || twilioErrorCode === 30005 || twilioErrorCode === 30006) {
            return res.status(400).json({ error: 'Phone number is unreachable.' });
        }
        if (twilioErrorCode === 30007) {
            return res.status(400).json({ error: 'Message filtered by carrier.' });
        }

        // Database / Supabase Errors
        if (error.code === '23505' || error.message?.includes('duplicate')) {
            return res.status(409).json({ error: 'Invite already exists for this phone number.' });
        }
        if (error.code === 'PGRST' || error.message?.includes('supabase') || error.message?.includes('database')) {
            return res.status(500).json({ error: 'Database connection error. Please try again.' });
        }

        // Generic Twilio errors with message
        if (error.message?.includes('Twilio') || error.message?.includes('twilio')) {
            return res.status(500).json({ error: `SMS service error: ${error.message.substring(0, 100)}` });
        }

        // Fallback with error code for debugging
        const errorDetail = twilioErrorCode ? ` (Code: ${twilioErrorCode})` : '';
        return res.status(500).json({ error: `An unexpected error occurred${errorDetail}. Please try again.` });
    }
}
