
-- FIX FOR RECURSIVE RLS POLICY (CAUSING 500 ERROR)

-- 1. Create a security definer function to check thread membership
-- This bypasses RLS to break the recursion chain
CREATE OR REPLACE FUNCTION public.check_thread_membership(t_id UUID, u_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.thread_reads
    WHERE thread_id = t_id AND user_id = u_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop the recursive policies
DROP POLICY IF EXISTS "View thread participants" ON public.thread_reads;
DROP POLICY IF EXISTS "Insert thread participants" ON public.thread_reads;

-- 3. Create non-recursive policies for thread_reads
CREATE POLICY "thread_reads_select" ON public.thread_reads
FOR SELECT USING (
  user_id = auth.uid() OR 
  public.check_thread_membership(thread_id, auth.uid())
);

CREATE POLICY "thread_reads_insert" ON public.thread_reads
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated'
);

-- 4. Ensure message_threads also has clean policies
DROP POLICY IF EXISTS "View threads" ON public.message_threads;
DROP POLICY IF EXISTS "Create threads" ON public.message_threads;

CREATE POLICY "message_threads_select" ON public.message_threads
FOR SELECT USING (
  created_by = auth.uid() OR
  public.check_thread_membership(id, auth.uid())
);

CREATE POLICY "message_threads_insert" ON public.message_threads
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated'
);

-- 5. Logic fix for messages
DROP POLICY IF EXISTS "View messages in joined threads" ON public.messages;
DROP POLICY IF EXISTS "Insert messages in joined threads" ON public.messages;

CREATE POLICY "messages_select" ON public.messages
FOR SELECT USING (
  sender_id = auth.uid() OR
  public.check_thread_membership(thread_id, auth.uid())
);

CREATE POLICY "messages_insert" ON public.messages
FOR INSERT WITH CHECK (
  sender_id = auth.uid() AND
  public.check_thread_membership(thread_id, auth.uid())
);
