-- Ensure verification codes support all account types used by the app
ALTER TABLE email_verification_codes DROP CONSTRAINT IF EXISTS email_verification_codes_account_type_check;
ALTER TABLE email_verification_codes
    ADD CONSTRAINT email_verification_codes_account_type_check
    CHECK (account_type IN ('user', 'agent', 'originator'));
