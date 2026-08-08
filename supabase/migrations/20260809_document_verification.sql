-- Auto-verification metadata for buyer FICA documents
ALTER TABLE documents
    ADD COLUMN IF NOT EXISTS verification_meta JSONB,
    ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

COMMENT ON COLUMN documents.verification_meta IS
    'Auto-check result: detectedType, confidence, issues, summary, method';
