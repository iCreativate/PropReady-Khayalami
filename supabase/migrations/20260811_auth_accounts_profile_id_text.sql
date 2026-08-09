-- Buyer/seller profiles use text ids (e.g. user-173… from the quiz).
-- auth_accounts.profile_id was UUID, which blocked staff impersonation and auth linking.

ALTER TABLE auth_accounts
    ALTER COLUMN profile_id TYPE TEXT USING profile_id::text;

COMMENT ON COLUMN auth_accounts.profile_id IS 'Profile row id in users/agents/originators/conveyancers (text or uuid string).';
