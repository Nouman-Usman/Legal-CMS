-- 1. Chamber clients: the chamber's own client records. Most clients never get an
--    app login, so they cannot live in public.users (which requires an auth user).
--    `user_id` links one optionally when a client joins the portal.
CREATE TABLE IF NOT EXISTS public.chamber_clients (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  chamber_id uuid NOT NULL REFERENCES public.chambers(id),
  full_name text NOT NULL,
  phone text,
  email text,
  notes text,
  user_id uuid REFERENCES public.users(id),
  created_by uuid REFERENCES public.users(id) DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_chamber_clients_chamber ON public.chamber_clients (chamber_id);

DROP TRIGGER IF EXISTS trg_chamber_clients_updated ON public.chamber_clients;
CREATE TRIGGER trg_chamber_clients_updated
BEFORE UPDATE ON public.chamber_clients
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.chamber_clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chamber_clients_select_member" ON public.chamber_clients
FOR SELECT USING (chamber_id IN (SELECT public.my_chamber_ids()));
CREATE POLICY "chamber_clients_insert_member" ON public.chamber_clients
FOR INSERT WITH CHECK (chamber_id IN (SELECT public.my_chamber_ids()));
CREATE POLICY "chamber_clients_update_member" ON public.chamber_clients
FOR UPDATE USING (chamber_id IN (SELECT public.my_chamber_ids()))
WITH CHECK (chamber_id IN (SELECT public.my_chamber_ids()));
CREATE POLICY "chamber_clients_delete_admin" ON public.chamber_clients
FOR DELETE USING (public.is_chamber_admin(chamber_id));

-- Cases point at the chamber client; client_name / client_phone stay on the case
-- as a snapshot for lists and WhatsApp updates.
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS chamber_client_id uuid REFERENCES public.chamber_clients(id);
CREATE INDEX IF NOT EXISTS idx_cases_chamber_client ON public.cases (chamber_client_id);

-- Backfill: one chamber client per distinct (chamber, name, phone) already on cases.
INSERT INTO public.chamber_clients (chamber_id, full_name, phone, created_by)
SELECT DISTINCT ON (c.chamber_id, lower(trim(c.client_name)), coalesce(c.client_phone, ''))
       c.chamber_id, trim(c.client_name), c.client_phone, NULL::uuid
FROM public.cases c
WHERE c.client_name IS NOT NULL AND trim(c.client_name) <> '' AND c.chamber_client_id IS NULL;

UPDATE public.cases c
SET chamber_client_id = cc.id
FROM public.chamber_clients cc
WHERE c.chamber_client_id IS NULL
  AND cc.chamber_id = c.chamber_id
  AND lower(trim(cc.full_name)) = lower(trim(c.client_name))
  AND coalesce(cc.phone, '') = coalesce(c.client_phone, '');

-- 2. Lawyer profiles (bar number, specialization): chamber admins may maintain the
--    rows of their own active members. Members cannot be added from the client side
--    (members_admin_insert was dropped), so this cannot reach outside the chamber.
CREATE POLICY "lawyers_admin_manage_members" ON public.lawyers
FOR ALL
USING (user_id IN (SELECT cm.user_id FROM public.chamber_members cm WHERE cm.is_active IS NOT FALSE AND public.is_chamber_admin(cm.chamber_id)))
WITH CHECK (user_id IN (SELECT cm.user_id FROM public.chamber_members cm WHERE cm.is_active IS NOT FALSE AND public.is_chamber_admin(cm.chamber_id)));
