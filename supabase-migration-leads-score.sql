-- Run in Supabase SQL Editor to ensure PropReady score and prequal amount are stored for buyers.
-- Required for agents to see buyer PropReady scores.

ALTER TABLE leads ADD COLUMN IF NOT EXISTS score INTEGER;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS pre_qual_amount INTEGER;

CREATE INDEX IF NOT EXISTS idx_leads_score ON leads(score);
