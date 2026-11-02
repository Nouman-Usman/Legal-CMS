-- Chamber-scoped access for case data + hearing log / daily docket.
--
-- Before this migration, cases, case_tasks, case_documents, case_clients and
-- hearings had RLS enabled with no policies (nothing readable by signed-in
-- users), and `users_admin_manage` let any chamber admin modify any user in
-- any chamber. Membership lives in public.chamber_members.

-- ─── helpers ───────────────────────────────────────────────────────────────
-- SECURITY DEFINER so policies can read memberships without recursing into
-- chamber_members' own RLS.
CREATE OR REPLACE FUNCTION public.my_chamber_ids()
RETURNS SETOF uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT chamber_id FROM public.chamber_members
  WHERE user_id = auth.uid() AND is_active IS NOT FALSE
$$;

CREATE OR REPLACE FUNCTION public.is_chamber_admin(cid uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.chamber_members
    WHERE user_id = auth.uid() AND chamber_id = cid AND role = 'admin' AND is_active IS NOT FALSE
  )
$$;

REVOKE ALL ON FUNCTION public.my_chamber_ids() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_chamber_admin(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_chamber_ids() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_chamber_admin(uuid) TO authenticated;

-- ─── users: close the cross-chamber admin hole ─────────────────────────────
DROP POLICY IF EXISTS "users_admin_manage" ON public.users;
CREATE POLICY "users_admin_update_own_chamber" ON public.users
FOR UPDATE
USING (id IN (SELECT cm.user_id FROM public.chamber_members cm WHERE public.is_chamber_admin(cm.chamber_id)))
WITH CHECK (id IN (SELECT cm.user_id FROM public.chamber_members cm WHERE public.is_chamber_admin(cm.chamber_id)));

-- ─── chamber_members: only your own chambers' rosters ──────────────────────
DROP POLICY IF EXISTS "View chamber memberships" ON public.chamber_members;
CREATE POLICY "members_select_own_chambers" ON public.chamber_members
FOR SELECT USING (user_id = auth.uid() OR chamber_id IN (SELECT public.my_chamber_ids()));
CREATE POLICY "members_admin_insert" ON public.chamber_members
FOR INSERT WITH CHECK (public.is_chamber_admin(chamber_id));
CREATE POLICY "members_admin_update" ON public.chamber_members
FOR UPDATE USING (public.is_chamber_admin(chamber_id)) WITH CHECK (public.is_chamber_admin(chamber_id));

-- ─── cases ─────────────────────────────────────────────────────────────────
CREATE POLICY "cases_select_member_or_client" ON public.cases
FOR SELECT USING (chamber_id IN (SELECT public.my_chamber_ids()) OR client_id = auth.uid());
CREATE POLICY "cases_insert_member" ON public.cases
FOR INSERT WITH CHECK (chamber_id IN (SELECT public.my_chamber_ids()));
CREATE POLICY "cases_update_member" ON public.cases
FOR UPDATE USING (chamber_id IN (SELECT public.my_chamber_ids()))
WITH CHECK (chamber_id IN (SELECT public.my_chamber_ids()));
CREATE POLICY "cases_delete_admin" ON public.cases
FOR DELETE USING (public.is_chamber_admin(chamber_id));

ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS court text;
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS stage text;

-- ─── case children: access follows the case's chamber ──────────────────────
CREATE POLICY "case_tasks_member_all" ON public.case_tasks
FOR ALL USING (EXISTS (SELECT 1 FROM public.cases c WHERE c.id = case_tasks.case_id AND c.chamber_id IN (SELECT public.my_chamber_ids())))
WITH CHECK (EXISTS (SELECT 1 FROM public.cases c WHERE c.id = case_tasks.case_id AND c.chamber_id IN (SELECT public.my_chamber_ids())));

CREATE POLICY "case_documents_member_all" ON public.case_documents
FOR ALL USING (EXISTS (SELECT 1 FROM public.cases c WHERE c.id = case_documents.case_id AND c.chamber_id IN (SELECT public.my_chamber_ids())))
WITH CHECK (EXISTS (SELECT 1 FROM public.cases c WHERE c.id = case_documents.case_id AND c.chamber_id IN (SELECT public.my_chamber_ids())));

CREATE POLICY "case_clients_member_all" ON public.case_clients
FOR ALL USING (EXISTS (SELECT 1 FROM public.cases c WHERE c.id = case_clients.case_id AND c.chamber_id IN (SELECT public.my_chamber_ids())))
WITH CHECK (EXISTS (SELECT 1 FROM public.cases c WHERE c.id = case_clients.case_id AND c.chamber_id IN (SELECT public.my_chamber_ids())));

-- ─── hearings: the hearing log ─────────────────────────────────────────────
ALTER TABLE public.hearings ADD COLUMN IF NOT EXISTS chamber_id uuid REFERENCES public.chambers(id);
ALTER TABLE public.hearings ADD COLUMN IF NOT EXISTS purpose text;
ALTER TABLE public.hearings ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'scheduled';
ALTER TABLE public.hearings ADD COLUMN IF NOT EXISTS proceedings text;
ALTER TABLE public.hearings ADD COLUMN IF NOT EXISTS appearing_lawyer_id uuid REFERENCES public.users(id);
ALTER TABLE public.hearings ADD COLUMN IF NOT EXISTS cause_list_no text;
ALTER TABLE public.hearings ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.users(id) DEFAULT auth.uid();
ALTER TABLE public.hearings ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.hearings DROP CONSTRAINT IF EXISTS hearings_status_check;
ALTER TABLE public.hearings ADD CONSTRAINT hearings_status_check
  CHECK (status IN ('scheduled', 'held', 'adjourned', 'decided', 'not_reached'));

CREATE INDEX IF NOT EXISTS idx_hearings_chamber_date ON public.hearings (chamber_id, hearing_date);
CREATE INDEX IF NOT EXISTS idx_hearings_case ON public.hearings (case_id, hearing_date);
CREATE INDEX IF NOT EXISTS idx_hearings_lawyer_date ON public.hearings (appearing_lawyer_id, hearing_date);

-- chamber_id always comes from the case, so it cannot be spoofed by the client.
CREATE OR REPLACE FUNCTION public.hearings_set_chamber()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  SELECT chamber_id INTO NEW.chamber_id FROM public.cases WHERE id = NEW.case_id;
  NEW.updated_at := now();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_hearings_set_chamber ON public.hearings;
CREATE TRIGGER trg_hearings_set_chamber
BEFORE INSERT OR UPDATE ON public.hearings
FOR EACH ROW EXECUTE FUNCTION public.hearings_set_chamber();

-- cases.next_hearing_date = earliest scheduled hearing from today on.
CREATE OR REPLACE FUNCTION public.cases_sync_next_hearing()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  target uuid := COALESCE(NEW.case_id, OLD.case_id);
BEGIN
  UPDATE public.cases SET next_hearing_date = (
    SELECT min(h.hearing_date) FROM public.hearings h
    WHERE h.case_id = target AND h.status = 'scheduled' AND h.hearing_date >= date_trunc('day', now())
  )
  WHERE id = target;
  RETURN NULL;
END $$;

DROP TRIGGER IF EXISTS trg_cases_sync_next_hearing ON public.hearings;
CREATE TRIGGER trg_cases_sync_next_hearing
AFTER INSERT OR UPDATE OR DELETE ON public.hearings
FOR EACH ROW EXECUTE FUNCTION public.cases_sync_next_hearing();

CREATE POLICY "hearings_select_member_or_client" ON public.hearings
FOR SELECT USING (
  chamber_id IN (SELECT public.my_chamber_ids())
  OR EXISTS (SELECT 1 FROM public.cases c WHERE c.id = hearings.case_id AND c.client_id = auth.uid())
);
CREATE POLICY "hearings_insert_member" ON public.hearings
FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.cases c WHERE c.id = hearings.case_id AND c.chamber_id IN (SELECT public.my_chamber_ids())));
CREATE POLICY "hearings_update_member" ON public.hearings
FOR UPDATE USING (chamber_id IN (SELECT public.my_chamber_ids()))
WITH CHECK (EXISTS (SELECT 1 FROM public.cases c WHERE c.id = hearings.case_id AND c.chamber_id IN (SELECT public.my_chamber_ids())));
CREATE POLICY "hearings_delete_admin" ON public.hearings
FOR DELETE USING (public.is_chamber_admin(chamber_id));
