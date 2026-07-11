-- ==========================================
-- SUPABASE STORAGE SECURITY HARDENING SCRIPT
-- ==========================================
-- This script locks down your Storage Buckets to prevent unauthorized
-- file uploads, restricts file types to images only, limits file size,
-- and ensures users can only modify their own files.

-- 1. Apply Size and Mime-Type limits to the buckets
UPDATE storage.buckets
SET file_size_limit = 5242880, -- 5 MB Limit
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']
WHERE id IN ('properties', 'avatars');

-- 2. HARDEN PROPERTIES BUCKET POLICIES
DROP POLICY IF EXISTS "Authenticated users can upload images." ON storage.objects;
DROP POLICY IF EXISTS "Landlords can upload property images" ON storage.objects;
DROP POLICY IF EXISTS "Landlords can update their property images" ON storage.objects;
DROP POLICY IF EXISTS "Landlords can delete their property images" ON storage.objects;

-- Only landlords can upload properties, and ONLY to their own folder (folder name = auth.uid())
CREATE POLICY "Landlords can upload property images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'properties' 
  AND auth.role() = 'authenticated'
  AND exists (select 1 from public.profiles where id = auth.uid() and role = 'landlord')
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Landlords can update/delete their own images
CREATE POLICY "Landlords can update their property images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'properties' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Landlords can delete their property images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'properties' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. HARDEN AVATARS BUCKET POLICIES
DROP POLICY IF EXISTS "Users can upload avatars." ON storage.objects;
DROP POLICY IF EXISTS "Users can update their avatars." ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their avatars." ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
