-- Conveyancer Connect Phase 2: accounts, matters, deeds tracking, messaging roles

-- Widen auth account types
ALTER TABLE auth_accounts DROP CONSTRAINT IF EXISTS auth_accounts_account_type_check;
ALTER TABLE auth_accounts
    ADD CONSTRAINT auth_accounts_account_type_check
    CHECK (account_type IN ('user', 'agent', 'originator', 'conveyancer'));

ALTER TABLE auth_magic_links DROP CONSTRAINT IF EXISTS auth_magic_links_account_type_check;
ALTER TABLE auth_magic_links
    ADD CONSTRAINT auth_magic_links_account_type_check
    CHECK (account_type IN ('user', 'agent', 'originator', 'conveyancer'));

ALTER TABLE email_verification_codes DROP CONSTRAINT IF EXISTS email_verification_codes_account_type_check;
ALTER TABLE email_verification_codes
    ADD CONSTRAINT email_verification_codes_account_type_check
    CHECK (account_type IN ('user', 'agent', 'originator', 'admin', 'conveyancer'));

-- Conveyancer firm / attorney profiles
CREATE TABLE IF NOT EXISTS conveyancers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    phone TEXT,
    firm_name TEXT NOT NULL,
    firm_slug TEXT UNIQUE,
    lpc_number TEXT,
    practice_certificate_ref TEXT,
    province TEXT,
    city TEXT,
    suburb TEXT,
    bio TEXT,
    website TEXT,
    languages TEXT[] DEFAULT ARRAY['English']::TEXT[],
    specialisations TEXT[] DEFAULT ARRAY['residential']::TEXT[],
    password TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
    verified_at TIMESTAMPTZ,
    profile_completion INT NOT NULL DEFAULT 40,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conveyancers_email ON conveyancers (LOWER(email));
CREATE INDEX IF NOT EXISTS idx_conveyancers_status ON conveyancers (status);
CREATE INDEX IF NOT EXISTS idx_conveyancers_slug ON conveyancers (firm_slug);
CREATE INDEX IF NOT EXISTS idx_conveyancers_province_city ON conveyancers (province, city);

-- Engagement / instruction matters (unlocks live messaging)
CREATE TABLE IF NOT EXISTS conveyancer_matters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conveyancer_id UUID NOT NULL REFERENCES conveyancers(id) ON DELETE CASCADE,
    client_user_id UUID,
    client_name TEXT,
    client_email TEXT,
    client_phone TEXT,
    agent_id UUID,
    agent_name TEXT,
    property_label TEXT,
    property_type TEXT,
    property_value NUMERIC,
    bond_amount NUMERIC,
    province TEXT,
    city TEXT,
    suburb TEXT,
    status TEXT NOT NULL DEFAULT 'inquiry'
        CHECK (status IN (
            'inquiry',
            'quote_requested',
            'quote_sent',
            'instructed',
            'in_progress',
            'lodged',
            'registered',
            'completed',
            'closed'
        )),
    source TEXT NOT NULL DEFAULT 'marketplace'
        CHECK (source IN ('marketplace', 'quote', 'agent_referral', 'tracker', 'admin')),
    conversation_id UUID,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cc_matters_conveyancer ON conveyancer_matters (conveyancer_id, status);
CREATE INDEX IF NOT EXISTS idx_cc_matters_client ON conveyancer_matters (client_user_id);
CREATE INDEX IF NOT EXISTS idx_cc_matters_agent ON conveyancer_matters (agent_id);
CREATE INDEX IF NOT EXISTS idx_cc_matters_email ON conveyancer_matters (LOWER(client_email));

-- Deeds Office tracking (integration layer; SA has no public Deeds API — provider-backed)
CREATE TABLE IF NOT EXISTS deeds_office_matters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conveyancer_matter_id UUID NOT NULL REFERENCES conveyancer_matters(id) ON DELETE CASCADE,
    conveyancer_id UUID NOT NULL REFERENCES conveyancers(id) ON DELETE CASCADE,
    deeds_office TEXT NOT NULL DEFAULT 'johannesburg',
    lodgement_ref TEXT,
    deed_number TEXT,
    provider TEXT NOT NULL DEFAULT 'propready_simulated',
    provider_status TEXT NOT NULL DEFAULT 'not_lodged'
        CHECK (provider_status IN (
            'not_lodged',
            'preparing',
            'lodged',
            'examining',
            'queried',
            'ready_for_registration',
            'registered',
            'uplifted',
            'error'
        )),
    progress_pct INT NOT NULL DEFAULT 0,
    last_synced_at TIMESTAMPTZ,
    expected_registration_at TIMESTAMPTZ,
    registered_at TIMESTAMPTZ,
    raw_payload JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (conveyancer_matter_id)
);

