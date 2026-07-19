-- Track whether passwordless/OAuth users finished identity verification

ALTER TABLE auth_accounts
    ADD COLUMN IF NOT EXISTS profile_completed_at TIMESTAMPTZ;

-- Magic-link sessions start with password_ok=false until the user sets/confirms a password
ALTER TABLE auth_sessions
    ADD COLUMN IF NOT EXISTS password_ok BOOLEAN NOT NULL DEFAULT TRUE;

-- First-time magic-link/OAuth onboarding (buyer prequal or seller property).
-- Existing learner-hub / quiz / password users leave these NULL and are never gated.
ALTER TABLE auth_accounts
    ADD COLUMN IF NOT EXISTS onboarding_intent TEXT
        CHECK (onboarding_intent IS NULL OR onboarding_intent IN ('buyer', 'seller'));

ALTER TABLE auth_accounts
    ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;

