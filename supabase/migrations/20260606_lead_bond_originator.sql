-- Bond originator pre-qualification on leads
ALTER TABLE leads
    ADD COLUMN IF NOT EXISTS bond_originator TEXT,
    ADD COLUMN IF NOT EXISTS prequalified_with_originator BOOLEAN DEFAULT FALSE;
