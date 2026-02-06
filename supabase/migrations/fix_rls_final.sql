
-- FIX FOR RLS SELECT DURING INSERT

-- 1. Add created_by to message_threads
ALTER TABLE public.message_threads ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.users(id) DEFAULT auth.uid();

-- 2. Update message_threads policies
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
  auth.role() = 'authenticated' AND
  (created_by IS NULL OR created_by = auth.uid())
);

-- 3. thread_reads consistency
DROP POLICY IF EXISTS "Insert thread participants" ON public.thread_reads;
CREATE POLICY "Insert thread participants" ON public.thread_reads
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM public.message_threads
    WHERE message_threads.id = thread_reads.thread_id
    AND message_threads.created_by = auth.uid()
  )
);
