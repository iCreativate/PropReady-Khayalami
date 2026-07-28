ALTER TABLE agents
ADD COLUMN IF NOT EXISTS plan_status TEXT NOT NULL DEFAULT 'trialing',
ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS plan_activated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS plan_activated_by TEXT;

UPDATE agents
SET
    plan_status = COALESCE(NULLIF(plan_status, ''), 'trialing'),
    trial_started_at = COALESCE(trial_started_at, created_at, NOW()),
    trial_ends_at = COALESCE(trial_ends_at, COALESCE(created_at, NOW()) + INTERVAL '7 days')
WHERE
    trial_started_at IS NULL
    OR trial_ends_at IS NULL
    OR plan_status IS NULL
    OR plan_status = '';

ALTER TABLE agents
DROP CONSTRAINT IF EXISTS agents_plan_status_check;

ALTER TABLE agents
ADD CONSTRAINT agents_plan_status_check
CHECK (plan_status IN ('trialing', 'active', 'payment_pending'));
