-- Run this in Supabase SQL Editor to store listed properties in the database.
-- Properties will then appear on the search page across all browsers/devices.
--
-- IMPORTANT: In Supabase Table Editor, look for "listed_properties" (not "properties").
-- After running, test at: https://your-site.netlify.app/api/properties/debug?testWrite=1

CREATE TABLE IF NOT EXISTS listed_properties (
    id TEXT PRIMARY KEY,
    agent_id TEXT,
    title TEXT NOT NULL,
    address TEXT NOT NULL,
    type TEXT NOT NULL,
    price DECIMAL(12, 2) NOT NULL,
    bedrooms INTEGER,
    bathrooms INTEGER,
    size DECIMAL(10, 2),
    description TEXT,
    images TEXT[],
    features TEXT[],
    video_url TEXT,
    published BOOLEAN DEFAULT true,
    listing_score INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_listed_properties_agent_id ON listed_properties(agent_id);
CREATE INDEX IF NOT EXISTS idx_listed_properties_published ON listed_properties(published);

ALTER TABLE listed_properties ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations on listed_properties" ON listed_properties;
CREATE POLICY "Allow all operations on listed_properties" ON listed_properties FOR ALL USING (true) WITH CHECK (true);
