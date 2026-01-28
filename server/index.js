import express from 'express';
import cors from 'cors';
import twilio from 'twilio';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { randomBytes, randomInt } from 'crypto';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());

// Initialize Twilio client
const twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
);
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY; // Service role key for backend
const supabase = supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey)
    : null;

// In-memory fallback (used when Supabase not configured)
const memoryStore = {
    sessions: new Map(),
    otpCodes: new Map(),
    users: new Map(),
    locations: new Map(),
    contacts: new Map()
};

// Generate session token using cryptographically secure random
function generateToken() {
    return 'sess_' + randomBytes(24).toString('hex');
}

// Generate 6-digit OTP using cryptographically secure random
function generateOtp() {
    return randomInt(100000, 999999).toString();
}

// Normalize phone to E.164
function normalizePhone(phone) {
    let digits = phone.replace(/\D/g, '');
    if (digits.length === 10) {
        digits = '1' + digits;
    }
    return '+' + digits;
}

// ============================================
// OTP STORAGE (Supabase or Memory)
// ============================================
async function storeOtp(phone, code, expiresAt) {
    if (supabase) {
        await supabase.from('otp_codes').insert({
            phone,
            code,
            expires_at: new Date(expiresAt).toISOString()
        });
    } else {
        memoryStore.otpCodes.set(phone, { code, expiresAt });
    }
}

async function verifyOtp(phone, code) {
    if (supabase) {
        const { data, error } = await supabase
            .from('otp_codes')
            .select('*')
            .eq('phone', phone)
            .eq('code', code)
            .eq('used', false)
            .gt('expires_at', new Date().toISOString())
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (error || !data) return null;

        // Mark as used
        await supabase.from('otp_codes').update({ used: true }).eq('id', data.id);
        return data;
    } else {
        const stored = memoryStore.otpCodes.get(phone);
        if (!stored) return null;
        if (Date.now() > stored.expiresAt) {
            memoryStore.otpCodes.delete(phone);
            return null;
        }
        if (stored.code !== code) return null;
        memoryStore.otpCodes.delete(phone);
        return stored;
    }
}

// ============================================
// USER STORAGE (Supabase or Memory)
// ============================================
async function findUserByPhone(phone) {
    if (supabase) {
        const { data } = await supabase
            .from('users')
            .select('*')
            .eq('phone', phone)
            .single();
        return data;
    } else {
        for (const user of memoryStore.users.values()) {
            if (user.phone === phone) return user;
        }
        return null;
    }
}

async function createUser(phone, displayName) {
    const id = crypto.randomUUID();
    const user = {
        id,
        phone,
        display_name: displayName,
        created_at: new Date().toISOString()
    };

    if (supabase) {
        const { data, error } = await supabase
            .from('users')
            .insert(user)
            .select()
            .single();
        if (error) throw error;
        return data;
    } else {
        memoryStore.users.set(id, user);
        return user;
    }
}

async function updateUser(userId, updates) {
    if (supabase) {
        const { data, error } = await supabase
            .from('users')
            .update(updates)
            .eq('id', userId)
            .select()
            .single();
        if (error) throw error;
        return data;
    } else {
        const user = memoryStore.users.get(userId);
        if (user) {
            Object.assign(user, updates);
        }
        return user;
    }
}

// ============================================
// SESSION STORAGE (Supabase or Memory)
// ============================================
async function createSession(userId, token, expiresAt) {
    if (supabase) {
        await supabase.from('sessions').insert({
            user_id: userId,
            token,
            expires_at: new Date(expiresAt).toISOString()
        });
    } else {
        memoryStore.sessions.set(token, { userId, expiresAt });
    }
}

async function getSessionUser(token) {
    if (supabase) {
        const { data: session } = await supabase
            .from('sessions')
            .select('*, users(*)')
            .eq('token', token)
            .gt('expires_at', new Date().toISOString())
            .single();
        return session?.users || null;
    } else {
        const session = memoryStore.sessions.get(token);
        if (!session || Date.now() > session.expiresAt) return null;
        return memoryStore.users.get(session.userId) || null;
    }
}

async function deleteSession(token) {
    if (supabase) {
        await supabase.from('sessions').delete().eq('token', token);
    } else {
        memoryStore.sessions.delete(token);
    }
}

// ============================================
// API ROUTES
// ============================================

/**
 * POST /api/auth/send-otp
 */
