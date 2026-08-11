-- Durable Property Companion™ workspace per consumer account (survives browser clears / new devices).
CREATE TABLE IF NOT EXISTS property_companion_workspaces (
    account_id UUID PRIMARY KEY REFERENCES auth_accounts(id) ON DELETE CASCADE,
    profile_id TEXT NOT NULL,
    email TEXT NOT NULL,
    state JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_property_companion_profile
    ON property_companion_workspaces (profile_id);

CREATE INDEX IF NOT EXISTS idx_property_companion_email
    ON property_companion_workspaces (lower(email));

ALTER TABLE property_companion_workspaces ENABLE ROW LEVEL SECURITY;

-- API uses the service role; block direct anon/authenticated table access.
CREATE POLICY property_companion_workspaces_service
    ON property_companion_workspaces
    FOR ALL
    USING (false);
