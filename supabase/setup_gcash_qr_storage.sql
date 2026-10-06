INSERT INTO storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
VALUES (
  'gcash-qr-codes',
  'gcash-qr-codes',
  true,
  5242880,
  ARRAY['image/png', 'image/jpeg', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Allow anonymous GCash QR uploads" ON storage.objects;

CREATE POLICY "Allow anonymous GCash QR uploads"
ON storage.objects
FOR INSERT
TO anon
WITH CHECK (
  bucket_id = 'gcash-qr-codes'
  AND (storage.foldername(name))[1] = 'gcash-qr'
);