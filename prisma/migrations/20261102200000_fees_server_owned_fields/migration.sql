-- created_by and hearing_id are server-owned. A direct insert (trigger depth 1) cannot
-- set them: created_by is the caller, and hearing_id is reserved for the appearance
-- auto-charge (a forged one would claim the hearing's unique slot and block the real charge).

CREATE OR REPLACE FUNCTION public.case_ledger_before_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  n int;
  prefix text;
  y int := extract(year FROM NEW.entry_date)::int;
BEGIN
  SELECT chamber_id INTO NEW.chamber_id FROM public.cases WHERE id = NEW.case_id;
  NEW.voided_at := NULL; NEW.voided_by := NULL; NEW.void_reason := NULL;
  IF pg_trigger_depth() = 1 THEN
    NEW.created_by := auth.uid();
    NEW.hearing_id := NULL;
  END IF;
  IF NEW.kind = 'payment' THEN
    INSERT INTO public.chamber_receipt_counters (chamber_id, year, last_no) VALUES (NEW.chamber_id, y, 1)
    ON CONFLICT (chamber_id, year) DO UPDATE SET last_no = chamber_receipt_counters.last_no + 1
    RETURNING last_no INTO n;
    SELECT coalesce(nullif(trim(invoice_prefix), ''), 'RCPT') INTO prefix FROM public.chamber_settings WHERE chamber_id = NEW.chamber_id;
    NEW.receipt_no := coalesce(prefix, 'RCPT') || '-' || y || '-' || lpad(n::text, 4, '0');
  ELSE
    NEW.receipt_no := NULL;
  END IF;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.case_fee_agreements_set_chamber()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  SELECT chamber_id INTO NEW.chamber_id FROM public.cases WHERE id = NEW.case_id;
  IF TG_OP = 'INSERT' THEN
    NEW.created_by := auth.uid();
  ELSE
    NEW.created_by := OLD.created_by;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END $$;
