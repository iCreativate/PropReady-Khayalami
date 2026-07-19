-- Enterprise authentication: credentials, sessions, OAuth, magic links, password resets

CREATE TABLE IF NOT EXISTS auth_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    account_type TEXT NOT NULL CHECK (account_type IN ('user', 'agent')),
    profile_id UUID NOT NULL,
    password_hash TEXT,
    email_verified_at TIMESTAMPTZ,
    password_changed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (email, account_type)
);

CREATE INDEX IF NOT EXISTS idx_auth_accounts_email ON auth_accounts (LOWER(email));
CREATE INDEX IF NOT EXISTS idx_auth_accounts_profile ON auth_accounts (account_type, profile_id);

CREATE TABLE IF NOT EXISTS auth_oauth_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES auth_accounts(id) ON DELETE CASCADE,
    provider TEXT NOT NULL CHECK (provider IN ('google', 'apple', 'microsoft')),
    provider_account_id TEXT NOT NULL,
    provider_email TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (provider, provider_account_id)
);

CREATE INDEX IF NOT EXISTS idx_auth_oauth_account ON auth_oauth_providers (account_id);

CREATE TABLE IF NOT EXISTS auth_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES auth_accounts(id) ON DELETE CASCADE,
    refresh_token_hash TEXT NOT NULL UNIQUE,
    device_fingerprint TEXT,
    user_agent TEXT,
    ip_address TEXT,
    is_trusted BOOLEAN NOT NULL DEFAULT FALSE,
    last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    rotated_from UUID REFERENCES auth_sessions(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auth_sessions_account ON auth_sessions (account_id) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_auth_sessions_expires ON auth_sessions (expires_at) WHERE revoked_at IS NULL;

CREATE TABLE IF NOT EXISTS auth_magic_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    account_type TEXT NOT NULL CHECK (account_type IN ('user', 'agent')),
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auth_magic_links_email ON auth_magic_links (LOWER(email)) WHERE used_at IS NULL;

CREATE TABLE IF NOT EXISTS auth_password_resets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES auth_accounts(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auth_password_resets_account ON auth_password_resets (account_id) WHERE used_at IS NULL;

ALTER TABLE auth_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_oauth_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_magic_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_password_resets ENABLE ROW LEVEL SECURITY;

-- Service role only (API routes use service client)
CREATE POLICY auth_accounts_service ON auth_accounts FOR ALL USING (false);
CREATE POLICY auth_oauth_service ON auth_oauth_providers FOR ALL USING (false);
CREATE POLICY auth_sessions_service ON auth_sessions FOR ALL USING (false);
CREATE POLICY auth_magic_links_service ON auth_magic_links FOR ALL USING (false);
CREATE POLICY auth_password_resets_service ON auth_password_resets FOR ALL USING (false);