app.post('/api/auth/send-otp', async (req, res) => {
    try {
        const { phone } = req.body;
        if (!phone) {
            return res.status(400).json({ error: 'Phone number is required' });
        }

        const normalizedPhone = normalizePhone(phone);
        const code = generateOtp();
        const expiresAt = Date.now() + 10 * 60 * 1000;

        await storeOtp(normalizedPhone, code, expiresAt);

        // Send SMS
        const messageOptions = {
            to: normalizedPhone,
            body: `Your Where In World code is: ${code}\n\nExpires in 10 minutes.`
        };

        if (messagingServiceSid) {
            messageOptions.messagingServiceSid = messagingServiceSid;
        } else if (twilioPhoneNumber) {
            messageOptions.from = twilioPhoneNumber;
        } else {
            return res.status(500).json({ error: 'Twilio not configured' });
        }

        const message = await twilioClient.messages.create(messageOptions);
        console.log(`OTP sent to ${normalizedPhone}, SID: ${message.sid}`);

        res.json({ success: true, phone: normalizedPhone });

    } catch (error) {
        console.error('Send OTP error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/auth/verify-otp
 */
app.post('/api/auth/verify-otp', async (req, res) => {
    try {
        const { phone, code, name } = req.body;
        if (!phone || !code) {
            return res.status(400).json({ error: 'Phone and code are required' });
        }

        const normalizedPhone = normalizePhone(phone);
        const valid = await verifyOtp(normalizedPhone, code);

        if (!valid) {
            return res.status(401).json({ error: 'Invalid or expired code' });
        }

        // Find or create user
        let user = await findUserByPhone(normalizedPhone);
        if (!user) {
            user = await createUser(normalizedPhone, name);
        } else if (name && !user.display_name) {
            user = await updateUser(user.id, { display_name: name });
        }

        // Create session
        const token = generateToken();
        const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
        await createSession(user.id, token, expiresAt);

        console.log(`User verified: ${normalizedPhone}`);
        res.json({
            success: true,
            user: {
                id: user.id,
                phone: user.phone,
                displayName: user.display_name
            },
            sessionToken: token
        });

    } catch (error) {
        console.error('Verify OTP error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/auth/session
 */
app.get('/api/auth/session', async (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await getSessionUser(token);
    if (!user) {
        return res.status(401).json({ error: 'Session expired' });
    }

    res.json({
        user: {
            id: user.id,
            phone: user.phone,
            displayName: user.display_name
        }
    });
});

/**
 * POST /api/auth/update-name
 * Update user's display name (called after OTP verification for new users)
 */
app.post('/api/auth/update-name', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const { userId, displayName } = req.body;
        if (!userId || !displayName) {
            return res.status(400).json({ error: 'User ID and display name are required' });
        }

        // Verify session
        const sessionUser = await getSessionUser(token);
        if (!sessionUser || sessionUser.id !== userId) {
            return res.status(401).json({ error: 'Invalid session' });
        }

        // Update user
        const user = await updateUser(userId, { display_name: displayName });

        console.log(`User name updated: ${userId} -> ${displayName}`);
        res.json({
            success: true,
            user: {
                id: user.id,
                phone: user.phone,
                displayName: user.display_name
            }
        });

    } catch (error) {
        console.error('Update name error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/auth/logout
 */
app.post('/api/auth/logout', async (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token) {
        await deleteSession(token);
    }
    res.json({ success: true });
});

/**
 * Health check
 */
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        database: supabase ? 'supabase' : 'memory',
        twilio: messagingServiceSid ? 'messaging-service' : twilioPhoneNumber ? 'phone-number' : 'not-configured'
    });
});

// Cleanup expired records periodically
setInterval(async () => {
    if (supabase) {
        await supabase.rpc('cleanup_expired_records');
    } else {
        const now = Date.now();
        for (const [phone, data] of memoryStore.otpCodes.entries()) {
            if (now > data.expiresAt) memoryStore.otpCodes.delete(phone);
        }
        for (const [token, data] of memoryStore.sessions.entries()) {
            if (now > data.expiresAt) memoryStore.sessions.delete(token);
        }
    }
}, 5 * 60 * 1000);

app.listen(PORT, () => {
    console.log(`🚀 Server: http://localhost:${PORT}`);
    console.log(`💾 Database: ${supabase ? 'Supabase' : 'In-memory'}`);
});
