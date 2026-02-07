-- Run this in Supabase SQL Editor to enable viewings in the database.
-- Creates viewing_appointments table (standalone, no FK to properties/users).

CREATE TABLE IF NOT EXISTS viewing_appointments (
    id TEXT PRIMARY KEY,
    property_id TEXT NOT NULL,
    property_title TEXT NOT NULL,
    property_address TEXT,
    property_price DECIMAL(12, 2),
    agent_id TEXT,
    contact_name TEXT NOT NULL,
    contact_email TEXT NOT NULL,
    contact_phone TEXT,
    contact_type TEXT NOT NULL DEFAULT 'buyer',  -- 'buyer' | 'seller'
    viewing_date TEXT NOT NULL,   -- YYYY-MM-DD
    viewing_time TEXT NOT NULL,   -- HH:MM
    status TEXT NOT NULL DEFAULT 'scheduled',   -- scheduled, confirmed, completed, cancelled
    notes TEXT,
    chat_messages JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add property_price for existing installations (PostgreSQL 9.5+)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='viewing_appointments' AND column_name='property_price') THEN
        ALTER TABLE viewing_appointments ADD COLUMN property_price DECIMAL(12, 2);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='viewing_appointments' AND column_name='chat_messages') THEN
        ALTER TABLE viewing_appointments ADD COLUMN chat_messages JSONB DEFAULT '[]';
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_viewing_appointments_agent_id ON viewing_appointments(agent_id);
CREATE INDEX IF NOT EXISTS idx_viewing_appointments_contact_email ON viewing_appointments(contact_email);
CREATE INDEX IF NOT EXISTS idx_viewing_appointments_contact_type ON viewing_appointments(contact_type);

-- Enable RLS and allow all (adjust for production)
ALTER TABLE viewing_appointments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations on viewing_appointments" ON viewing_appointments;
CREATE POLICY "Allow all operations on viewing_appointments" ON viewing_appointments FOR ALL USING (true) WITH CHECK (true);
