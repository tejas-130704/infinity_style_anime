-- ============================================================================
-- STORAGE BUCKET POLICIES - Run AFTER creating buckets
-- ============================================================================
-- Run this in Supabase Dashboard → SQL Editor
-- AFTER creating the storage buckets via the UI
-- ============================================================================

-- ============================================================================
-- BUCKET 1: product-images (PUBLIC)
-- ============================================================================

-- Allow public read access
CREATE POLICY "product_images_public_read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-images');

-- Allow authenticated users to upload
CREATE POLICY "product_images_authenticated_upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-images' AND
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Allow admins to update
CREATE POLICY "product_images_admin_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'product-images' AND
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Allow admins to delete
CREATE POLICY "product_images_admin_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'product-images' AND
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);

-- ============================================================================
-- BUCKET 2: custom-action-figures (PRIVATE)
-- ============================================================================

-- Allow users to read their own files
CREATE POLICY "action_figures_read_own"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'custom-action-figures' AND
  (auth.uid()::text = (storage.foldername(name))[1] OR
   EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true))
);

-- Allow authenticated users to upload to their folder
CREATE POLICY "action_figures_upload_own"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'custom-action-figures' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to update their own files
CREATE POLICY "action_figures_update_own"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'custom-action-figures' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own files
CREATE POLICY "action_figures_delete_own"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'custom-action-figures' AND
  (auth.uid()::text = (storage.foldername(name))[1] OR
   EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true))
);

-- ============================================================================
-- BUCKET 3: personalized-posters (PRIVATE)
-- ============================================================================

-- Allow users to read their own files
CREATE POLICY "posters_read_own"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'personalized-posters' AND
  (auth.uid()::text = (storage.foldername(name))[1] OR
   EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true))
);

-- Allow authenticated users to upload to their folder
CREATE POLICY "posters_upload_own"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'personalized-posters' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to update their own files
CREATE POLICY "posters_update_own"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'personalized-posters' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own files
CREATE POLICY "posters_delete_own"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'personalized-posters' AND
  (auth.uid()::text = (storage.foldername(name))[1] OR
   EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true))
);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check policies exist
SELECT 
  bucket_id,
  name as policy_name,
  operation
FROM storage.policies
WHERE bucket_id IN ('product-images', 'custom-action-figures', 'personalized-posters')
ORDER BY bucket_id, operation;

-- ============================================================================
-- STORAGE POLICIES COMPLETE!
-- ============================================================================
