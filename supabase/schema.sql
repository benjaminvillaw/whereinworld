-- ============================================
-- WHERE IN WORLD - Supabase Database Schema
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE
-- Stores user accounts authenticated via phone
-- ============================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone TEXT UNIQUE NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for phone lookups (used in friend matching)
CREATE INDEX idx_users_phone ON users(phone);

-- ============================================
-- LOCATIONS TABLE
-- Stores user's current city-level location
-- ============================================
CREATE TABLE locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    city TEXT NOT NULL,
    country TEXT NOT NULL,
    lat DECIMAL(10, 7) NOT NULL,
    lng DECIMAL(10, 7) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id)  -- One location per user
);

-- Index for user lookups
CREATE INDEX idx_locations_user_id ON locations(user_id);

-- ============================================
-- CONTACTS TABLE
-- Stores synced phone contacts for friend matching
-- ============================================
CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    contact_name TEXT NOT NULL,
    contact_phone TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, contact_phone)  -- No duplicate contacts per user
);

-- Index for friend matching queries
CREATE INDEX idx_contacts_user_id ON contacts(user_id);
CREATE INDEX idx_contacts_phone ON contacts(contact_phone);

-- ============================================
-- OTP_CODES TABLE
-- Stores temporary verification codes
-- ============================================
CREATE TABLE otp_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone TEXT NOT NULL,
    code TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for OTP lookups
CREATE INDEX idx_otp_codes_phone ON otp_codes(phone);
CREATE INDEX idx_otp_codes_expires_at ON otp_codes(expires_at);

-- ============================================
-- SESSIONS TABLE
-- Stores user sessions (alternative to Supabase Auth)
-- ============================================
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for session lookups
CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to get friends with their locations
-- Returns contacts who also have accounts, with location data
CREATE OR REPLACE FUNCTION get_friends_with_locations(p_user_id UUID)
RETURNS TABLE (
    id UUID,
    phone TEXT,
    display_name TEXT,
    avatar_url TEXT,
    city TEXT,
    country TEXT,
    lat DECIMAL,
    lng DECIMAL,
    location_updated_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.phone,
        u.display_name,
        u.avatar_url,
        l.city,
        l.country,
        l.lat,
        l.lng,
        l.updated_at as location_updated_at
    FROM contacts c
    JOIN users u ON u.phone = c.contact_phone
    LEFT JOIN locations l ON l.user_id = u.id
    WHERE c.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up expired OTPs and sessions
CREATE OR REPLACE FUNCTION cleanup_expired_records()
RETURNS void AS $$
BEGIN
    DELETE FROM otp_codes WHERE expires_at < NOW();
    DELETE FROM sessions WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (id = auth.uid());

-- Users can manage their own location
CREATE POLICY "Users can view own location" ON locations
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can upsert own location" ON locations
    FOR ALL USING (user_id = auth.uid());

-- Users can view friends' locations (contacts who have accounts)
CREATE POLICY "Users can view friends locations" ON locations
    FOR SELECT USING (
        user_id IN (
            SELECT u.id FROM users u
            JOIN contacts c ON c.contact_phone = u.phone
            WHERE c.user_id = auth.uid()
        )
    );

-- Users can manage their own contacts
CREATE POLICY "Users can manage own contacts" ON contacts
    FOR ALL USING (user_id = auth.uid());

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER locations_updated_at
    BEFORE UPDATE ON locations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
