-- supabase/migrations/20260715000000_device_trust_and_mfa.sql

-- 1. Create login_history table
CREATE TABLE IF NOT EXISTS public.login_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    ip_address VARCHAR(100),
    user_agent TEXT,
    status VARCHAR(50) NOT NULL CONSTRAINT check_status CHECK (status IN ('success', 'failed', '2fa_pending')),
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create trusted_devices table
CREATE TABLE IF NOT EXISTS public.trusted_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    device_id VARCHAR(255) NOT NULL,
    device_name VARCHAR(255) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
    last_used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_device UNIQUE (user_id, device_id)
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.login_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trusted_devices ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for login_history
-- Allow individual users to select their own login history
CREATE POLICY select_own_login_history ON public.login_history
    FOR SELECT
    USING (auth.uid() = user_id);

-- Allow server/admin/service_role (and anon during logging attempt from API routes) to insert logs
CREATE POLICY insert_login_history ON public.login_history
    FOR INSERT
    WITH CHECK (true);

-- 5. RLS Policies for trusted_devices
-- Allow users to manage their own trusted devices
CREATE POLICY manage_own_trusted_devices ON public.trusted_devices
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Allow service_role bypass for administrative actions
CREATE POLICY service_role_all ON public.trusted_devices
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY service_role_login_history ON public.login_history
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
