-- =====================================================
-- STORAGE BUCKETS SETUP
-- =====================================================

-- Create bucket for proposal media (images, logos, videos)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'proposal-media',
  'proposal-media',
  false, -- Not public by default, access controlled by RLS
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'video/mp4', 'video/webm']
);

-- Create bucket for proposal PDFs
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'proposal-pdfs',
  'proposal-pdfs',
  false, -- Not public by default, access controlled by RLS
  52428800, -- 50MB limit
  ARRAY['application/pdf']
);

-- Create bucket for signature images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'signatures',
  'signatures',
  false, -- Not public by default, access controlled by RLS
  1048576, -- 1MB limit
  ARRAY['image/jpeg', 'image/png', 'image/svg+xml']
);

-- =====================================================
-- STORAGE POLICIES FOR PROPOSAL-MEDIA BUCKET
-- =====================================================

-- Admins can upload media for their proposals
CREATE POLICY "Admins can upload proposal media"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'proposal-media'
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can view media from their proposals
CREATE POLICY "Admins can view own proposal media"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'proposal-media'
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Anyone can view proposal media (for clients viewing proposals)
CREATE POLICY "Anyone can view proposal media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'proposal-media');

-- Admins can update their proposal media
CREATE POLICY "Admins can update own proposal media"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'proposal-media'
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can delete their proposal media
CREATE POLICY "Admins can delete own proposal media"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'proposal-media'
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- STORAGE POLICIES FOR PROPOSAL-PDFS BUCKET
-- =====================================================

-- System/Admins can upload PDFs
CREATE POLICY "Admins can upload proposal PDFs"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'proposal-pdfs'
    AND (
      auth.role() = 'authenticated'
      AND EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND role = 'admin'
      )
    )
  );

-- Admins can view PDFs from their proposals
CREATE POLICY "Admins can view own proposal PDFs"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'proposal-pdfs'
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Anyone can view proposal PDFs (for clients)
CREATE POLICY "Anyone can view proposal PDFs"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'proposal-pdfs');

-- Admins can delete their proposal PDFs
CREATE POLICY "Admins can delete own proposal PDFs"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'proposal-pdfs'
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- STORAGE POLICIES FOR SIGNATURES BUCKET
-- =====================================================

-- Anyone can upload signatures (clients signing proposals)
CREATE POLICY "Anyone can upload signatures"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'signatures');

-- Admins can view signatures from their proposals
CREATE POLICY "Admins can view signatures for own proposals"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'signatures'
    AND (
      auth.role() = 'authenticated'
      AND EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND role = 'admin'
      )
    )
  );

-- Anyone can view their own signature
CREATE POLICY "Anyone can view signatures"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'signatures');

-- No one can delete signatures (immutable for legal purposes)
-- Admins can only delete via Supabase dashboard if absolutely necessary

