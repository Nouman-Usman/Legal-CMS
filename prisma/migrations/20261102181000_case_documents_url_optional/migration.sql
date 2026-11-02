-- Uploaded documents live in storage (storage_path); the legacy url column is optional.
ALTER TABLE public.case_documents ALTER COLUMN url DROP NOT NULL;
