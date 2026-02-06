
-- RLS FIX FOR DIRECT MESSAGING (THREADS WITHOUT CASES)

-- 1. message_threads Policies
-- Allow viewing threads you are a participant in (via thread_reads)
CREATE POLICY "View direct and case threads" ON public.message_threads
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.thread_reads 
    WHERE thread_reads.thread_id = message_threads.id 
    AND thread_reads.user_id = auth.uid()
  )
);

-- Allow creating threads for any authenticated user
CREATE POLICY "Create threads for all" ON public.message_threads
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 2. thread_reads Policies
-- Allow viewing participants of threads you belong to
CREATE POLICY "View thread participants" ON public.thread_reads
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.thread_reads tr 
    WHERE tr.thread_id = thread_reads.thread_id 
    AND tr.user_id = auth.uid()
  )
);

-- Allow adding yourself or others to a thread (required for thread creation)
CREATE POLICY "Insert thread participants" ON public.thread_reads
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 3. messages Policies
-- Drop existing restrictive policy
DROP POLICY IF EXISTS "View messages" ON public.messages;

-- New more inclusive policy for messages
CREATE POLICY "View messages in joined threads" ON public.messages
FOR SELECT USING (
  sender_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.thread_reads
    WHERE thread_id = messages.thread_id
    AND user_id = auth.uid()
  )
);

-- Allow sending messages in threads you belong to
CREATE POLICY "Insert messages in joined threads" ON public.messages
FOR INSERT WITH CHECK (
  sender_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.thread_reads
    WHERE thread_id = messages.thread_id
    AND user_id = auth.uid()
  )
);
