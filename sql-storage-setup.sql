-- =============================================
-- STORAGE BUCKET SETUP
-- =============================================

-- Create storage bucket for proposal uploads via Supabase UI:
-- 1. Go to Storage in Supabase dashboard
-- 2. Create new bucket named: "competition-proposals"
-- 3. Set to PRIVATE (not public)

-- =============================================
-- STORAGE POLICIES
-- =============================================

-- Note: Run these in Supabase SQL editor after bucket is created

-- Allow users to upload proposal files
CREATE POLICY "Users can upload proposal files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'competition-proposals'
  AND (storage.foldername(name))[1] = (SELECT id::text FROM profiles WHERE auth_user_id = auth.uid())
);

-- Allow users to download their own proposal files
CREATE POLICY "Users can download own proposal files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'competition-proposals'
  AND (storage.foldername(name))[1] = (SELECT id::text FROM profiles WHERE auth_user_id = auth.uid())
);

-- Allow admins to download all proposal files
CREATE POLICY "Admins can download proposal files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'competition-proposals'
  AND EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.auth_user_id = auth.uid()
    AND p.role = 'admin'
  )
);

-- Allow admins to delete proposal files
CREATE POLICY "Admins can delete proposal files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'competition-proposals'
  AND EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.auth_user_id = auth.uid()
    AND p.role = 'admin'
  )
);
