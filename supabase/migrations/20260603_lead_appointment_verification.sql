-- Lead verification via dual-party appointment confirmation
-- Run in Supabase SQL Editor

ALTER TABLE leads
    ADD COLUMN IF NOT EXISTS appointment_verified BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS verified_viewing_id TEXT;

ALTER TABLE viewing_appointments
    ADD COLUMN IF NOT EXISTS buyer_lead_id TEXT,
    ADD COLUMN IF NOT EXISTS seller_lead_id TEXT,
    ADD COLUMN IF NOT EXISTS buyer_name TEXT,
    ADD COLUMN IF NOT EXISTS buyer_email TEXT,
    ADD COLUMN IF NOT EXISTS buyer_phone TEXT,
    ADD COLUMN IF NOT EXISTS seller_name TEXT,
    ADD COLUMN IF NOT EXISTS seller_email TEXT,
    ADD COLUMN IF NOT EXISTS seller_phone TEXT,
    ADD COLUMN IF NOT EXISTS buyer_confirmed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS seller_confirmed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_viewing_buyer_email ON viewing_appointments(buyer_email);
CREATE INDEX IF NOT EXISTS idx_viewing_seller_email ON viewing_appointments(seller_email);
CREATE INDEX IF NOT EXISTS idx_leads_appointment_verified ON leads(appointment_verified);
