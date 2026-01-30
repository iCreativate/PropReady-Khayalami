-- Run this in Supabase SQL Editor if seller leads are not saving.
-- This adds lead_type and seller columns to the existing leads table.

ALTER TABLE leads ADD COLUMN IF NOT EXISTS lead_type TEXT DEFAULT 'buyer';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS property_address TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS property_type TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS bedrooms TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS bathrooms TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS property_size TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS current_value TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS reason_for_selling TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS timeline TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS has_bond BOOLEAN;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS bond_balance TEXT;

-- Set existing rows to buyer if lead_type was just added and is null
UPDATE leads SET lead_type = 'buyer' WHERE lead_type IS NULL;

-- Optional: create index for filtering by type
CREATE INDEX IF NOT EXISTS idx_leads_lead_type ON leads(lead_type);
