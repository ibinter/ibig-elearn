-- Bucket public pour les documents de cours (PDF, Word, PPT...)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'course-assets',
  'course-assets',
  true,
  52428800, -- 50 Mo
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv',
    'image/jpeg',
    'image/png',
    'image/webp'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Lecture publique
DROP POLICY IF EXISTS "course_assets_public_read" ON storage.objects;
CREATE POLICY "course_assets_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'course-assets');

-- Upload pour les formateurs authentifiés
DROP POLICY IF EXISTS "course_assets_formateur_insert" ON storage.objects;
CREATE POLICY "course_assets_formateur_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'course-assets'
    AND auth.role() = 'authenticated'
  );

-- Suppression par le propriétaire
DROP POLICY IF EXISTS "course_assets_formateur_delete" ON storage.objects;
CREATE POLICY "course_assets_formateur_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'course-assets'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
