-- Agent registration role: practicing agent vs principal

ALTER TABLE agents
    ADD COLUMN IF NOT EXISTS registration_role TEXT DEFAULT 'agent';

UPDATE agents
SET registration_role = 'agent'
WHERE registration_role IS NULL OR registration_role = '';

ALTER TABLE agents DROP CONSTRAINT IF EXISTS agents_registration_role_check;
ALTER TABLE agents
    ADD CONSTRAINT agents_registration_role_check
    CHECK (registration_role IN ('agent', 'principal'));
