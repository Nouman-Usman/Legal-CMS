-- Intake and conflict check: the other parties to each case, and an append-only record
-- of every conflict check the chamber ran before taking a matter.

CREATE TABLE IF NOT EXISTS public.case_parties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  chamber_id uuid REFERENCES public.chambers(id),
  name text NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 200),
  role text NOT NULL DEFAULT 'opposing' CHECK (role IN ('opposing', 'other')),
  created_by uuid REFERENCES public.users(id) DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_case_parties_chamber ON public.case_parties (chamber_id);
CREATE INDEX IF NOT EXISTS idx_case_parties_case ON public.case_parties (case_id);

CREATE OR REPLACE FUNCTION public.case_parties_before_write()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  SELECT chamber_id INTO NEW.chamber_id FROM public.cases WHERE id = NEW.case_id;
  IF TG_OP = 'INSERT' THEN
    NEW.created_by := auth.uid();
    NEW.created_at := now();
  ELSE
    NEW.created_by := OLD.created_by;
    NEW.created_at := OLD.created_at;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_case_parties_before_write ON public.case_parties;
CREATE TRIGGER trg_case_parties_before_write BEFORE INSERT OR UPDATE ON public.case_parties
FOR EACH ROW EXECUTE FUNCTION public.case_parties_before_write();

ALTER TABLE public.case_parties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "case_parties_member_all" ON public.case_parties
FOR ALL USING (chamber_id IN (SELECT public.my_chamber_ids()))
WITH CHECK (EXISTS (SELECT 1 FROM public.cases c WHERE c.id = case_parties.case_id AND c.chamber_id IN (SELECT public.my_chamber_ids())));

-- Conflict checks are a record: insert only, never edited or deleted from the app.
CREATE TABLE IF NOT EXISTS public.conflict_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chamber_id uuid NOT NULL REFERENCES public.chambers(id),
  client_name text NOT NULL CHECK (length(trim(client_name)) BETWEEN 1 AND 200),
  client_phone text,
  opposing_names text[] NOT NULL DEFAULT '{}',
  matter text,
  hits jsonb NOT NULL DEFAULT '[]',
  conflict_count int NOT NULL DEFAULT 0,
  review_count int NOT NULL DEFAULT 0,
  outcome text NOT NULL CHECK (outcome IN ('clear', 'conflict', 'waived')),
  notes text,
  checked_by uuid REFERENCES public.users(id) DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  -- Going ahead despite a conflict needs the reason (e.g. written consent of both sides).
  CONSTRAINT conflict_checks_waiver_reason CHECK (outcome <> 'waived' OR length(trim(coalesce(notes, ''))) > 0),
  -- A check with conflicts cannot be marked clear.
  CONSTRAINT conflict_checks_clear_means_clear CHECK (outcome <> 'clear' OR conflict_count = 0)
);
CREATE INDEX IF NOT EXISTS idx_conflict_checks_chamber ON public.conflict_checks (chamber_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.conflict_checks_before_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.checked_by := auth.uid();
  NEW.created_at := now();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_conflict_checks_before_insert ON public.conflict_checks;
CREATE TRIGGER trg_conflict_checks_before_insert BEFORE INSERT ON public.conflict_checks
FOR EACH ROW EXECUTE FUNCTION public.conflict_checks_before_insert();

ALTER TABLE public.conflict_checks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "conflict_checks_select_member" ON public.conflict_checks
FOR SELECT USING (chamber_id IN (SELECT public.my_chamber_ids()));
CREATE POLICY "conflict_checks_insert_member" ON public.conflict_checks
FOR INSERT WITH CHECK (chamber_id IN (SELECT public.my_chamber_ids()));

-- The case remembers the check it was opened under (same chamber only).
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS conflict_check_id uuid REFERENCES public.conflict_checks(id);

CREATE OR REPLACE FUNCTION public.cases_conflict_check_same_chamber()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.conflict_check_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.conflict_checks cc WHERE cc.id = NEW.conflict_check_id AND cc.chamber_id = NEW.chamber_id AND cc.outcome IN ('clear', 'waived')
  ) THEN
    RAISE EXCEPTION 'The conflict check must be a cleared or waived check of this chamber' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_cases_conflict_check_same_chamber ON public.cases;
CREATE TRIGGER trg_cases_conflict_check_same_chamber BEFORE INSERT OR UPDATE OF conflict_check_id, chamber_id ON public.cases
FOR EACH ROW EXECUTE FUNCTION public.cases_conflict_check_same_chamber();
