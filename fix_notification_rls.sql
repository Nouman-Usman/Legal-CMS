-- Re-apply notification policies (idempotent)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing notification policies
DROP POLICY IF EXISTS "notifications_select_v1" ON public.notifications;
DROP POLICY IF EXISTS "notifications_insert_v1" ON public.notifications;
DROP POLICY IF EXISTS "notifications_update_v1" ON public.notifications;
DROP POLICY IF EXISTS "notifications_delete_v1" ON public.notifications;
DROP POLICY IF EXISTS "notifications_select_authenticated" ON public.notifications;
DROP POLICY IF EXISTS "notifications_insert_authenticated" ON public.notifications;
DROP POLICY IF EXISTS "notifications_update_authenticated" ON public.notifications;
DROP POLICY IF EXISTS "notifications_delete_authenticated" ON public.notifications;
DROP POLICY IF EXISTS "notifications_view_own" ON public.notifications;
DROP POLICY IF EXISTS "notifications_insert_any" ON public.notifications;
DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;
DROP POLICY IF EXISTS "notifications_delete_own" ON public.notifications;

-- Create fresh policies
CREATE POLICY "notifications_view_own" ON public.notifications
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "notifications_insert_any" ON public.notifications
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "notifications_update_own" ON public.notifications
FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "notifications_delete_own" ON public.notifications
FOR DELETE USING (user_id = auth.uid());
