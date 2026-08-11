-- Generic account-backed JSON workspaces for dashboard tools (Smart Bond, Learn, PVO, etc.).
CREATE TABLE IF NOT EXISTS user_workspaces (
    account_id UUID NOT NULL REFERENCES auth_accounts(id) ON DELETE CASCADE,
    workspace_key TEXT NOT NULL,
    profile_id TEXT NOT NULL,
    email TEXT NOT NULL,
    state JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (account_id, workspace_key)
);

CREATE INDEX IF NOT EXISTS idx_user_workspaces_profile
    ON user_workspaces (profile_id, workspace_key);

CREATE INDEX IF NOT EXISTS idx_user_workspaces_email
    ON user_workspaces (lower(email), workspace_key);

ALTER TABLE user_workspaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_workspaces_service
    ON user_workspaces
    FOR ALL
    USING (false);
