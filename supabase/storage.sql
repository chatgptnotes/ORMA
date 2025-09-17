-- Create storage bucket for passport documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'passport-documents',
  'passport-documents',
  false,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Create policy for authenticated users to upload files
CREATE POLICY "Allow authenticated users to upload passport documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'passport-documents'
  AND auth.role() = 'authenticated'
);

-- Create policy for authenticated users to view their own files
CREATE POLICY "Allow authenticated users to view passport documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'passport-documents'
  AND auth.role() = 'authenticated'
);

-- Create policy for authenticated users to delete their own files
CREATE POLICY "Allow authenticated users to delete passport documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'passport-documents'
  AND auth.role() = 'authenticated'
);

-- Add document_url column to passport_records table if not exists
ALTER TABLE passport_records
ADD COLUMN IF NOT EXISTS document_url TEXT;

-- Add index for document URL
CREATE INDEX IF NOT EXISTS idx_document_url ON passport_records(document_url);