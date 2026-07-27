-- Unified Messages Hub: multi-party conversations, documents, appointments

CREATE TABLE IF NOT EXISTS message_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject TEXT,
    context_type TEXT NOT NULL DEFAULT 'general'
        CHECK (context_type IN ('general', 'lead', 'listing', 'viewing', 'prequal')),
    context_id TEXT,
    created_by_account_type TEXT NOT NULL
        CHECK (created_by_account_type IN ('user', 'agent', 'originator')),
    created_by_profile_id TEXT NOT NULL,
    last_message_at TIMESTAMPTZ,
    last_message_preview TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_message_conversations_last
    ON message_conversations (last_message_at DESC NULLS LAST);

CREATE TABLE IF NOT EXISTS message_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES message_conversations(id) ON DELETE CASCADE,
    account_type TEXT NOT NULL CHECK (account_type IN ('user', 'agent', 'originator')),
    profile_id TEXT NOT NULL,
    display_name TEXT,
    last_read_at TIMESTAMPTZ,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (conversation_id, account_type, profile_id)
);

CREATE INDEX IF NOT EXISTS idx_message_participants_profile
    ON message_participants (account_type, profile_id);

CREATE TABLE IF NOT EXISTS message_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES message_conversations(id) ON DELETE CASCADE,
    kind TEXT NOT NULL DEFAULT 'text'
        CHECK (kind IN ('text', 'document', 'appointment', 'system')),
    body TEXT,
    meta JSONB NOT NULL DEFAULT '{}'::jsonb,
    sender_account_type TEXT
        CHECK (sender_account_type IS NULL OR sender_account_type IN ('user', 'agent', 'originator')),
    sender_profile_id TEXT,
    sender_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_message_items_conversation
    ON message_items (conversation_id, created_at);

CREATE TABLE IF NOT EXISTS message_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES message_conversations(id) ON DELETE CASCADE,
    message_id UUID REFERENCES message_items(id) ON DELETE SET NULL,
    storage_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    mime_type TEXT,
    size_bytes INTEGER,
    uploaded_by_account_type TEXT NOT NULL
        CHECK (uploaded_by_account_type IN ('user', 'agent', 'originator')),
    uploaded_by_profile_id TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_message_documents_conversation
    ON message_documents (conversation_id, created_at DESC);

CREATE TABLE IF NOT EXISTS message_appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES message_conversations(id) ON DELETE CASCADE,
    message_id UUID REFERENCES message_items(id) ON DELETE SET NULL,
    proposed_by_account_type TEXT NOT NULL
        CHECK (proposed_by_account_type IN ('user', 'agent', 'originator')),
    proposed_by_profile_id TEXT NOT NULL,
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ,
    location TEXT,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'proposed'
        CHECK (status IN ('proposed', 'accepted', 'declined', 'cancelled')),
    viewing_id TEXT,
    responded_by_account_type TEXT
        CHECK (responded_by_account_type IS NULL OR responded_by_account_type IN ('user', 'agent', 'originator')),
    responded_by_profile_id TEXT,
    responded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_message_appointments_conversation
    ON message_appointments (conversation_id, created_at DESC);

ALTER TABLE message_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_appointments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all message_conversations" ON message_conversations;
CREATE POLICY "Allow all message_conversations" ON message_conversations FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all message_participants" ON message_participants;
CREATE POLICY "Allow all message_participants" ON message_participants FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all message_items" ON message_items;
CREATE POLICY "Allow all message_items" ON message_items FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all message_documents" ON message_documents;
CREATE POLICY "Allow all message_documents" ON message_documents FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all message_appointments" ON message_appointments;
CREATE POLICY "Allow all message_appointments" ON message_appointments FOR ALL USING (true) WITH CHECK (true);

-- Realtime for live chat
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND tablename = 'message_items'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE message_items;
    END IF;
EXCEPTION
    WHEN undefined_object THEN
        NULL; -- publication may not exist in local/dev
END $$;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'message-attachments',
    'message-attachments',
    false,
    5242880,
    ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO UPDATE SET
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types,
    public = EXCLUDED.public;

DROP POLICY IF EXISTS "Service role message attachment access" ON storage.objects;
CREATE POLICY "Service role message attachment access"
ON storage.objects FOR ALL
USING (bucket_id = 'message-attachments')
WITH CHECK (bucket_id = 'message-attachments');
