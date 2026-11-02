-- Real storage for case documents (uploads used to save a fake placeholder URL).
-- Private bucket; objects live at <chamber_id>/<case_id>/<id>-<name> and are
-- reachable only by members of that chamber, through short-lived signed URLs.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'case-documents', 'case-documents', false, 15728640,
  ARRAY[
    'application/pdf',
    'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'application/octet-stream'
  ]
)
ON CONFLICT (id) DO UPDATE
SET public = false, file_size_limit = EXCLUDED.file_size_limit, allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Read: members of the chamber in the first path segment.
CREATE POLICY "case_documents_read_member" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'case-documents'
  AND (storage.foldername(name))[1] IN (SELECT public.my_chamber_ids()::text)
);

-- Upload: members, and only into a case that belongs to that chamber.
CREATE POLICY "case_documents_upload_member" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'case-documents'
  AND (storage.foldername(name))[1] IN (SELECT public.my_chamber_ids()::text)
  AND EXISTS (
    SELECT 1 FROM public.cases c
    WHERE c.id::text = (storage.foldername(name))[2]
      AND c.chamber_id::text = (storage.foldername(name))[1]
  )
);

-- Delete: the uploader, or an admin of that chamber.
CREATE POLICY "case_documents_delete_owner_or_admin" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'case-documents'
  AND (storage.foldername(name))[1] IN (SELECT public.my_chamber_ids()::text)
  AND (
    owner_id = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM public.chamber_members cm
      WHERE cm.user_id = auth.uid() AND cm.role = 'admin' AND cm.is_active IS NOT FALSE
        AND cm.chamber_id::text = (storage.foldername(name))[1]
    )
  )
);

-- The document row points at its storage object.
ALTER TABLE public.case_documents ADD COLUMN IF NOT EXISTS storage_path text;
