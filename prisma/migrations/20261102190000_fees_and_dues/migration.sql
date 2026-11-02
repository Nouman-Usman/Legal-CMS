-- Fees & dues: a fee agreement per case and an append-only ledger.
-- Charges: fee, appearance, expense. Credits: payment, waiver. Balance = charges - credits.
-- Entries are never edited or deleted; an admin can void one (with a reason).

CREATE TABLE IF NOT EXISTS public.case_fee_agreements (
  case_id uuid PRIMARY KEY REFERENCES public.cases(id) ON DELETE CASCADE,
  chamber_id uuid NOT NULL REFERENCES public.chambers(id),
  fee_type text NOT NULL CHECK (fee_type IN ('fixed', 'per_appearance', 'retainer')),
  agreed_amount numeric(12,2) CHECK (agreed_amount >= 0),
  appearance_fee numeric(12,2) CHECK (appearance_fee >= 0),
  currency text NOT NULL DEFAULT 'PKR',
  notes text,
  created_by uuid REFERENCES public.users(id) DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.case_ledger (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id uuid NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  chamber_id uuid NOT NULL REFERENCES public.chambers(id),
  kind text NOT NULL CHECK (kind IN ('fee', 'appearance', 'expense', 'payment', 'waiver')),
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  entry_date date NOT NULL DEFAULT current_date,
  description text,
  method text CHECK (method IN ('cash', 'bank', 'jazzcash', 'easypaisa', 'raast', 'cheque', 'other')),
  reference text,
  receipt_no text,
  hearing_id uuid UNIQUE REFERENCES public.hearings(id) ON DELETE SET NULL,
  created_by uuid REFERENCES public.users(id) DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  voided_at timestamptz,
  voided_by uuid REFERENCES public.users(id),
  void_reason text,
  CHECK ((kind = 'payment') = (method IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS idx_case_ledger_case ON public.case_ledger (case_id, entry_date);
CREATE INDEX IF NOT EXISTS idx_case_ledger_chamber ON public.case_ledger (chamber_id, entry_date);
CREATE UNIQUE INDEX IF NOT EXISTS idx_case_ledger_receipt ON public.case_ledger (chamber_id, receipt_no) WHERE receipt_no IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.chamber_receipt_counters (
  chamber_id uuid NOT NULL REFERENCES public.chambers(id),
  year int NOT NULL,
  last_no int NOT NULL DEFAULT 0,
  PRIMARY KEY (chamber_id, year)
);
ALTER TABLE public.chamber_receipt_counters ENABLE ROW LEVEL SECURITY; -- only touched by the definer trigger

-- chamber_id always comes from the case; payments get the next receipt number.
CREATE OR REPLACE FUNCTION public.case_ledger_before_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  n int;
  prefix text;
  y int := extract(year FROM NEW.entry_date)::int;
BEGIN
  SELECT chamber_id INTO NEW.chamber_id FROM public.cases WHERE id = NEW.case_id;
  NEW.voided_at := NULL; NEW.voided_by := NULL; NEW.void_reason := NULL;
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

DROP TRIGGER IF EXISTS trg_case_ledger_before_insert ON public.case_ledger;
CREATE TRIGGER trg_case_ledger_before_insert BEFORE INSERT ON public.case_ledger
FOR EACH ROW EXECUTE FUNCTION public.case_ledger_before_insert();

-- Append-only: an update may only void an entry.
CREATE OR REPLACE FUNCTION public.case_ledger_only_void()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF OLD.voided_at IS NOT NULL THEN
    RAISE EXCEPTION 'This entry is already void' USING ERRCODE = 'check_violation';
  END IF;
  IF NEW.voided_at IS NULL OR coalesce(trim(NEW.void_reason), '') = ''
     OR (NEW.case_id, NEW.chamber_id, NEW.kind, NEW.amount, NEW.entry_date, NEW.description, NEW.method, NEW.reference, NEW.receipt_no, NEW.hearing_id, NEW.created_by, NEW.created_at)
        IS DISTINCT FROM
        (OLD.case_id, OLD.chamber_id, OLD.kind, OLD.amount, OLD.entry_date, OLD.description, OLD.method, OLD.reference, OLD.receipt_no, OLD.hearing_id, OLD.created_by, OLD.created_at) THEN
    RAISE EXCEPTION 'Ledger entries cannot be edited; void the entry with a reason instead' USING ERRCODE = 'check_violation';
  END IF;
  NEW.voided_by := auth.uid();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_case_ledger_only_void ON public.case_ledger;
CREATE TRIGGER trg_case_ledger_only_void BEFORE UPDATE ON public.case_ledger
FOR EACH ROW EXECUTE FUNCTION public.case_ledger_only_void();

-- Agreements: chamber_id from the case.
CREATE OR REPLACE FUNCTION public.case_fee_agreements_set_chamber()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  SELECT chamber_id INTO NEW.chamber_id FROM public.cases WHERE id = NEW.case_id;
  NEW.updated_at := now();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_case_fee_agreements_set_chamber ON public.case_fee_agreements;
CREATE TRIGGER trg_case_fee_agreements_set_chamber BEFORE INSERT OR UPDATE ON public.case_fee_agreements
FOR EACH ROW EXECUTE FUNCTION public.case_fee_agreements_set_chamber();

-- Appearance fee: when a scheduled hearing is recorded as held/adjourned/decided on a
-- per-appearance case, charge it once (hearing_id is unique). "Not reached" is free.
CREATE OR REPLACE FUNCTION public.hearings_charge_appearance()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  fee numeric(12,2);
BEGIN
  IF OLD.status = 'scheduled' AND NEW.status IN ('held', 'adjourned', 'decided') THEN
    SELECT appearance_fee INTO fee FROM public.case_fee_agreements
    WHERE case_id = NEW.case_id AND fee_type = 'per_appearance' AND appearance_fee > 0;
    IF fee IS NOT NULL THEN
      INSERT INTO public.case_ledger (case_id, kind, amount, entry_date, description, hearing_id, created_by)
      VALUES (NEW.case_id, 'appearance', fee, (NEW.hearing_date AT TIME ZONE 'Asia/Karachi')::date,
              'Appearance' || coalesce(' – ' || NEW.court_name, ''), NEW.id, auth.uid())
      ON CONFLICT (hearing_id) DO NOTHING;
    END IF;
  END IF;
  RETURN NULL;
END $$;

DROP TRIGGER IF EXISTS trg_hearings_charge_appearance ON public.hearings;
CREATE TRIGGER trg_hearings_charge_appearance AFTER UPDATE OF status ON public.hearings
FOR EACH ROW EXECUTE FUNCTION public.hearings_charge_appearance();

-- Who may see/handle a case's money: chamber admins; the lawyer the case is assigned to.
CREATE OR REPLACE FUNCTION public.can_handle_case_money(cid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.cases c
    WHERE c.id = cid
      AND c.chamber_id IN (SELECT public.my_chamber_ids())
      AND (public.is_chamber_admin(c.chamber_id) OR c.assigned_to = auth.uid())
  )
$$;
REVOKE ALL ON FUNCTION public.can_handle_case_money(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_handle_case_money(uuid) TO authenticated;

ALTER TABLE public.case_fee_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fee_agreements_select" ON public.case_fee_agreements
FOR SELECT USING (
  public.can_handle_case_money(case_id)
  OR EXISTS (SELECT 1 FROM public.cases c WHERE c.id = case_fee_agreements.case_id AND c.client_id = auth.uid())
);
CREATE POLICY "fee_agreements_admin_insert" ON public.case_fee_agreements
FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.cases c WHERE c.id = case_id AND public.is_chamber_admin(c.chamber_id)));
CREATE POLICY "fee_agreements_admin_update" ON public.case_fee_agreements
FOR UPDATE USING (public.is_chamber_admin(chamber_id))
WITH CHECK (EXISTS (SELECT 1 FROM public.cases c WHERE c.id = case_id AND public.is_chamber_admin(c.chamber_id)));

CREATE POLICY "ledger_select" ON public.case_ledger
FOR SELECT USING (
  public.can_handle_case_money(case_id)
  OR EXISTS (SELECT 1 FROM public.cases c WHERE c.id = case_ledger.case_id AND c.client_id = auth.uid())
);
-- Admins add anything; the assigned lawyer may record payments and expenses.
CREATE POLICY "ledger_insert" ON public.case_ledger
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.cases c WHERE c.id = case_id AND public.is_chamber_admin(c.chamber_id))
  OR (kind IN ('payment', 'expense') AND public.can_handle_case_money(case_id))
);
CREATE POLICY "ledger_admin_void" ON public.case_ledger
FOR UPDATE USING (public.is_chamber_admin(chamber_id)) WITH CHECK (public.is_chamber_admin(chamber_id));

-- Balances per case (RLS of the caller applies).
CREATE OR REPLACE VIEW public.case_balances WITH (security_invoker = on) AS
SELECT
  c.id AS case_id,
  c.chamber_id,
  coalesce(sum(l.amount) FILTER (WHERE l.voided_at IS NULL AND l.kind IN ('fee', 'appearance', 'expense')), 0) AS charged,
  coalesce(sum(l.amount) FILTER (WHERE l.voided_at IS NULL AND l.kind = 'payment'), 0) AS paid,
  coalesce(sum(l.amount) FILTER (WHERE l.voided_at IS NULL AND l.kind = 'waiver'), 0) AS waived,
  coalesce(sum(l.amount) FILTER (WHERE l.voided_at IS NULL AND l.kind IN ('fee', 'appearance', 'expense')), 0)
    - coalesce(sum(l.amount) FILTER (WHERE l.voided_at IS NULL AND l.kind IN ('payment', 'waiver')), 0) AS balance,
  max(l.entry_date) FILTER (WHERE l.voided_at IS NULL AND l.kind = 'payment') AS last_payment_date
FROM public.cases c
JOIN public.case_ledger l ON l.case_id = c.id
GROUP BY c.id, c.chamber_id;

GRANT SELECT ON public.case_balances TO authenticated;
