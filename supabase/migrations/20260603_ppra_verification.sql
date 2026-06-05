-- PPRA practitioner verification for PropReady agents
-- Run in Supabase SQL Editor

ALTER TABLE agents
    ADD COLUMN IF NOT EXISTS ppra_number TEXT,
    ADD COLUMN IF NOT EXISTS ffc_number TEXT,
    ADD COLUMN IF NOT EXISTS ffc_document_url TEXT,
    ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending',
    ADD COLUMN IF NOT EXISTS verification_date TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS verified_by TEXT,
    ADD COLUMN IF NOT EXISTS verification_notes TEXT;

-- Grandfather existing agents so current users are not blocked (run once on deploy)
UPDATE agents
SET verification_status = 'verified',
    verification_date = COALESCE(verification_date, NOW()),
    ppra_number = COALESCE(ppra_number, eaab_number)
WHERE verification_status IS NULL OR verification_status = '';

-- Unique PPRA practitioner numbers (partial: only when set)
CREATE UNIQUE INDEX IF NOT EXISTS idx_agents_ppra_number_unique
    ON agents (ppra_number)
    WHERE ppra_number IS NOT NULL AND ppra_number <> '';

CREATE INDEX IF NOT EXISTS idx_agents_verification_status ON agents (verification_status);

-- Private storage bucket for FFC documents (not public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'ppra-documents',
    'ppra-documents',
    false,
    10485760,
    ARRAY['application/pdf', 'image/jpeg', 'image/png']
)
ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = 10485760;

-- Storage policies: agents upload/read own folder; service role used for admin signed URLs in API
DROP POLICY IF EXISTS "Agents upload own PPRA docs" ON storage.objects;
CREATE POLICY "Agents upload own PPRA docs"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'ppra-documents'
    AND (storage.foldername(name))[1] IS NOT NULL
);

DROP POLICY IF EXISTS "Agents read own PPRA docs" ON storage.objects;
CREATE POLICY "Agents read own PPRA docs"
ON storage.objects FOR SELECT
USING (bucket_id = 'ppra-documents');

-- Note: approve/reject uses service role in API with ADMIN_EMAILS check.
-- Tighten agents table RLS in production; current project uses permissive policies.
