
-- FINAL FIX FOR RLS RECURSION AND PUSHER LOGGING

-- 1. Break recursion once and for all with a materialized check
-- This function will run as postgres and bypass RLS
CREATE OR REPLACE FUNCTION public.is_member_of_thread(t_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Use auth.uid() directly inside the security definer function
  RETURN EXISTS (
    SELECT 1 FROM public.thread_reads
    WHERE thread_id = t_id 
    AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Clean and simple policies for thread_reads
DROP POLICY IF EXISTS "thread_reads_select" ON public.thread_reads;
DROP POLICY IF EXISTS "thread_reads_insert" ON public.thread_reads;
DROP POLICY IF EXISTS "View thread participants" ON public.thread_reads;
DROP POLICY IF EXISTS "Insert thread participants" ON public.thread_reads;

-- A user can see their own read receipt or any receipt in a thread they are part of
CREATE POLICY "thread_reads_select_policy" ON public.thread_reads
FOR SELECT USING (
  user_id = auth.uid() OR 
  public.is_member_of_thread(thread_id)
);

CREATE POLICY "thread_reads_insert_policy" ON public.thread_reads
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated'
);

-- 3. Clean and simple policies for message_threads
DROP POLICY IF EXISTS "message_threads_select" ON public.message_threads;
DROP POLICY IF EXISTS "message_threads_insert" ON public.message_threads;
DROP POLICY IF EXISTS "View threads" ON public.message_threads;
DROP POLICY IF EXISTS "Create threads" ON public.message_threads;

CREATE POLICY "message_threads_select_policy" ON public.message_threads
FOR SELECT USING (
  created_by = auth.uid() OR
  public.is_member_of_thread(id)
);

CREATE POLICY "message_threads_insert_policy" ON public.message_threads
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated'
);

-- 4. Clean and simple policies for messages
DROP POLICY IF EXISTS "messages_select" ON public.messages;
DROP POLICY IF EXISTS "messages_insert" ON public.messages;
DROP POLICY IF EXISTS "View messages in joined threads" ON public.messages;
DROP POLICY IF EXISTS "Insert messages in joined threads" ON public.messages;

CREATE POLICY "messages_select_policy" ON public.messages
FOR SELECT USING (
  sender_id = auth.uid() OR
  public.is_member_of_thread(thread_id)
);

CREATE POLICY "messages_insert_policy" ON public.messages
FOR INSERT WITH CHECK (
  sender_id = auth.uid() AND
  public.is_member_of_thread(thread_id)
);
