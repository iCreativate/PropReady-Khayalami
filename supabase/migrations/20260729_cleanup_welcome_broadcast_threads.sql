-- Remove staff-broadcast Welcome spam; keep per-user system welcomes (system_propready).
DELETE FROM message_conversations
WHERE subject = 'Welcome to PropReady'
  AND COALESCE(created_by_profile_id, '') <> 'system_propready';
