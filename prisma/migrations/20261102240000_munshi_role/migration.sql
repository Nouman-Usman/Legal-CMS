-- Munshi (chamber clerk): a chamber member who runs the docket, files and collections.
-- users.role = 'munshi' routes the app; chamber_members.role = 'munshi' is what the
-- database checks (the new enum value is not used elsewhere in this migration, so it
-- is safe inside a transaction).
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'munshi';

-- Money: admins, the case's assigned lawyer, and the chamber's munshis (who collect
-- fees). Munshis can record payments and expenses like the assigned lawyer; voids,
-- waivers and fee agreements stay with admins.
CREATE OR REPLACE FUNCTION public.can_handle_case_money(cid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.cases c
    WHERE c.id = cid
      AND c.chamber_id IN (SELECT public.my_chamber_ids())
      AND (
        public.is_chamber_admin(c.chamber_id)
        OR c.assigned_to = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.chamber_members m
          WHERE m.chamber_id = c.chamber_id AND m.user_id = auth.uid() AND m.role = 'munshi' AND m.is_active IS NOT FALSE
        )
      )
  )
$$;
