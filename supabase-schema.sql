-- PropReady Database Schema
-- Run this SQL in your Supabase SQL Editor to create the necessary tables

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    password TEXT NOT NULL, -- In production, use proper hashing
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quiz Results table
CREATE TABLE IF NOT EXISTS quiz_results (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT,
    phone TEXT,
    monthly_income TEXT,
    expenses TEXT,
    has_debt BOOLEAN,
    deposit_saved TEXT,
    credit_score TEXT,
    employment_status TEXT,
    score INTEGER,
    pre_qual_amount INTEGER,
    selected_originator TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agents table
CREATE TABLE IF NOT EXISTS agents (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT NOT NULL,
    eaab_number TEXT NOT NULL,
    company TEXT NOT NULL,
    password TEXT NOT NULL, -- In production, use proper hashing
    status TEXT DEFAULT 'pending', -- pending, approved, rejected
    plan TEXT DEFAULT 'free', -- free (3 leads), pro (50), enterprise (unlimited)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- pre-qualification, id, income, bank-statement, other
    status TEXT DEFAULT 'uploaded', -- uploaded, pending, verified
    size TEXT,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Properties table
CREATE TABLE IF NOT EXISTS properties (
    id TEXT PRIMARY KEY,
    agent_id TEXT REFERENCES agents(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    address TEXT NOT NULL,
    type TEXT NOT NULL, -- house, apartment, townhouse, etc.
    price DECIMAL(12, 2) NOT NULL,
    bedrooms INTEGER,
    bathrooms INTEGER,
    size DECIMAL(10, 2), -- in square meters
    description TEXT,
    images TEXT[], -- Array of image URLs
    status TEXT DEFAULT 'active', -- active, sold, removed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Leads table (buyers, sellers, investors). agent_id optional (NULL = shared pool).
CREATE TABLE IF NOT EXISTS leads (
    id TEXT PRIMARY KEY,
    agent_id TEXT REFERENCES agents(id) ON DELETE CASCADE,
    lead_type TEXT NOT NULL DEFAULT 'buyer',  -- 'buyer' | 'seller' | 'investor'
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    -- buyer/investor fields
    monthly_income TEXT,
    deposit_saved TEXT,
    employment_status TEXT,
    credit_score TEXT,
    score INTEGER,
    pre_qual_amount INTEGER,
    -- seller fields (nullable for buyers)
    property_address TEXT,
    property_type TEXT,
    bedrooms TEXT,
    bathrooms TEXT,
    property_size TEXT,
    land_size TEXT,
    building_size TEXT,
    current_value TEXT,
    reason_for_selling TEXT,
    timeline TEXT,
    has_bond BOOLEAN,
    bond_balance TEXT,
    status TEXT DEFAULT 'new',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Viewings table
CREATE TABLE IF NOT EXISTS viewings (
    id TEXT PRIMARY KEY,
    property_id TEXT REFERENCES properties(id) ON DELETE CASCADE,
    agent_id TEXT REFERENCES agents(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    contact_name TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    viewing_date TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'pending', -- pending, confirmed, completed, cancelled
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_quiz_results_user_id ON quiz_results(user_id);
CREATE INDEX IF NOT EXISTS idx_agents_email ON agents(email);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_properties_agent_id ON properties(agent_id);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_leads_agent_id ON leads(agent_id);
CREATE INDEX IF NOT EXISTS idx_leads_lead_type ON leads(lead_type);
CREATE INDEX IF NOT EXISTS idx_viewings_property_id ON viewings(property_id);
CREATE INDEX IF NOT EXISTS idx_viewings_user_id ON viewings(user_id);

-- Enable Row Level Security (RLS) - adjust policies as needed
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE viewings ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (adjust based on your security requirements)
-- For now, allow all operations - you should restrict these in production
CREATE POLICY "Allow all operations on users" ON users FOR ALL USING (true);
CREATE POLICY "Allow all operations on quiz_results" ON quiz_results FOR ALL USING (true);
CREATE POLICY "Allow all operations on agents" ON agents FOR ALL USING (true);
CREATE POLICY "Allow all operations on documents" ON documents FOR ALL USING (true);
CREATE POLICY "Allow all operations on properties" ON properties FOR ALL USING (true);
CREATE POLICY "Allow all operations on leads" ON leads FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on viewings" ON viewings FOR ALL USING (true);

-- If leads table already existed with agent_id NOT NULL, allow shared leads:
-- ALTER TABLE leads ALTER COLUMN agent_id DROP NOT NULL;

-- If leads INSERT is blocked by RLS, run this in Supabase SQL Editor:
-- DROP POLICY IF EXISTS "Allow all operations on leads" ON leads;
-- CREATE POLICY "Allow all operations on leads" ON leads FOR ALL USING (true) WITH CHECK (true);

-- If you already have a leads table, add lead_type and seller columns (run in Supabase SQL Editor):
-- ALTER TABLE leads ADD COLUMN IF NOT EXISTS lead_type TEXT DEFAULT 'buyer';
-- ALTER TABLE leads ADD COLUMN IF NOT EXISTS property_address TEXT;
-- ALTER TABLE leads ADD COLUMN IF NOT EXISTS property_type TEXT;
-- ALTER TABLE leads ADD COLUMN IF NOT EXISTS bedrooms TEXT;
-- ALTER TABLE leads ADD COLUMN IF NOT EXISTS bathrooms TEXT;
-- ALTER TABLE leads ADD COLUMN IF NOT EXISTS property_size TEXT;
-- ALTER TABLE leads ADD COLUMN IF NOT EXISTS current_value TEXT;
-- ALTER TABLE leads ADD COLUMN IF NOT EXISTS reason_for_selling TEXT;
-- ALTER TABLE leads ADD COLUMN IF NOT EXISTS timeline TEXT;
-- ALTER TABLE leads ADD COLUMN IF NOT EXISTS has_bond BOOLEAN;
-- ALTER TABLE leads ADD COLUMN IF NOT EXISTS bond_balance TEXT;
