import { createClient } from '@supabase/supabase-js';

// For demo mode, we'll use localStorage as a mock backend
// Replace these with your actual Supabase credentials when ready
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://demo.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'demo-key';

// Backend API URL for Twilio auth
// In production (Vercel), always use relative path (empty string)
// In dev, optionally use VITE_API_URL if you have a separate backend server
const API_URL = import.meta.env.PROD ? '' : (import.meta.env.VITE_API_URL || '');

// Only create real client if we have valid credentials
const hasValidCredentials = SUPABASE_URL !== 'https://demo.supabase.co';
// In production, always use backend API (serverless functions at /api)
const hasBackend = import.meta.env.PROD || !!API_URL;

export const supabase = hasValidCredentials
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;


/**
 * Demo/Local Storage Backend
 * This allows the app to work without a Supabase backend
 */
class LocalStorageBackend {
    constructor() {
        this.storageKey = 'whereinworld_data';
        this.data = this.load();
    }

    load() {
        try {
            return JSON.parse(localStorage.getItem(this.storageKey)) || {
                users: {},
                locations: {},
                contacts: {}
            };
        } catch {
            return { users: {}, locations: {}, contacts: {} };
        }
    }

    save() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.data));
    }

    // User methods
    async getUser(userId) {
        return this.data.users[userId] || null;
    }

    async createUser(user) {
        this.data.users[user.id] = { ...user, createdAt: new Date().toISOString() };
        this.save();
        return this.data.users[user.id];
    }

    async updateUser(userId, updates) {
        if (this.data.users[userId]) {
            this.data.users[userId] = { ...this.data.users[userId], ...updates };
            this.save();
        }
        return this.data.users[userId];
    }

    // Location methods
    async getLocation(userId) {
        return this.data.locations[userId] || null;
    }

    async updateLocation(userId, location) {
        this.data.locations[userId] = {
            ...location,
            userId,
            updatedAt: new Date().toISOString()
        };
        this.save();
        return this.data.locations[userId];
    }

    async getAllLocations() {
        return Object.values(this.data.locations);
    }

    // Contact methods
    async getContacts(userId) {
        return this.data.contacts[userId] || [];
    }

    async setContacts(userId, contacts) {
        this.data.contacts[userId] = contacts;
        this.save();
        return contacts;
    }

    // Get friends (users who are in your contacts AND have the app)
    async getFriends(userId) {
        const contacts = this.data.contacts[userId] || [];
        const friends = [];

        for (const contact of contacts) {
            // Find user by phone number
            const user = Object.values(this.data.users).find(
                u => u.phone === contact.phone
            );
            if (user) {
                const location = this.data.locations[user.id];
                friends.push({
                    ...user,
                    location: location || null
                });
            }
        }

        return friends;
    }
}

export const localBackend = new LocalStorageBackend();

// Session token storage key
const SESSION_TOKEN_KEY = 'whereinworld_session_token';

/**
 * API wrapper that uses backend if available, Supabase, otherwise localStorage
 */
