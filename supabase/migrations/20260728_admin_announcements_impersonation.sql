-- Platform announcements + staff impersonation audit

CREATE TABLE IF NOT EXISTS admin_announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    audience TEXT NOT NULL DEFAULT 'all'
        CHECK (audience IN ('all', 'user', 'agent', 'originator')),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by_email TEXT,
    published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_announcements_active
    ON admin_announcements (active, published_at DESC);

CREATE TABLE IF NOT EXISTS admin_impersonation_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_email TEXT NOT NULL,
    target_account_type TEXT NOT NULL
        CHECK (target_account_type IN ('user', 'agent', 'originator')),
    target_profile_id TEXT NOT NULL,
    target_email TEXT,
    target_name TEXT,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_admin_impersonation_admin
    ON admin_impersonation_log (admin_email, started_at DESC);

ALTER TABLE admin_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_impersonation_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all admin_announcements" ON admin_announcements;
CREATE POLICY "Allow all admin_announcements" ON admin_announcements FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all admin_impersonation_log" ON admin_impersonation_log;
CREATE POLICY "Allow all admin_impersonation_log" ON admin_impersonation_log FOR ALL USING (true) WITH CHECK (true);

-- Allow announcement context on conversations (optional staff broadcasts)
ALTER TABLE message_conversations DROP CONSTRAINT IF EXISTS message_conversations_context_type_check;
ALTER TABLE message_conversations
    ADD CONSTRAINT message_conversations_context_type_check
    CHECK (context_type IN ('general', 'lead', 'listing', 'viewing', 'prequal', 'announcement', 'support'));
