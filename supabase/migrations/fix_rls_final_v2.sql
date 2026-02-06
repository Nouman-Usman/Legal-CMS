
-- FINAL POLISHED RLS FOR THREADS AND READS

-- 1. message_threads
ALTER TABLE public.message_threads ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.users(id) DEFAULT auth.uid();

DROP POLICY IF EXISTS "View threads" ON public.message_threads;
DROP POLICY IF EXISTS "View direct and case threads" ON public.message_threads;
DROP POLICY IF EXISTS "Create threads for all" ON public.message_threads;
DROP POLICY IF EXISTS "Create threads" ON public.message_threads;

CREATE POLICY "View threads" ON public.message_threads
FOR SELECT USING (
  created_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.thread_reads 
    WHERE thread_reads.thread_id = message_threads.id 
    AND thread_reads.user_id = auth.uid()
  )
);

CREATE POLICY "Create threads" ON public.message_threads
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated'
);

-- 2. thread_reads
DROP POLICY IF EXISTS "View thread participants" ON public.thread_reads;
DROP POLICY IF EXISTS "Insert thread participants" ON public.thread_reads;
DROP POLICY IF EXISTS "Settings visible to members" ON public.thread_reads; -- Just in case of typo

CREATE POLICY "View thread participants" ON public.thread_reads
FOR SELECT USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.thread_reads tr 
    WHERE tr.thread_id = thread_reads.thread_id 
    AND tr.user_id = auth.uid()
  )
);

CREATE POLICY "Insert thread participants" ON public.thread_reads
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated'
);
