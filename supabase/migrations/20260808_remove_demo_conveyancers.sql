-- Remove PropReady demo conveyancer directory entries (JHB + CPT seed accounts)

DELETE FROM auth_sessions
WHERE account_id IN (
    SELECT id FROM auth_accounts
    WHERE account_type = 'conveyancer'
      AND LOWER(email) IN (
          'demo.conveyancer@prop-ready.co.za',
          'demo.conveyancer.cpt@prop-ready.co.za'
      )
);

DELETE FROM auth_accounts
WHERE account_type = 'conveyancer'
  AND LOWER(email) IN (
      'demo.conveyancer@prop-ready.co.za',
      'demo.conveyancer.cpt@prop-ready.co.za'
  );

DELETE FROM conveyancers
WHERE LOWER(email) IN (
      'demo.conveyancer@prop-ready.co.za',
      'demo.conveyancer.cpt@prop-ready.co.za'
  )
   OR firm_slug IN (
      'propready-demo-conveyancers-jhb',
      'propready-demo-conveyancers-cpt'
  );
