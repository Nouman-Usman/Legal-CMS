-- Deadlines per case (filing, reply, compliance, appeal...) and the days a chamber's
-- courts are closed (used by the limitation calculator, Limitation Act s.4).

CREATE TABLE IF NOT EXISTS public.case_deadlines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  chamber_id uuid REFERENCES public.chambers(id),
  kind text NOT NULL DEFAULT 'other' CHECK (kind IN ('filing', 'reply', 'compliance', 'appeal', 'other')),
  title text NOT NULL CHECK (length(trim(title)) BETWEEN 1 AND 200),
  due_date date NOT NULL,
  assigned_to uuid REFERENCES public.users(id),
  source_hearing_id uuid REFERENCES public.hearings(id) ON DELETE SET NULL,
  limitation_article text,
  notes text,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'done', 'cancelled')),
  completed_at timestamptz,
  completed_by uuid REFERENCES public.users(id),
  reminded_3d_at timestamptz,
  reminded_1d_at timestamptz,
  created_by uuid REFERENCES public.users(id) DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_case_deadlines_chamber_due ON public.case_deadlines (chamber_id, status, due_date);
CREATE INDEX IF NOT EXISTS idx_case_deadlines_case ON public.case_deadlines (case_id, due_date);

-- Server-owned fields: chamber from the case, creator, completion stamp. Reminder stamps
-- can only be written by the service role (auth.uid() is null there).
CREATE OR REPLACE FUNCTION public.case_deadlines_before_write()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  SELECT chamber_id INTO NEW.chamber_id FROM public.cases WHERE id = NEW.case_id;
  NEW.updated_at := now();
  IF TG_OP = 'INSERT' THEN
    IF auth.uid() IS NOT NULL THEN
      NEW.created_by := auth.uid();
      NEW.reminded_3d_at := NULL;
      NEW.reminded_1d_at := NULL;
    END IF;
    NEW.completed_at := CASE WHEN NEW.status = 'done' THEN now() END;
    NEW.completed_by := CASE WHEN NEW.status = 'done' THEN auth.uid() END;
  ELSE
    NEW.created_by := OLD.created_by;
    NEW.created_at := OLD.created_at;
    IF auth.uid() IS NOT NULL THEN
      NEW.reminded_3d_at := OLD.reminded_3d_at;
      NEW.reminded_1d_at := OLD.reminded_1d_at;
    END IF;
    IF NEW.status = 'done' AND OLD.status IS DISTINCT FROM 'done' THEN
      NEW.completed_at := now();
      NEW.completed_by := auth.uid();
    ELSIF NEW.status <> 'done' THEN
      NEW.completed_at := NULL;
      NEW.completed_by := NULL;
    ELSE
      NEW.completed_at := OLD.completed_at;
      NEW.completed_by := OLD.completed_by;
    END IF;
    -- A new due date earns fresh reminders.
    IF NEW.due_date IS DISTINCT FROM OLD.due_date THEN
      NEW.reminded_3d_at := NULL;
      NEW.reminded_1d_at := NULL;
    END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_case_deadlines_before_write ON public.case_deadlines;
CREATE TRIGGER trg_case_deadlines_before_write BEFORE INSERT OR UPDATE ON public.case_deadlines
FOR EACH ROW EXECUTE FUNCTION public.case_deadlines_before_write();

ALTER TABLE public.case_deadlines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "deadlines_select_member" ON public.case_deadlines
FOR SELECT USING (chamber_id IN (SELECT public.my_chamber_ids()));
CREATE POLICY "deadlines_insert_member" ON public.case_deadlines
FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.cases c WHERE c.id = case_deadlines.case_id AND c.chamber_id IN (SELECT public.my_chamber_ids())));
CREATE POLICY "deadlines_update_member" ON public.case_deadlines
FOR UPDATE USING (chamber_id IN (SELECT public.my_chamber_ids()))
WITH CHECK (EXISTS (SELECT 1 FROM public.cases c WHERE c.id = case_deadlines.case_id AND c.chamber_id IN (SELECT public.my_chamber_ids())));
CREATE POLICY "deadlines_delete_admin" ON public.case_deadlines
FOR DELETE USING (public.is_chamber_admin(chamber_id));

-- Days the chamber's courts are closed (gazetted holidays, vacations).
CREATE TABLE IF NOT EXISTS public.chamber_court_holidays (
  chamber_id uuid NOT NULL REFERENCES public.chambers(id) ON DELETE CASCADE,
  holiday_date date NOT NULL,
  label text CHECK (label IS NULL OR length(label) <= 120),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (chamber_id, holiday_date)
);

ALTER TABLE public.chamber_court_holidays ENABLE ROW LEVEL SECURITY;

CREATE POLICY "holidays_select_member" ON public.chamber_court_holidays
FOR SELECT USING (chamber_id IN (SELECT public.my_chamber_ids()));
CREATE POLICY "holidays_insert_admin" ON public.chamber_court_holidays
FOR INSERT WITH CHECK (public.is_chamber_admin(chamber_id));
CREATE POLICY "holidays_delete_admin" ON public.chamber_court_holidays
FOR DELETE USING (public.is_chamber_admin(chamber_id));
