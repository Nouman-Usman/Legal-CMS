-- FIX NOTIFICATIONS AND MESSAGING RLS (Consolidated)

-- 1. NOTIFICATIONS
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS data JSONB;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Drop all possible existing notification policies to start clean
DROP POLICY IF EXISTS "notifications_select_v1" ON public.notifications;
DROP POLICY IF EXISTS "notifications_insert_v1" ON public.notifications;
DROP POLICY IF EXISTS "notifications_update_v1" ON public.notifications;
DROP POLICY IF EXISTS "notifications_delete_v1" ON public.notifications;
DROP POLICY IF EXISTS "notifications_select_authenticated" ON public.notifications;
DROP POLICY IF EXISTS "notifications_insert_authenticated" ON public.notifications;
DROP POLICY IF EXISTS "notifications_update_authenticated" ON public.notifications;
DROP POLICY IF EXISTS "notifications_delete_authenticated" ON public.notifications;

-- Only user can see their own notifications
CREATE POLICY "notifications_view_own" ON public.notifications
FOR SELECT USING (user_id = auth.uid());

-- Any authenticated user can send a notification (insert)
CREATE POLICY "notifications_insert_any" ON public.notifications
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Only user can update (mark as read)
CREATE POLICY "notifications_update_own" ON public.notifications
FOR UPDATE USING (user_id = auth.uid());

-- Only user can delete
CREATE POLICY "notifications_delete_own" ON public.notifications
FOR DELETE USING (user_id = auth.uid());


-- 2. MESSAGE THREADS (Flat RLS)
ALTER TABLE public.message_threads ADD COLUMN IF NOT EXISTS participant_ids UUID[] DEFAULT '{}';

-- Backfill participant_ids if empty (ensures existing threads work with new policies)
DO $$ 
BEGIN
    UPDATE public.message_threads mt
    SET participant_ids = (
        SELECT array_agg(user_id)
        FROM public.thread_reads tr
        WHERE tr.thread_id = mt.id
    )
    WHERE (participant_ids IS NULL OR participant_ids = '{}') 
    AND EXISTS (
        SELECT 1 FROM public.thread_reads tr WHERE tr.thread_id = mt.id
    );
END $$;

-- Drop all possible overlapping thread policies
DROP POLICY IF EXISTS "threads_select_v3" ON public.message_threads;
DROP POLICY IF EXISTS "threads_insert_v3" ON public.message_threads;
DROP POLICY IF EXISTS "threads_update_v3" ON public.message_threads;
DROP POLICY IF EXISTS "message_threads_select_policy" ON public.message_threads;
DROP POLICY IF EXISTS "threads_view_flat" ON public.message_threads;
DROP POLICY IF EXISTS "threads_insert_flat" ON public.message_threads;
DROP POLICY IF EXISTS "threads_update_flat" ON public.message_threads;

-- View: If you are in participant_ids or created it
CREATE POLICY "threads_view_flat" ON public.message_threads
FOR SELECT USING (
  auth.uid() = ANY(participant_ids) OR
  created_by = auth.uid() OR
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'chamber_admin')
);

-- Insert: Authenticated users
CREATE POLICY "threads_insert_flat" ON public.message_threads
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Update: If you are a participant
CREATE POLICY "threads_update_flat" ON public.message_threads
FOR UPDATE USING (
  auth.uid() = ANY(participant_ids) OR created_by = auth.uid()
);


-- 3. THREAD READS
DROP POLICY IF EXISTS "reads_select_v3" ON public.thread_reads;
DROP POLICY IF EXISTS "reads_insert_v3" ON public.thread_reads;
DROP POLICY IF EXISTS "reads_view_flat" ON public.thread_reads;
DROP POLICY IF EXISTS "reads_insert_flat" ON public.thread_reads;

-- View: Only your own reads OR if you are in the thread (allows seeing read receipts if desired)
CREATE POLICY "reads_view_flat" ON public.thread_reads
FOR SELECT USING (
  user_id = auth.uid() OR
  thread_id IN (
      SELECT id FROM public.message_threads 
      WHERE auth.uid() = ANY(participant_ids) OR created_by = auth.uid()
  )
);

-- Insert: Authenticated users
CREATE POLICY "reads_insert_flat" ON public.thread_reads
FOR INSERT WITH CHECK (auth.role() = 'authenticated');


-- 4. MESSAGES
DROP POLICY IF EXISTS "messages_select_v3" ON public.messages;
DROP POLICY IF EXISTS "messages_insert_v3" ON public.messages;
DROP POLICY IF EXISTS "messages_view_flat" ON public.messages;
DROP POLICY IF EXISTS "messages_insert_flat" ON public.messages;

-- View: If you are a participant in the thread
CREATE POLICY "messages_view_flat" ON public.messages
FOR SELECT USING (
  sender_id = auth.uid() OR
  thread_id IN (
      SELECT id FROM public.message_threads 
      WHERE auth.uid() = ANY(participant_ids) OR created_by = auth.uid()
  )
);

-- Insert: If you are a participant in the thread
CREATE POLICY "messages_insert_flat" ON public.messages
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND
  thread_id IN (
      SELECT id FROM public.message_threads 
      WHERE auth.uid() = ANY(participant_ids) OR created_by = auth.uid()
  )
);
