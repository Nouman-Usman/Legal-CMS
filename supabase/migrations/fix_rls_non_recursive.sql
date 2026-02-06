
-- NON-RECURSIVE RLS FOR MESSAGING

-- 1. message_threads: A user can see threads they created OR threads they are referenced in
DROP POLICY IF EXISTS "message_threads_select_policy" ON public.message_threads;
DROP POLICY IF EXISTS "message_threads_insert_policy" ON public.message_threads;

CREATE POLICY "message_threads_select_all" ON public.message_threads
FOR SELECT USING (
  created_by = auth.uid() OR
  id IN (
    SELECT thread_id FROM public.thread_reads WHERE user_id = auth.uid()
  )
);

CREATE POLICY "message_threads_insert_all" ON public.message_threads
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 2. thread_reads: Break recursion by checking against message_threads.created_by
DROP POLICY IF EXISTS "thread_reads_select_policy" ON public.thread_reads;
DROP POLICY IF EXISTS "thread_reads_insert_policy" ON public.thread_reads;

CREATE POLICY "thread_reads_select_own" ON public.thread_reads
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "thread_reads_select_by_thread_creator" ON public.thread_reads
FOR SELECT USING (
  thread_id IN (
    SELECT id FROM public.message_threads WHERE created_by = auth.uid()
  )
);

-- Note: To allow the lawyer to see the client's entry, we'd need another policy.
-- But during "Find Lawyers", the client is the one searching, so they are the creator.
-- The lawyer will be the participant.

CREATE POLICY "thread_reads_insert_all" ON public.thread_reads
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 3. messages: Similar logic
DROP POLICY IF EXISTS "messages_select_policy" ON public.messages;
DROP POLICY IF EXISTS "messages_insert_policy" ON public.messages;

CREATE POLICY "messages_select_all" ON public.messages
FOR SELECT USING (
  sender_id = auth.uid() OR
  thread_id IN (
    SELECT id FROM public.message_threads WHERE created_by = auth.uid()
  ) OR
  thread_id IN (
    SELECT thread_id FROM public.thread_reads WHERE user_id = auth.uid()
  )
);

CREATE POLICY "messages_insert_all" ON public.messages
FOR INSERT WITH CHECK (auth.role() = 'authenticated');
