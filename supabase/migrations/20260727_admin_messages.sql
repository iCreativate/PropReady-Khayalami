-- Allow PropReady staff (admin) as message participants / senders

ALTER TABLE message_conversations DROP CONSTRAINT IF EXISTS message_conversations_created_by_account_type_check;
ALTER TABLE message_conversations
    ADD CONSTRAINT message_conversations_created_by_account_type_check
    CHECK (created_by_account_type IN ('user', 'agent', 'originator', 'admin'));

ALTER TABLE message_participants DROP CONSTRAINT IF EXISTS message_participants_account_type_check;
ALTER TABLE message_participants
    ADD CONSTRAINT message_participants_account_type_check
    CHECK (account_type IN ('user', 'agent', 'originator', 'admin'));

ALTER TABLE message_items DROP CONSTRAINT IF EXISTS message_items_sender_account_type_check;
ALTER TABLE message_items
    ADD CONSTRAINT message_items_sender_account_type_check
    CHECK (sender_account_type IS NULL OR sender_account_type IN ('user', 'agent', 'originator', 'admin'));

ALTER TABLE message_documents DROP CONSTRAINT IF EXISTS message_documents_uploaded_by_account_type_check;
ALTER TABLE message_documents
    ADD CONSTRAINT message_documents_uploaded_by_account_type_check
    CHECK (uploaded_by_account_type IN ('user', 'agent', 'originator', 'admin'));

ALTER TABLE message_appointments DROP CONSTRAINT IF EXISTS message_appointments_proposed_by_account_type_check;
ALTER TABLE message_appointments
    ADD CONSTRAINT message_appointments_proposed_by_account_type_check
    CHECK (proposed_by_account_type IN ('user', 'agent', 'originator', 'admin'));

ALTER TABLE message_appointments DROP CONSTRAINT IF EXISTS message_appointments_responded_by_account_type_check;
ALTER TABLE message_appointments
    ADD CONSTRAINT message_appointments_responded_by_account_type_check
    CHECK (
        responded_by_account_type IS NULL
        OR responded_by_account_type IN ('user', 'agent', 'originator', 'admin')
    );
