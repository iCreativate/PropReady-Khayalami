-- Run this in Supabase SQL Editor to add agent plan tiers.
-- Agents register for free and get 3 leads on Free plan; upgrade to Pro/Enterprise for more.

ALTER TABLE agents ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free';

-- plan values: 'free' (3 leads), 'pro' (50 leads), 'enterprise' (unlimited)
-- Set existing agents to free if null
UPDATE agents SET plan = 'free' WHERE plan IS NULL;

CREATE INDEX IF NOT EXISTS idx_agents_plan ON agents(plan);
