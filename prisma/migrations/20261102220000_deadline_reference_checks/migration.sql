-- Deadline references must stay inside the case's chamber: the responsible lawyer is an
-- active member (reminder emails go to them) and the source hearing belongs to the case.

CREATE OR REPLACE FUNCTION public.case_deadlines_before_write()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  SELECT chamber_id INTO NEW.chamber_id FROM public.cases WHERE id = NEW.case_id;
  NEW.updated_at := now();
  -- References must stay inside the case's chamber (reminders email the assignee).
  -- Checked when the assignee is set or changed, so a deadline whose lawyer later left
  -- can still be marked done.
  IF NEW.assigned_to IS NOT NULL AND (TG_OP = 'INSERT' OR NEW.assigned_to IS DISTINCT FROM OLD.assigned_to) AND NOT EXISTS (
    SELECT 1 FROM public.chamber_members cm
    WHERE cm.user_id = NEW.assigned_to AND cm.chamber_id = NEW.chamber_id AND cm.is_active IS NOT FALSE
  ) THEN
    RAISE EXCEPTION 'The responsible lawyer must be an active member of this chamber' USING ERRCODE = 'check_violation';
  END IF;
  IF NEW.source_hearing_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.hearings h WHERE h.id = NEW.source_hearing_id AND h.case_id = NEW.case_id
  ) THEN
    RAISE EXCEPTION 'The source hearing must belong to this case' USING ERRCODE = 'check_violation';
  END IF;
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
