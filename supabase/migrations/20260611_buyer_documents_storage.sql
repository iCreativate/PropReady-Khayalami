-- Buyer FICA document storage (private bucket; uploads via service-role API)

ALTER TABLE documents
    ADD COLUMN IF NOT EXISTS storage_path TEXT;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'buyer-documents',
    'buyer-documents',
    false,
    10485760,
    ARRAY['application/pdf', 'image/jpeg', 'image/png']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Service role buyer document access" ON storage.objects;
CREATE POLICY "Service role buyer document access"
ON storage.objects FOR ALL
USING (bucket_id = 'buyer-documents')
WITH CHECK (bucket_id = 'buyer-documents');
