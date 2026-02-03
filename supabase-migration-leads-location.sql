-- Run in Supabase SQL Editor to add location columns for buyer/seller proximity matching.
-- Agents can filter leads by city/area.

ALTER TABLE leads ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

CREATE INDEX IF NOT EXISTS idx_leads_city ON leads(city);
