-- Bond originator staff numbers (required for professional login)

ALTER TABLE originators
    ADD COLUMN IF NOT EXISTS staff_number TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_originators_org_staff_unique
    ON originators (organization_id, lower(staff_number))
    WHERE staff_number IS NOT NULL AND staff_number <> '';
