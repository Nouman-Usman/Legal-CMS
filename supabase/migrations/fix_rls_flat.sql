
-- FINAL RECURSION KILLER: MOVE PARTICIPANTS TO THE THREAD TABLE
-- This is the industry standard for Supabase RLS in messaging to avoid recursion.

-- 1. Add participant_ids to message_threads
ALTER TABLE public.message_threads ADD COLUMN IF NOT EXISTS participant_ids UUID[] DEFAULT '{}';

-- 2. Backfill participant_ids from existing thread_reads (if any)
-- This ensures existing data isn't broken
DO $$ 
BEGIN
    UPDATE public.message_threads mt
    SET participant_ids = (
        SELECT array_agg(user_id)
        FROM public.thread_reads tr
        WHERE tr.thread_id = mt.id
    )
    WHERE EXISTS (
        SELECT 1 FROM public.thread_reads tr WHERE tr.thread_id = mt.id
    );
END $$;

-- 3. DROP ALL OLD POLICIES that might be causing recursion
DROP POLICY IF EXISTS "message_threads_select_policy" ON public.message_threads;
DROP POLICY IF EXISTS "message_threads_insert_policy" ON public.message_threads;
DROP POLICY IF EXISTS "message_threads_select_all" ON public.message_threads;
DROP POLICY IF EXISTS "message_threads_insert_all" ON public.message_threads;
DROP POLICY IF EXISTS "View threads" ON public.message_threads;
DROP POLICY IF EXISTS "Create threads" ON public.message_threads;
DROP POLICY IF EXISTS "View direct and case threads" ON public.message_threads;
DROP POLICY IF EXISTS "Create threads for all" ON public.message_threads;

DROP POLICY IF EXISTS "thread_reads_select_policy" ON public.thread_reads;
DROP POLICY IF EXISTS "thread_reads_insert_policy" ON public.thread_reads;
DROP POLICY IF EXISTS "thread_reads_select_own" ON public.thread_reads;
DROP POLICY IF EXISTS "thread_reads_select_by_thread_creator" ON public.thread_reads;
DROP POLICY IF EXISTS "thread_reads_insert_all" ON public.thread_reads;
DROP POLICY IF EXISTS "View thread participants" ON public.thread_reads;
DROP POLICY IF EXISTS "Insert thread participants" ON public.thread_reads;

DROP POLICY IF EXISTS "messages_select_policy" ON public.messages;
DROP POLICY IF EXISTS "messages_insert_policy" ON public.messages;
DROP POLICY IF EXISTS "messages_select_all" ON public.messages;
DROP POLICY IF EXISTS "messages_insert_all" ON public.messages;
DROP POLICY IF EXISTS "View messages in joined threads" ON public.messages;
DROP POLICY IF EXISTS "Insert messages in joined threads" ON public.messages;

-- 4. CLEAN AND FLAT POLICIES (NO RECURSION)

-- MESSAGE_THREADS: You can see if you are a participant
CREATE POLICY "threads_select_v3" ON public.message_threads
FOR SELECT USING (
  auth.uid() = ANY(participant_ids) OR
  created_by = auth.uid()
);

CREATE POLICY "threads_insert_v3" ON public.message_threads
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- THREAD_READS: You can see if you are a participant in the parent thread
CREATE POLICY "reads_select_v3" ON public.thread_reads
FOR SELECT USING (
  user_id = auth.uid() OR
  thread_id IN (
    SELECT id FROM public.message_threads WHERE auth.uid() = ANY(participant_ids) OR created_by = auth.uid()
  )
);

CREATE POLICY "reads_insert_v3" ON public.thread_reads
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- MESSAGES: You can see if you are a participant in the parent thread
CREATE POLICY "messages_select_v3" ON public.messages
FOR SELECT USING (
  sender_id = auth.uid() OR
  thread_id IN (
    SELECT id FROM public.message_threads WHERE auth.uid() = ANY(participant_ids) OR created_by = auth.uid()
  )
);

CREATE POLICY "messages_insert_v3" ON public.messages
FOR INSERT WITH CHECK (
  sender_id = auth.uid() AND
  thread_id IN (
    SELECT id FROM public.message_threads WHERE auth.uid() = ANY(participant_ids) OR created_by = auth.uid()
  )
);
