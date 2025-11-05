-- Create storage bucket for student photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('student-photos', 'student-photos', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for student photos bucket
CREATE POLICY "Anyone can view student photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'student-photos');

CREATE POLICY "Admins can upload student photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'student-photos'
  AND (SELECT public.is_admin(auth.uid()))
);

CREATE POLICY "Admins can update student photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'student-photos'
  AND (SELECT public.is_admin(auth.uid()))
);

CREATE POLICY "Admins can delete student photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'student-photos'
  AND (SELECT public.is_admin(auth.uid()))
);