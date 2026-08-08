-- Remove PropReady demo bond originator seed account

DELETE FROM auth_sessions
WHERE account_id IN (
    SELECT id FROM auth_accounts
    WHERE account_type = 'originator'
      AND LOWER(email) = 'demo.originator@prop-ready.co.za'
);

DELETE FROM auth_accounts
WHERE account_type = 'originator'
  AND LOWER(email) = 'demo.originator@prop-ready.co.za';

DELETE FROM originators
WHERE LOWER(email) = 'demo.originator@prop-ready.co.za'
   OR id = 'a0000000-0000-4000-8000-0000000000d1'::uuid;
