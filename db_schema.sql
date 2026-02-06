
CREATE TABLE public._prisma_migrations (
  id character varying NOT NULL,
  checksum character varying NOT NULL,
  finished_at timestamp with time zone,
  migration_name character varying NOT NULL,
  logs text,
  rolled_back_at timestamp with time zone,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  applied_steps_count integer NOT NULL DEFAULT 0,
  CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id)
);
CREATE TABLE public.addresses (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  country text NOT NULL,
  state_province text,
  city text NOT NULL,
  postal_code text,
  street_address text NOT NULL,
  address_line2 text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT addresses_pkey PRIMARY KEY (id)
);
CREATE TABLE public.ai_actions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  case_id uuid,
  action_type text,
  input jsonb,
  output jsonb,
  tokens_used integer,
  cost_usd numeric,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT ai_actions_pkey PRIMARY KEY (id),
  CONSTRAINT ai_actions_case_id_fkey FOREIGN KEY (case_id) REFERENCES public.cases(id),
  CONSTRAINT ai_actions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.audit_logs (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  action text NOT NULL,
  entity text,
  entity_id uuid,
  metadata jsonb,
  ip_address text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT audit_logs_pkey PRIMARY KEY (id),
  CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.audit_trail_logs (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  changes jsonb,
  previous_values jsonb,
  ip_address text,
  user_agent text,
  status text NOT NULL DEFAULT 'success'::text,
  error_message text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT audit_trail_logs_pkey PRIMARY KEY (id),
  CONSTRAINT audit_trail_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.case_clients (
  case_id uuid NOT NULL,
  client_id uuid NOT NULL,
  role text DEFAULT 'secondary'::text,
  CONSTRAINT case_clients_pkey PRIMARY KEY (case_id, client_id),
  CONSTRAINT case_clients_case_id_fkey FOREIGN KEY (case_id) REFERENCES public.cases(id),
  CONSTRAINT case_clients_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.users(id)
);
CREATE TABLE public.case_documents (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  case_id uuid NOT NULL,
  name text NOT NULL,
  url text NOT NULL,
  type text,
  size bigint,
  uploaded_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  deleted_at timestamp with time zone,
  CONSTRAINT case_documents_pkey PRIMARY KEY (id),
  CONSTRAINT case_documents_case_id_fkey FOREIGN KEY (case_id) REFERENCES public.cases(id),
  CONSTRAINT case_documents_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.users(id)
);
CREATE TABLE public.case_tasks (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  case_id uuid NOT NULL,
  title text NOT NULL,
  assigned_to uuid,
  status text DEFAULT 'todo'::text,
  priority text DEFAULT 'medium'::text,
  due_date timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT case_tasks_pkey PRIMARY KEY (id),
  CONSTRAINT case_tasks_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.users(id),
  CONSTRAINT case_tasks_case_id_fkey FOREIGN KEY (case_id) REFERENCES public.cases(id)
);
CREATE TABLE public.cases (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  case_number text,
  title text NOT NULL,
  description text,
  chamber_id uuid NOT NULL,
  client_id uuid,
  assigned_to uuid,
  status text DEFAULT 'open'::text,
  priority text DEFAULT 'medium'::text,
  case_type text,
  filing_date date,
  next_hearing_date timestamp without time zone,
  legal_hold boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  deleted_at timestamp with time zone,
  CONSTRAINT cases_pkey PRIMARY KEY (id),
  CONSTRAINT cases_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.users(id),
  CONSTRAINT cases_chamber_id_fkey FOREIGN KEY (chamber_id) REFERENCES public.chambers(id),
  CONSTRAINT cases_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.users(id)
);
CREATE TABLE public.chamber_members (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  chamber_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'member'::text,
  joined_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT chamber_members_pkey PRIMARY KEY (id),
  CONSTRAINT chamber_members_chamber_id_fkey FOREIGN KEY (chamber_id) REFERENCES public.chambers(id),
  CONSTRAINT chamber_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.chamber_registration_verifications (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  chamber_id uuid NOT NULL,
  registration_number text NOT NULL,
  registration_certificate_url text,
  verification_status text NOT NULL DEFAULT 'pending'::text,
  verified_by uuid,
  verified_at timestamp with time zone,
  rejection_reason text,
  suspension_reason text,
  suspension_date date,
  registration_date date NOT NULL,
  registration_expiry_date date,
  chamber_type text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT chamber_registration_verifications_pkey PRIMARY KEY (id),
  CONSTRAINT chamber_registration_verifications_chamber_id_fkey FOREIGN KEY (chamber_id) REFERENCES public.chambers(id),
  CONSTRAINT chamber_registration_verifications_verified_by_fkey FOREIGN KEY (verified_by) REFERENCES public.users(id)
);
CREATE TABLE public.chamber_settings (
  chamber_id uuid NOT NULL,
  default_hourly_rate numeric DEFAULT 0,
  currency text DEFAULT 'PKR'::text,
  invoice_prefix text,
  timezone text DEFAULT 'Asia/Karachi'::text,
  branding_colors jsonb,
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT chamber_settings_pkey PRIMARY KEY (chamber_id),
  CONSTRAINT chamber_settings_chamber_id_fkey FOREIGN KEY (chamber_id) REFERENCES public.chambers(id)
);
CREATE TABLE public.chambers (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text,
  phone text,
  email text,
  website text,
  logo_url text,
  admin_id uuid,
  address_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  deleted_at timestamp with time zone,
  CONSTRAINT chambers_pkey PRIMARY KEY (id),
  CONSTRAINT fk_chamber_admin FOREIGN KEY (admin_id) REFERENCES public.users(id),
  CONSTRAINT chambers_address_id_fkey FOREIGN KEY (address_id) REFERENCES public.addresses(id)
);
CREATE TABLE public.client_kyc_verifications (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  client_id uuid NOT NULL,
  verification_type text NOT NULL,
  document_type text NOT NULL,
  document_number text NOT NULL,
  document_url text,
  verification_status text NOT NULL DEFAULT 'pending'::text,
  verified_by uuid,
  verified_at timestamp with time zone,
  rejection_reason text,
  tax_id text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT client_kyc_verifications_pkey PRIMARY KEY (id),
  CONSTRAINT client_kyc_verifications_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id),
  CONSTRAINT client_kyc_verifications_verified_by_fkey FOREIGN KEY (verified_by) REFERENCES public.users(id)
);
CREATE TABLE public.clients (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  company_name text,
  company_registration_number text,
  contact_person text,
  address_id uuid,
  gstn text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  deleted_at timestamp with time zone,
  CONSTRAINT clients_pkey PRIMARY KEY (id),
  CONSTRAINT clients_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT clients_address_id_fkey FOREIGN KEY (address_id) REFERENCES public.addresses(id)
);
CREATE TABLE public.hearings (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  case_id uuid NOT NULL,
  court_name text,
  judge_name text,
  hearing_date timestamp with time zone NOT NULL,
  outcome text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT hearings_pkey PRIMARY KEY (id),
  CONSTRAINT hearings_case_id_fkey FOREIGN KEY (case_id) REFERENCES public.cases(id)
);
CREATE TABLE public.invoice_items (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  invoice_id uuid,
  description text NOT NULL,
  quantity numeric DEFAULT 1,
  unit_price numeric NOT NULL,
  total numeric NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT invoice_items_pkey PRIMARY KEY (id),
  CONSTRAINT invoice_items_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id)
);
CREATE TABLE public.invoices (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  chamber_id uuid NOT NULL,
  client_id uuid NOT NULL,
  case_id uuid,
  invoice_number text,
  amount numeric NOT NULL,
  currency text DEFAULT 'PKR'::text,
  status text DEFAULT 'draft'::text,
  due_date date,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT invoices_pkey PRIMARY KEY (id),
  CONSTRAINT invoices_case_id_fkey FOREIGN KEY (case_id) REFERENCES public.cases(id),
  CONSTRAINT invoices_chamber_id_fkey FOREIGN KEY (chamber_id) REFERENCES public.chambers(id),
  CONSTRAINT invoices_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.users(id)
);
CREATE TABLE public.lawyer_license_verifications (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  lawyer_id uuid NOT NULL,
  bar_association text NOT NULL,
  license_number text NOT NULL,
  license_url text,
  verification_status text NOT NULL DEFAULT 'pending'::text,
  verified_by uuid,
  verified_at timestamp with time zone,
  rejection_reason text,
  suspension_reason text,
  suspension_date date,
  license_issue_date date NOT NULL,
  license_expiry_date date NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT lawyer_license_verifications_pkey PRIMARY KEY (id),
  CONSTRAINT lawyer_license_verifications_lawyer_id_fkey FOREIGN KEY (lawyer_id) REFERENCES public.lawyers(id),
  CONSTRAINT lawyer_license_verifications_verified_by_fkey FOREIGN KEY (verified_by) REFERENCES public.users(id)
);
CREATE TABLE public.lawyers (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  bar_number text,
  specialization text,
  bio text,
  experience_years integer DEFAULT 0,
  license_verification_status text DEFAULT 'pending'::text,
  verified_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  deleted_at timestamp with time zone,
  CONSTRAINT lawyers_pkey PRIMARY KEY (id),
  CONSTRAINT lawyers_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.leads (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  chamber_id uuid NOT NULL,
  name text NOT NULL,
  email text,
  phone text,
  source text,
  status text DEFAULT 'new'::text,
  notes text,
  last_contacted_at timestamp with time zone,
  assigned_to uuid,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  deleted_at timestamp with time zone,
  CONSTRAINT leads_pkey PRIMARY KEY (id),
  CONSTRAINT leads_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.users(id),
  CONSTRAINT leads_chamber_id_fkey FOREIGN KEY (chamber_id) REFERENCES public.chambers(id)
);
CREATE TABLE public.message_threads (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  case_id uuid,
  subject text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  created_by uuid DEFAULT auth.uid(),
  participant_ids ARRAY DEFAULT ARRAY[]::uuid[],
  CONSTRAINT message_threads_pkey PRIMARY KEY (id),
  CONSTRAINT message_threads_case_id_fkey FOREIGN KEY (case_id) REFERENCES public.cases(id),
  CONSTRAINT message_threads_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id)
);
CREATE TABLE public.messages (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  thread_id uuid,
  sender_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT messages_pkey PRIMARY KEY (id),
  CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id),
  CONSTRAINT messages_thread_id_fkey FOREIGN KEY (thread_id) REFERENCES public.message_threads(id)
);
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  message text,
  type text DEFAULT 'info'::text,
  link text,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  data jsonb,
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.onboarding_progress (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  role text NOT NULL,
  current_step integer NOT NULL DEFAULT 1,
  total_steps integer NOT NULL,
  completed_percentage integer NOT NULL DEFAULT 0,
  started_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  completed_at timestamp with time zone,
  is_completed boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT onboarding_progress_pkey PRIMARY KEY (id),
  CONSTRAINT onboarding_progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.onboarding_steps (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  step_key text NOT NULL,
  role text NOT NULL,
  step_number integer NOT NULL,
  step_name text NOT NULL,
  description text,
  is_required boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT onboarding_steps_pkey PRIMARY KEY (id)
);
CREATE TABLE public.onboarding_steps_completed (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  step_id uuid NOT NULL,
  step_key text NOT NULL,
  completed_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  completed_by_action text,
  metadata jsonb,
  CONSTRAINT onboarding_steps_completed_pkey PRIMARY KEY (id),
  CONSTRAINT onboarding_steps_completed_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT onboarding_steps_completed_step_id_fkey FOREIGN KEY (step_id) REFERENCES public.onboarding_steps(id)
);
CREATE TABLE public.payments (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  invoice_id uuid,
  amount numeric NOT NULL,
  method text,
  reference text,
  paid_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT payments_pkey PRIMARY KEY (id),
  CONSTRAINT payments_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id)
);
CREATE TABLE public.permissions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  key text NOT NULL,
  description text,
  CONSTRAINT permissions_pkey PRIMARY KEY (id)
);
CREATE TABLE public.role_permissions (
  role text NOT NULL,
  permission_id uuid NOT NULL,
  CONSTRAINT role_permissions_pkey PRIMARY KEY (role, permission_id),
  CONSTRAINT role_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.permissions(id)
);
CREATE TABLE public.thread_reads (
  thread_id uuid NOT NULL,
  user_id uuid NOT NULL,
  last_read_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT thread_reads_pkey PRIMARY KEY (thread_id, user_id),
  CONSTRAINT thread_reads_thread_id_fkey FOREIGN KEY (thread_id) REFERENCES public.message_threads(id),
  CONSTRAINT thread_reads_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.time_entries (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  case_id uuid,
  user_id uuid NOT NULL,
  description text,
  minutes integer NOT NULL,
  billable boolean DEFAULT true,
  rate numeric,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  deleted_at timestamp with time zone,
  CONSTRAINT time_entries_pkey PRIMARY KEY (id),
  CONSTRAINT time_entries_case_id_fkey FOREIGN KEY (case_id) REFERENCES public.cases(id),
  CONSTRAINT time_entries_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.user_identity_verifications (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  document_type text NOT NULL,
  document_number text NOT NULL,
  document_url text,
  verification_status text NOT NULL DEFAULT 'pending'::text,
  verified_by uuid,
  verified_at timestamp with time zone,
  rejection_reason text,
  expiry_date date,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT user_identity_verifications_pkey PRIMARY KEY (id),
  CONSTRAINT user_identity_verifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT user_identity_verifications_verified_by_fkey FOREIGN KEY (verified_by) REFERENCES public.users(id)
);
CREATE TABLE public.users (
  id uuid NOT NULL,
  email text NOT NULL,
  full_name text,
  role text NOT NULL,
  phone text,
  avatar_url text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  deleted_at timestamp with time zone,
  onboarding_completed boolean DEFAULT false,
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.verification_audit_logs (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  verification_id uuid NOT NULL,
  verification_type text NOT NULL,
  previous_status text,
  new_status text NOT NULL,
  changed_by uuid NOT NULL,
  change_reason text,
  ip_address text,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT verification_audit_logs_pkey PRIMARY KEY (id),
  CONSTRAINT verification_audit_logs_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES public.users(id)
);