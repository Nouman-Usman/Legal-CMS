-- Cause-list tracking (Lahore High Court first): per-chamber settings and sync health,
-- each lawyer's LHC code, and every listing the nightly sync found for the chamber.

ALTER TABLE public.lawyers ADD COLUMN IF NOT EXISTS lhc_lawyer_code text
  CHECK (lhc_lawyer_code IS NULL OR lhc_lawyer_code ~ '^[A-Za-z0-9/-]{1,20}$');

ALTER TABLE public.hearings ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'manual'
  CHECK (source IN ('manual', 'cause_list'));

-- Settings and health. (Kept apart from chamber_settings, which has no access policies.)
CREATE TABLE IF NOT EXISTS public.chamber_court_tracking (
  chamber_id uuid PRIMARY KEY REFERENCES public.chambers(id) ON DELETE CASCADE,
  lhc_enabled boolean NOT NULL DEFAULT false,
  lhc_location text NOT NULL DEFAULT 'All' CHECK (lhc_location IN ('All', 'ucrijaz', 'bwpsaeed', 'Mulriaz', 'RWPAbid')),
  last_sync_at timestamptz,
  last_sync_status text CHECK (last_sync_status IN ('ok', 'partial', 'failed')),
  last_sync_message text,
  last_manual_sync_at timestamptz,
  last_digest_date date,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Admins change the settings; sync health is written by the server (service role) only.
CREATE OR REPLACE FUNCTION public.chamber_court_tracking_before_write()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.updated_at := now();
  IF auth.uid() IS NOT NULL THEN
    IF TG_OP = 'INSERT' THEN
      NEW.last_sync_at := NULL; NEW.last_sync_status := NULL; NEW.last_sync_message := NULL;
      NEW.last_manual_sync_at := NULL; NEW.last_digest_date := NULL;
    ELSE
      NEW.last_sync_at := OLD.last_sync_at; NEW.last_sync_status := OLD.last_sync_status;
      NEW.last_sync_message := OLD.last_sync_message; NEW.last_manual_sync_at := OLD.last_manual_sync_at;
      NEW.last_digest_date := OLD.last_digest_date;
    END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_chamber_court_tracking_before_write ON public.chamber_court_tracking;
CREATE TRIGGER trg_chamber_court_tracking_before_write BEFORE INSERT OR UPDATE ON public.chamber_court_tracking
FOR EACH ROW EXECUTE FUNCTION public.chamber_court_tracking_before_write();

ALTER TABLE public.chamber_court_tracking ENABLE ROW LEVEL SECURITY;
CREATE POLICY "court_tracking_select_member" ON public.chamber_court_tracking
FOR SELECT USING (chamber_id IN (SELECT public.my_chamber_ids()));
CREATE POLICY "court_tracking_insert_admin" ON public.chamber_court_tracking
FOR INSERT WITH CHECK (public.is_chamber_admin(chamber_id));
CREATE POLICY "court_tracking_update_admin" ON public.chamber_court_tracking
FOR UPDATE USING (public.is_chamber_admin(chamber_id)) WITH CHECK (public.is_chamber_admin(chamber_id));

-- Listings found by the sync. Inserted by the server only; members link or ignore them.
CREATE TABLE IF NOT EXISTS public.cause_list_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chamber_id uuid NOT NULL REFERENCES public.chambers(id) ON DELETE CASCADE,
  source text NOT NULL DEFAULT 'lhc' CHECK (source IN ('lhc')),
  entry_key text NOT NULL,
  list_date date NOT NULL,
  bench text,
  judge text,
  court_room text,
  seq text,
  connected boolean NOT NULL DEFAULT false,
  list_type text NOT NULL DEFAULT 'unknown' CHECK (list_type IN ('old', 'regular', 'stay', 'part_heard', 'reserved', 'unknown')),
  category text,
  case_no text NOT NULL,
  title text,
  lawyer_name text,
  remarks text,
  queried_lawyer_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  case_id uuid REFERENCES public.cases(id) ON DELETE SET NULL,
  hearing_id uuid REFERENCES public.hearings(id) ON DELETE SET NULL,
  match_status text NOT NULL DEFAULT 'unmatched' CHECK (match_status IN ('auto', 'suggested', 'unmatched', 'linked', 'ignored')),
  match_note text,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (chamber_id, source, entry_key)
);
CREATE INDEX IF NOT EXISTS idx_cause_list_entries_chamber_date ON public.cause_list_entries (chamber_id, list_date);
CREATE INDEX IF NOT EXISTS idx_cause_list_entries_case ON public.cause_list_entries (case_id);

-- Members may only link (case, hearing) or set the review status; links stay in-chamber.
CREATE OR REPLACE FUNCTION public.cause_list_entries_before_update()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NOT NULL THEN
    IF (NEW.chamber_id, NEW.source, NEW.entry_key, NEW.list_date, NEW.bench, NEW.judge, NEW.court_room, NEW.seq, NEW.connected,
        NEW.list_type, NEW.category, NEW.case_no, NEW.title, NEW.lawyer_name, NEW.remarks, NEW.queried_lawyer_id, NEW.first_seen_at, NEW.last_seen_at)
       IS DISTINCT FROM
       (OLD.chamber_id, OLD.source, OLD.entry_key, OLD.list_date, OLD.bench, OLD.judge, OLD.court_room, OLD.seq, OLD.connected,
        OLD.list_type, OLD.category, OLD.case_no, OLD.title, OLD.lawyer_name, OLD.remarks, OLD.queried_lawyer_id, OLD.first_seen_at, OLD.last_seen_at) THEN
      RAISE EXCEPTION 'Only the case link and review status of a listing can be changed' USING ERRCODE = 'check_violation';
    END IF;
    IF NEW.match_status NOT IN ('linked', 'ignored', OLD.match_status) THEN
      RAISE EXCEPTION 'A listing can only be linked or ignored' USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  IF NEW.case_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.cases c WHERE c.id = NEW.case_id AND c.chamber_id = NEW.chamber_id) THEN
    RAISE EXCEPTION 'The case must belong to this chamber' USING ERRCODE = 'check_violation';
  END IF;
  IF NEW.hearing_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.hearings h WHERE h.id = NEW.hearing_id AND h.case_id = NEW.case_id) THEN
    RAISE EXCEPTION 'The hearing must belong to the linked case' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_cause_list_entries_before_update ON public.cause_list_entries;
CREATE TRIGGER trg_cause_list_entries_before_update BEFORE UPDATE ON public.cause_list_entries
FOR EACH ROW EXECUTE FUNCTION public.cause_list_entries_before_update();

ALTER TABLE public.cause_list_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cause_list_select_member" ON public.cause_list_entries
FOR SELECT USING (chamber_id IN (SELECT public.my_chamber_ids()));
CREATE POLICY "cause_list_update_member" ON public.cause_list_entries
FOR UPDATE USING (chamber_id IN (SELECT public.my_chamber_ids())) WITH CHECK (chamber_id IN (SELECT public.my_chamber_ids()));