export const api = {
    async getCurrentUser() {
        // Check for backend session first
        if (hasBackend) {
            const token = localStorage.getItem(SESSION_TOKEN_KEY);
            if (token) {
                try {
                    const res = await fetch(`${API_URL}/api/auth/session`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (res.ok) {
                        const { user } = await res.json();
                        return user;
                    }
                    // Invalid token, clear it
                    localStorage.removeItem(SESSION_TOKEN_KEY);
                } catch (e) {
                    console.warn('Session check failed:', e);
                }
            }
            // Not logged in via backend
            return null;
        }

        if (supabase) {
            const { data: { user } } = await supabase.auth.getUser();
            return user;
        }
        const userId = localStorage.getItem('whereinworld_user_id');
        return userId ? await localBackend.getUser(userId) : null;
    },

    // Send OTP to phone number (returns true if sent, user should enter code)
    async sendOtp(phone) {
        if (hasBackend) {
            const res = await fetch(`${API_URL}/api/auth/send-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to send OTP');
            return { success: true, phone: data.phone };
        }

        if (supabase) {
            // Use Supabase phone auth
            const { error } = await supabase.auth.signInWithOtp({ phone });
            if (error) throw error;
            return { success: true, phone };
        }

        // Demo mode: skip OTP, just return success
        return { success: true, phone, demoMode: true };
    },

    // Verify OTP code and complete login
    async verifyOtp(phone, code, name) {
        if (hasBackend) {
            const res = await fetch(`${API_URL}/api/auth/verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, code, name })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Invalid code');

            // Store session token
            localStorage.setItem(SESSION_TOKEN_KEY, data.sessionToken);
            return data.user;
        }

        if (supabase) {
            const { data, error } = await supabase.auth.verifyOtp({
                phone,
                token: code,
                type: 'sms'
            });
            if (error) throw error;
            return data.user;
        }

        // Demo mode: create/get user by phone (no real OTP)
        let user = Object.values(localBackend.data.users).find(u => u.phone === phone);
        if (!user) {
            const id = 'user_' + Math.random().toString(36).substr(2, 9);
            user = await localBackend.createUser({ id, phone, displayName: name });
        }
        localStorage.setItem('whereinworld_user_id', user.id);
        return user;
    },

    // Update user's display name (called after OTP verification for new users)
    async updateUserName(userId, displayName) {
        if (hasBackend) {
            const token = localStorage.getItem(SESSION_TOKEN_KEY);
            const res = await fetch(`${API_URL}/api/auth/update-name`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ userId, displayName })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to update name');
            return data.user;
        }

        if (supabase) {
            const { data, error } = await supabase
                .from('users')
                .update({ display_name: displayName })
                .eq('id', userId)
                .select()
                .single();
            if (error) throw error;
            return { id: data.id, phone: data.phone, displayName: data.display_name };
        }

        // Demo mode
        const user = await localBackend.updateUser(userId, { displayName });
        return user;
    },

    // Legacy signIn for demo mode compatibility
    async signIn(phone, name) {
        // In demo mode, just create/login user directly
        return this.verifyOtp(phone, '000000', name);
    },

    async signOut() {
        if (hasBackend) {
            const token = localStorage.getItem(SESSION_TOKEN_KEY);
            if (token) {
                try {
                    await fetch(`${API_URL}/api/auth/logout`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                } catch (e) {
                    console.warn('Logout request failed:', e);
                }
            }
            localStorage.removeItem(SESSION_TOKEN_KEY);
        }
        if (supabase) {
            await supabase.auth.signOut();
        }
        localStorage.removeItem('whereinworld_user_id');
    },

    async updateLocation(location) {
        const user = await this.getCurrentUser();
        if (!user) throw new Error('Not authenticated');

        if (supabase) {
            const { error } = await supabase
                .from('locations')
                .upsert({ user_id: user.id, ...location });
            if (error) throw error;
        } else {
            await localBackend.updateLocation(user.id, location);
        }
        return location;
    },

    async getFriends() {
        const user = await this.getCurrentUser();
        if (!user) return [];

        if (supabase) {
            // Complex query to join contacts, users, and locations
            const { data, error } = await supabase.rpc('get_friends_with_locations', {
                user_id: user.id
            });
            if (error) throw error;
            return data;
        }
        return localBackend.getFriends(user.id);
    },

    async syncContacts(contacts) {
        const user = await this.getCurrentUser();
        if (!user) throw new Error('Not authenticated');

        const normalized = contacts.map(c => ({
            name: c.name,
            phone: normalizePhone(c.phone)
        }));

        if (supabase) {
            const { error } = await supabase
                .from('contacts')
                .upsert(normalized.map(c => ({
                    user_id: user.id,
                    contact_phone: c.phone
                })));
            if (error) throw error;
        } else {
            await localBackend.setContacts(user.id, normalized);
        }

        // Cache locally for quick access
        localStorage.setItem('whereinworld_contacts', JSON.stringify(normalized));
        return normalized;
    },

    async getContacts() {
        const cached = localStorage.getItem('whereinworld_contacts');
        return cached ? JSON.parse(cached) : [];
    },

    // ============================================
    // INVITE API METHODS
    // ============================================

    async createInvite() {
        if (hasBackend) {
            const token = localStorage.getItem(SESSION_TOKEN_KEY);
            const res = await fetch(`${API_URL}/api/invite/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to create invite');
            return data;
        }
        // Demo mode: generate mock invite
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        return {
            success: true,
            invite: {
                code,
                url: `${window.location.origin}/join/${code}`,
                createdAt: new Date().toISOString()
            }
        };
    },

    async sendInviteSms(phone) {
        if (hasBackend) {
            const token = localStorage.getItem(SESSION_TOKEN_KEY);
            const res = await fetch(`${API_URL}/api/invite/send-sms`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ phone })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to send invite');
            return data;
        }
        // Demo mode: just return success
        return { success: true, testMode: true };
    },

    async lookupInvite(code) {
        const res = await fetch(`${API_URL}/api/invite/lookup?code=${code}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Invalid invite');
        return data;
    },

    async acceptInvite(code) {
        if (hasBackend) {
            const token = localStorage.getItem(SESSION_TOKEN_KEY);
            const res = await fetch(`${API_URL}/api/invite/accept`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ code })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to accept invite');
            return data;
        }
        return { success: true };
    },

    async getMyInvites() {
        if (hasBackend) {
            const token = localStorage.getItem(SESSION_TOKEN_KEY);
            const res = await fetch(`${API_URL}/api/invite/my-invites`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to get invites');
            return data.invites || [];
        }
        return [];
    }
};

// Normalize phone numbers to E.164 format
function normalizePhone(phone) {
    // Remove all non-digit characters
    let digits = phone.replace(/\D/g, '');

    // If it doesn't start with country code, assume US (+1)
    if (digits.length === 10) {
        digits = '1' + digits;
    }

    return '+' + digits;
}

// Export for demo mode setup (demo mode is when neither backend nor Supabase is configured)
export function isDemoMode() {
    return !hasValidCredentials && !hasBackend;
}
