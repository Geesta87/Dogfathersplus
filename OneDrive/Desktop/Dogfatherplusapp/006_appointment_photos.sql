-- Migration 006: Appointment Photos
-- Run this in Supabase SQL Editor

-- =============================================
-- STEP 1: Add photo URL columns to appointments table
-- =============================================
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS before_photo_url TEXT,
ADD COLUMN IF NOT EXISTS after_photo_url TEXT;

-- Add comments for documentation
COMMENT ON COLUMN appointments.before_photo_url IS 'URL to before grooming photo (stored in Supabase Storage)';
COMMENT ON COLUMN appointments.after_photo_url IS 'URL to after grooming photo (stored in Supabase Storage)';

-- =============================================
-- STEP 2: Create Storage Bucket for Grooming Photos
-- =============================================
-- Note: This needs to be done in Supabase Dashboard > Storage
-- Or you can run this SQL if your database user has the right permissions:

-- Create the bucket (may fail if bucket already exists - that's OK)
INSERT INTO storage.buckets (id, name, public)
VALUES ('grooming-photos', 'grooming-photos', true)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- STEP 3: Storage Policies (for public access to photos)
-- =============================================

-- Allow anyone to view photos (they're public URLs)
CREATE POLICY "Public Access to Grooming Photos" ON storage.objects
FOR SELECT
USING (bucket_id = 'grooming-photos');

-- Allow authenticated users to upload photos
CREATE POLICY "Authenticated users can upload grooming photos" ON storage.objects
FOR INSERT
WITH CHECK (
    bucket_id = 'grooming-photos' 
    AND auth.role() = 'authenticated'
);

-- Allow authenticated users to update their own photos
CREATE POLICY "Authenticated users can update grooming photos" ON storage.objects
FOR UPDATE
USING (
    bucket_id = 'grooming-photos' 
    AND auth.role() = 'authenticated'
);

-- Allow authenticated users to delete photos
CREATE POLICY "Authenticated users can delete grooming photos" ON storage.objects
FOR DELETE
USING (
    bucket_id = 'grooming-photos' 
    AND auth.role() = 'authenticated'
);

-- =============================================
-- VERIFICATION: Check columns were added
-- =============================================
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'appointments' 
AND column_name IN ('before_photo_url', 'after_photo_url');
