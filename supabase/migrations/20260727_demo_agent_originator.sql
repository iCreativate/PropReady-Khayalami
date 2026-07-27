-- Demo agent + demo bond originator for testing
-- Safe to re-run (upserts on email)

ALTER TABLE agents ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free';
ALTER TABLE agents ADD COLUMN IF NOT EXISTS seller_plan TEXT DEFAULT 'none';
ALTER TABLE agents ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS ppra_number TEXT;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS ffc_number TEXT;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS ffc_document_url TEXT;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending';
ALTER TABLE agents ADD COLUMN IF NOT EXISTS verification_date TIMESTAMPTZ;

ALTER TABLE originators ADD COLUMN IF NOT EXISTS staff_number TEXT;
ALTER TABLE originators ADD COLUMN IF NOT EXISTS phone TEXT;

INSERT INTO agents (
    id,
    full_name,
    email,
    phone,
    eaab_number,
    ppra_number,
    ffc_number,
    ffc_document_url,
    company,
    city,
    password,
    status,
    plan,
    seller_plan,
    email_verified,
    verification_status,
    verification_date,
    created_at,
    updated_at
) VALUES (
    'demo-agent-propready',
    'Demo Agent',
    'demo.agent@prop-ready.co.za',
    '+27821234567',
    '1234567',
    '1234567',
    '202512345678901',
    'demo/ffc-certificate.pdf',
    'PropReady Demo Realty',
    'Johannesburg',
    'Demo@123!',
    'approved',
    'growth',
    'none',
    TRUE,
    'verified',
    NOW(),
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    eaab_number = EXCLUDED.eaab_number,
    ppra_number = EXCLUDED.ppra_number,
    ffc_number = EXCLUDED.ffc_number,
    ffc_document_url = EXCLUDED.ffc_document_url,
    company = EXCLUDED.company,
    city = EXCLUDED.city,
    password = EXCLUDED.password,
    status = EXCLUDED.status,
    plan = EXCLUDED.plan,
    seller_plan = EXCLUDED.seller_plan,
    email_verified = EXCLUDED.email_verified,
    verification_status = EXCLUDED.verification_status,
    verification_date = EXCLUDED.verification_date,
    updated_at = NOW();

INSERT INTO originators (
    id,
    full_name,
    email,
    phone,
    organization_id,
    staff_number,
    password,
    status,
    created_at,
    updated_at
) VALUES (
    'a0000000-0000-4000-8000-0000000000d1',
    'Demo Originator',
    'demo.originator@prop-ready.co.za',
    '+27821234568',
    'betterbond',
    'PR-BB-DEMO01',
    'Demo@123!',
    'approved',
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    organization_id = EXCLUDED.organization_id,
    staff_number = EXCLUDED.staff_number,
    password = EXCLUDED.password,
    status = EXCLUDED.status,
    updated_at = NOW();
