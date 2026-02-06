-- Fix Notifications RLS Policies v2
-- More explicit and robust RLS policies for notifications table

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "notifications_select_v1" ON public.notifications;
DROP POLICY IF EXISTS "notifications_insert_v1" ON public.notifications;
DROP POLICY IF EXISTS "notifications_update_v1" ON public.notifications;
DROP POLICY IF EXISTS "notifications_delete_v1" ON public.notifications;

-- SELECT: Users can view their own notifications
CREATE POLICY "notifications_select_authenticated" ON public.notifications
FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND user_id = auth.uid()
);

-- INSERT: Any authenticated user can insert notifications (send to others)
CREATE POLICY "notifications_insert_authenticated" ON public.notifications
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND auth.role() = 'authenticated'
);

-- UPDATE: Users can update their own notifications (e.g., mark as read)
CREATE POLICY "notifications_update_authenticated" ON public.notifications
FOR UPDATE
USING (
  auth.uid() IS NOT NULL 
  AND user_id = auth.uid()
)
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND user_id = auth.uid()
);

-- DELETE: Users can delete their own notifications
CREATE POLICY "notifications_delete_authenticated" ON public.notifications
FOR DELETE
USING (
  auth.uid() IS NOT NULL 
  AND user_id = auth.uid()
);
