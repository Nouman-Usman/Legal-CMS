-- Follow-up to 20261102120000: close privilege-escalation paths on users.
--
-- 1. Chamber admins could add ANY user to their chamber (members_admin_insert)
--    and then edit that user's row. Memberships are created by the signup
--    trigger and the service-role invite API, so drop the client-side insert.
-- 2. Admin updates now only reach other, active members of a chamber they admin.
-- 3. `role` and `email` on public.users can no longer be changed by end users
--    (this also closes the older users_update_own hole that let anyone set
--    their own role). Service role and internal triggers (no auth.uid()) can.

DROP POLICY IF EXISTS "members_admin_insert" ON public.chamber_members;

DROP POLICY IF EXISTS "users_admin_update_own_chamber" ON public.users;
CREATE POLICY "users_admin_update_own_chamber" ON public.users
FOR UPDATE
USING (
  id <> auth.uid()
  AND id IN (SELECT cm.user_id FROM public.chamber_members cm WHERE cm.is_active IS NOT FALSE AND public.is_chamber_admin(cm.chamber_id))
)
WITH CHECK (
  id <> auth.uid()
  AND id IN (SELECT cm.user_id FROM public.chamber_members cm WHERE cm.is_active IS NOT FALSE AND public.is_chamber_admin(cm.chamber_id))
);

CREATE OR REPLACE FUNCTION public.users_protect_privileged_columns()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NOT NULL
     AND (NEW.role IS DISTINCT FROM OLD.role OR NEW.email IS DISTINCT FROM OLD.email) THEN
    RAISE EXCEPTION 'role and email cannot be changed from the app'
      USING ERRCODE = 'insufficient_privilege';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_users_protect_privileged_columns ON public.users;
CREATE TRIGGER trg_users_protect_privileged_columns
BEFORE UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION public.users_protect_privileged_columns();
