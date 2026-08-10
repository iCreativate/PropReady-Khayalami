-- Track last successful login and explicit logout for admin visibility.
ALTER TABLE auth_accounts
    ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS last_logout_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_auth_accounts_last_login
    ON auth_accounts (last_login_at DESC NULLS LAST);
