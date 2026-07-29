-- Remove only staff-broadcast Welcome spam (admin_* participants), not per-user PropReady system welcomes.
DELETE FROM message_conversations mc
WHERE mc.context_type = 'announcement'
  AND mc.subject = 'Welcome to PropReady'
  AND EXISTS (
    SELECT 1
    FROM message_participants mp
    WHERE mp.conversation_id = mc.id
      AND mp.account_type = 'admin'
      AND mp.profile_id LIKE 'admin_%'
      AND mp.profile_id <> 'system_propready'
  );
