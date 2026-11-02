-- An admin UPDATE on chamber_members could rewrite user_id and so enrol any user
-- into the admin's chamber. Membership changes go through the service-role API.
DROP POLICY IF EXISTS "members_admin_update" ON public.chamber_members;
