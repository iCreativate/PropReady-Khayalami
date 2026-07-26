-- PropReady: bond originator portal (create tables + staff number + pending approval)
-- Paste this entire script into Supabase SQL Editor and run once.

-- 1) Allow originator account type (skip safely if auth_accounts is missing)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'auth_accounts'
    ) THEN
        ALTER TABLE auth_accounts DROP CONSTRAINT IF EXISTS auth_accounts_account_type_check;
        ALTER TABLE auth_accounts
            ADD CONSTRAINT auth_accounts_account_type_check
            CHECK (account_type IN ('user', 'agent', 'originator'));
    END IF;
END $$;

-- 2) Originator staff profiles
CREATE TABLE IF NOT EXISTS originators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    phone TEXT,
    organization_id TEXT NOT NULL,
    staff_number TEXT,
    password TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Upgrade older installs that already created originators without staff_number / pending default
ALTER TABLE originators ADD COLUMN IF NOT EXISTS staff_number TEXT;
ALTER TABLE originators ALTER COLUMN status SET DEFAULT 'pending';
UPDATE originators
SET status = 'pending'
WHERE lower(coalesce(status, '')) IN ('', 'active');

CREATE INDEX IF NOT EXISTS idx_originators_org ON originators (organization_id);
CREATE INDEX IF NOT EXISTS idx_originators_email ON originators (LOWER(email));
CREATE UNIQUE INDEX IF NOT EXISTS idx_originators_org_staff_unique
    ON originators (organization_id, lower(staff_number))
    WHERE staff_number IS NOT NULL AND staff_number <> '';

-- 3) Prequal engagement cases
CREATE TABLE IF NOT EXISTS prequal_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_user_id UUID NOT NULL,
    organization_id TEXT NOT NULL,
    assigned_originator_id UUID REFERENCES originators(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'submitted'
        CHECK (status IN ('submitted', 'in_review', 'awaiting_documents', 'result_ready', 'closed')),
    soft_amount NUMERIC,
    official_amount NUMERIC,
    result_letter_path TEXT,
    result_notes TEXT,
    buyer_name TEXT,
    buyer_email TEXT,
    buyer_phone TEXT,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prequal_cases_org ON prequal_cases (organization_id, status);
CREATE INDEX IF NOT EXISTS idx_prequal_cases_buyer ON prequal_cases (buyer_user_id);

CREATE TABLE IF NOT EXISTS prequal_case_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES prequal_cases(id) ON DELETE CASCADE,
    document_id TEXT NOT NULL,
    document_name TEXT,
    document_type TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (case_id, document_id)
);

CREATE INDEX IF NOT EXISTS idx_prequal_case_docs_case ON prequal_case_documents (case_id);

CREATE TABLE IF NOT EXISTS prequal_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES prequal_cases(id) ON DELETE CASCADE,
    sender_role TEXT NOT NULL CHECK (sender_role IN ('buyer', 'originator')),
    sender_profile_id UUID NOT NULL,
    sender_name TEXT,
    body TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prequal_messages_case ON prequal_messages (case_id, created_at);

CREATE TABLE IF NOT EXISTS prequal_document_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES prequal_cases(id) ON DELETE CASCADE,
    doc_type TEXT NOT NULL DEFAULT 'other',
    label TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'requested'
        CHECK (status IN ('requested', 'uploaded', 'waived')),
    fulfilled_document_id TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prequal_doc_req_case ON prequal_document_requests (case_id, status);

-- 4) Storage bucket for originator-issued prequal letters
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'prequal-letters',
    'prequal-letters',
    false,
    3145728,
    ARRAY['application/pdf', 'image/jpeg', 'image/png']
)
ON CONFLICT (id) DO UPDATE SET
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types,
    public = EXCLUDED.public;
