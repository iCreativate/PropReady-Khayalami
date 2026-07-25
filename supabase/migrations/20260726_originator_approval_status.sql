-- Originator staff must be admin-approved before portal login

ALTER TABLE originators
    ALTER COLUMN status SET DEFAULT 'pending';

-- Existing auto-activated staff must be re-approved via /admin/originators
UPDATE originators
SET status = 'pending'
WHERE lower(coalesce(status, '')) IN ('', 'active');
