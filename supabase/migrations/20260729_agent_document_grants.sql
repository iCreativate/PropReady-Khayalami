-- Agent document access grants: buyer must consent after a viewing exists.
CREATE TABLE IF NOT EXISTS agent_document_grants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_user_id TEXT NOT NULL,
    agent_id TEXT NOT NULL,
    viewing_id TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
    granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS agent_document_grants_active_unique
    ON agent_document_grants (buyer_user_id, agent_id)
    WHERE status = 'active';

CREATE INDEX IF NOT EXISTS agent_document_grants_buyer_idx
    ON agent_document_grants (buyer_user_id);

CREATE INDEX IF NOT EXISTS agent_document_grants_agent_idx
    ON agent_document_grants (agent_id);

COMMENT ON TABLE agent_document_grants IS
    'Buyer grants an agent access to FICA/income documents after a viewing and explicit consent.';
