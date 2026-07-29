-- Allow audio voice notes in message attachments (and raise size for short recordings).
UPDATE storage.buckets
SET
    file_size_limit = 15728640,
    allowed_mime_types = ARRAY[
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/webp',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'audio/webm',
        'audio/mp4',
        'audio/mpeg',
        'audio/ogg',
        'audio/wav',
        'audio/x-wav',
        'audio/aac'
    ]
WHERE id = 'message-attachments';

-- Seed a reusable welcome announcement for all audiences (idempotent by title).
INSERT INTO admin_announcements (title, body, audience, active, created_by_email, published_at)
SELECT
    'Welcome to PropReady',
    E'PropReady helps South Africans buy and sell homes with clarity and confidence.\n\nHere''s what you can do on the platform:\n• Get a free soft pre-qualification and understand your buying power\n• Browse listings and book property viewings with verified agents\n• Message agents, originators, and PropReady staff in one inbox\n• Upload FICA documents and optionally complete a full bond prequalification\n• Sellers can add properties, request valuations, and connect with agents\n• Learn through guides and tools that demystify the property journey\n\nExplore your dashboard, complete your profile, and reach out anytime — we''re here to help you get home-ready.',
    'all',
    TRUE,
    'system@propready.local',
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM admin_announcements WHERE title = 'Welcome to PropReady' AND audience = 'all'
);
