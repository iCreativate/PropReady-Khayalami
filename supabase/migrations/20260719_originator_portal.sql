-- Bond originator staff accounts + buyer↔originator prequal cases

-- Widen auth account types
ALTER TABLE auth_accounts DROP CONSTRAINT IF EXISTS auth_accounts_account_type_check;
ALTER TABLE auth_accounts
    ADD CONSTRAINT auth_accounts_account_type_check
    CHECK (account_type IN ('user', 'agent', 'originator'));

-- Originator staff profiles (many per brand organization_id)
CREATE TABLE IF NOT EXISTS originators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    phone TEXT,
    organization_id TEXT NOT NULL,
    password TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_originators_org ON originators (organization_id);
CREATE INDEX IF NOT EXISTS idx_originators_email ON originators (LOWER(email));

-- Prequal engagement cases
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

-- Private bucket for originator-issued prequal letters
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
