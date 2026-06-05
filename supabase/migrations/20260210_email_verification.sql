-- Email verification + agent seller plans
-- Run in Supabase SQL Editor

ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS seller_plan TEXT DEFAULT 'none';

CREATE TABLE IF NOT EXISTS email_verification_codes (
    email TEXT NOT NULL,
    account_type TEXT NOT NULL CHECK (account_type IN ('user', 'agent')),
    code TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (email, account_type)
);

CREATE INDEX IF NOT EXISTS idx_email_verification_expires ON email_verification_codes(expires_at);

-- Existing accounts: treat as verified so they are not locked out
UPDATE users SET email_verified = TRUE WHERE email_verified IS NULL OR email_verified = FALSE;
UPDATE agents SET email_verified = TRUE WHERE email_verified IS NULL OR email_verified = FALSE;