CREATE INDEX IF NOT EXISTS idx_deeds_office_conveyancer ON deeds_office_matters (conveyancer_id, provider_status);

CREATE TABLE IF NOT EXISTS deeds_office_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deeds_matter_id UUID NOT NULL REFERENCES deeds_office_matters(id) ON DELETE CASCADE,
    event_code TEXT NOT NULL,
    title TEXT NOT NULL,
    detail TEXT,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deeds_events_matter ON deeds_office_events (deeds_matter_id, occurred_at DESC);

-- Quote requests from marketplace (persist beyond localStorage)
CREATE TABLE IF NOT EXISTS conveyancer_quote_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conveyancer_id UUID NOT NULL REFERENCES conveyancers(id) ON DELETE CASCADE,
    matter_id UUID REFERENCES conveyancer_matters(id) ON DELETE SET NULL,
    requester_user_id UUID,
    requester_name TEXT,
    requester_email TEXT,
    property_type TEXT,
    location TEXT,
    purchase_price NUMERIC,
    bond_amount NUMERIC,
    timeline TEXT,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'submitted'
        CHECK (status IN ('submitted', 'viewed', 'quoted', 'declined', 'accepted')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cc_quotes_conveyancer ON conveyancer_quote_requests (conveyancer_id, status);

-- Consultation bookings
CREATE TABLE IF NOT EXISTS conveyancer_consultations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conveyancer_id UUID NOT NULL REFERENCES conveyancers(id) ON DELETE CASCADE,
    matter_id UUID REFERENCES conveyancer_matters(id) ON DELETE SET NULL,
    requester_user_id UUID,
    consultation_type TEXT NOT NULL DEFAULT 'virtual'
        CHECK (consultation_type IN ('virtual', 'office', 'phone')),
    slot_label TEXT NOT NULL,
    requester_name TEXT NOT NULL,
    requester_email TEXT NOT NULL,
    requester_phone TEXT,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'confirmed'
        CHECK (status IN ('confirmed', 'completed', 'cancelled', 'no_show')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cc_consult_conveyancer ON conveyancer_consultations (conveyancer_id, status);

-- Widen message hub account types
ALTER TABLE message_conversations DROP CONSTRAINT IF EXISTS message_conversations_created_by_account_type_check;
ALTER TABLE message_conversations
    ADD CONSTRAINT message_conversations_created_by_account_type_check
    CHECK (created_by_account_type IN ('user', 'agent', 'originator', 'admin', 'conveyancer'));

ALTER TABLE message_participants DROP CONSTRAINT IF EXISTS message_participants_account_type_check;
ALTER TABLE message_participants
    ADD CONSTRAINT message_participants_account_type_check
    CHECK (account_type IN ('user', 'agent', 'originator', 'admin', 'conveyancer'));

ALTER TABLE message_items DROP CONSTRAINT IF EXISTS message_items_sender_account_type_check;
ALTER TABLE message_items
    ADD CONSTRAINT message_items_sender_account_type_check
    CHECK (sender_account_type IS NULL OR sender_account_type IN ('user', 'agent', 'originator', 'admin', 'conveyancer'));

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'message_documents' AND column_name = 'uploaded_by_account_type'
    ) THEN
        ALTER TABLE message_documents DROP CONSTRAINT IF EXISTS message_documents_uploaded_by_account_type_check;
        ALTER TABLE message_documents
            ADD CONSTRAINT message_documents_uploaded_by_account_type_check
            CHECK (uploaded_by_account_type IN ('user', 'agent', 'originator', 'admin', 'conveyancer'));
    END IF;
END $$;

-- Widen context types for conveyancing threads when constraint exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'message_conversations_context_type_check'
    ) THEN
        ALTER TABLE message_conversations DROP CONSTRAINT message_conversations_context_type_check;
        ALTER TABLE message_conversations
            ADD CONSTRAINT message_conversations_context_type_check
            CHECK (context_type IN (
                'general', 'lead', 'listing', 'viewing', 'prequal',
                'announcement', 'support', 'conveyancing', 'transfer'
            ));
    END IF;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- RLS: service role used by Next.js APIs; enable RLS for defense in depth
ALTER TABLE conveyancers ENABLE ROW LEVEL SECURITY;
ALTER TABLE conveyancer_matters ENABLE ROW LEVEL SECURITY;
ALTER TABLE deeds_office_matters ENABLE ROW LEVEL SECURITY;
ALTER TABLE deeds_office_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE conveyancer_quote_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE conveyancer_consultations ENABLE ROW LEVEL SECURITY;

-- Public read of approved conveyancer directory fields (anon/authenticated select)
DROP POLICY IF EXISTS conveyancers_public_read_approved ON conveyancers;
CREATE POLICY conveyancers_public_read_approved ON conveyancers
    FOR SELECT
    TO anon, authenticated
    USING (status = 'approved');
