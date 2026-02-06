
-- RLS FOR NOTIFICATIONS
-- Ensure users can receive notifications and others can send them

-- 1. Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 2. Clean old policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Allow system/others to send notifications" ON public.notifications;
DROP POLICY IF EXISTS "notifications_select_policy" ON public.notifications;
DROP POLICY IF EXISTS "notifications_insert_policy" ON public.notifications;
DROP POLICY IF EXISTS "notifications_update_policy" ON public.notifications;

-- 3. New Policies
CREATE POLICY "notifications_select_v1" ON public.notifications
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "notifications_insert_v1" ON public.notifications
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "notifications_update_v1" ON public.notifications
FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "notifications_delete_v1" ON public.notifications
FOR DELETE USING (user_id = auth.uid());
