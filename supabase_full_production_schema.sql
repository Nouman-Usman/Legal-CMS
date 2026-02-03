-- ==============================================================================
-- APNA WAQEEL - ENTERPRISE PRODUCTION SCHEMA (v5.0 - Final Hardened)
-- ==============================================================================
-- This schema defines the database structure for a multi-tenant legal case management system.
-- Includes: RBAC, Billing (Line Items + Integrity), Audit Logs, AI Readiness, strict RLS, Leads,
-- Time Tracking, Threads (Read Receipts), Multi-Client Cases, and Chamber Configuration.
-- HARDENING: Auto-timestamps, Financial Integrity, Deep RLS Security, Performance Indexes.

-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";

-- 2. CHAMBERS (Law Firms)
create table if not exists public.chambers (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  address text,
  phone text,
  email text,
  website text,
  logo_url text,
  admin_id uuid,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  deleted_at timestamp with time zone
);

create table if not exists public.chamber_settings (
  chamber_id uuid primary key references public.chambers(id) on delete cascade,
  default_hourly_rate numeric(10,2) default 0,
  currency text default 'PKR',
  invoice_prefix text,
  timezone text default 'Asia/Karachi',
  branding_colors jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. USERS & RBAC
create table if not exists public.users (
  id uuid references auth.users on delete cascade not null primary key,
  email text not null,
  full_name text,
  role text not null check (role in ('chamber_admin', 'lawyer', 'client')),
  chamber_id uuid references public.chambers(id),
  phone text,
  avatar_url text,
  specialization text,
  bar_number text,
  status text default 'active' check (status in ('active', 'inactive', 'pending')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  deleted_at timestamp with time zone
);

alter table public.chambers 
add constraint fk_chamber_admin 
foreign key (admin_id) references public.users(id);

create table if not exists public.permissions (
  id uuid default uuid_generate_v4() primary key,
  key text unique not null,
  description text
);

create table if not exists public.role_permissions (
  role text not null,
  permission_id uuid references public.permissions(id) on delete cascade,
  primary key (role, permission_id)
);

-- 4. LEADS & INTAKE (CRM)
create table if not exists public.leads (
  id uuid default uuid_generate_v4() primary key,
  chamber_id uuid references public.chambers(id) not null,
  name text not null,
  email text,
  phone text,
  source text,
  status text default 'new' check (status in ('new','contacted','consultation','converted','lost')),
  notes text,
  last_contacted_at timestamp with time zone,
  assigned_to uuid references public.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  deleted_at timestamp with time zone
);

-- 5. CASES & OPERATIONS
create table if not exists public.cases (
  id uuid default uuid_generate_v4() primary key,
  case_number text,
  title text not null,
  description text,
  chamber_id uuid references public.chambers(id) not null,
  client_id uuid references public.users(id),
  assigned_to uuid references public.users(id),
  status text default 'open' check (status in ('open', 'closed', 'pending', 'archived')),
  priority text default 'medium' check (priority in ('low', 'medium', 'high', 'critical')),
  case_type text,
  filing_date date,
  next_hearing_date timestamp,
  legal_hold boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  deleted_at timestamp with time zone
);

create table if not exists public.case_clients (
  case_id uuid references public.cases(id) on delete cascade,
  client_id uuid references public.users(id),
  role text default 'secondary',
  primary key (case_id, client_id)
);

create table if not exists public.hearings (
  id uuid default uuid_generate_v4() primary key,
  case_id uuid references public.cases(id) on delete cascade not null,
  court_name text,
  judge_name text,
  hearing_date timestamp with time zone not null,
  outcome text,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.case_tasks (
  id uuid default uuid_generate_v4() primary key,
  case_id uuid references public.cases(id) on delete cascade not null,
  title text not null,
  assigned_to uuid references public.users(id),
  status text default 'todo' check (status in ('todo', 'in_progress', 'done', 'review')),
  priority text default 'medium',
  due_date timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.case_documents (
  id uuid default uuid_generate_v4() primary key,
  case_id uuid references public.cases(id) on delete cascade not null,
  name text not null,
  url text not null,
  type text,
  size bigint,
  uploaded_by uuid references public.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  deleted_at timestamp with time zone
);

-- Time Tracking
create table if not exists public.time_entries (
  id uuid default uuid_generate_v4() primary key,
  case_id uuid references public.cases(id) on delete cascade,
  user_id uuid references public.users(id) not null,
  description text,
  minutes integer not null,
  billable boolean default true,
  rate numeric(10,2),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  deleted_at timestamp with time zone
);

-- 6. COMMUNICATION (Threads + Messages)
create table if not exists public.message_threads (
  id uuid default uuid_generate_v4() primary key,
  case_id uuid references public.cases(id),
  subject text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.messages (
  id uuid default uuid_generate_v4() primary key,
  thread_id uuid references public.message_threads(id),
  sender_id uuid references public.users(id) not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.thread_reads (
  thread_id uuid references public.message_threads(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade,
  last_read_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (thread_id, user_id)
);

create table if not exists public.notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  title text not null,
  message text,
  type text default 'info',
  link text,
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. BILLING & FINANCE
create table if not exists public.invoices (
  id uuid default uuid_generate_v4() primary key,
  chamber_id uuid references public.chambers(id) not null,
  client_id uuid references public.users(id) not null,
  case_id uuid references public.cases(id),
  invoice_number text,
  amount numeric(12,2) not null,
  currency text default 'PKR',
  status text check (status in ('draft', 'sent', 'paid', 'overdue', 'cancelled')) default 'draft',
  due_date date,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.invoice_items (
  id uuid default uuid_generate_v4() primary key,
  invoice_id uuid references public.invoices(id) on delete cascade,
  description text not null,
  quantity numeric default 1,
  unit_price numeric(10,2) not null,
  total numeric(12,2) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.payments (
  id uuid default uuid_generate_v4() primary key,
  invoice_id uuid references public.invoices(id) on delete cascade,
  amount numeric(12,2) not null,
  method text,
  reference text,
  paid_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. AUDIT & AI LOGS
create table if not exists public.audit_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id),
  action text not null,
  entity text,
  entity_id uuid,
  metadata jsonb,
  ip_address text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.ai_actions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id),
  case_id uuid references public.cases(id),
  action_type text,
  input jsonb,
  output jsonb,
  tokens_used integer,
  cost_usd numeric(10,4),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==============================================================================
-- INDEXING
-- ==============================================================================

create index if not exists idx_users_chamber on public.users(chamber_id);
create index if not exists idx_leads_chamber on public.leads(chamber_id);
create index if not exists idx_cases_chamber on public.cases(chamber_id);
create index if not exists idx_cases_client on public.cases(client_id);
create index if not exists idx_time_entries_case on public.time_entries(case_id);
create index if not exists idx_messages_thread_created on public.messages(thread_id, created_at desc);
create index if not exists idx_audit_user on public.audit_logs(user_id);
create index if not exists idx_invoice_items_invoice on public.invoice_items(invoice_id);

-- ==============================================================================
-- TRIGGERS & FUNCTIONS
-- ==============================================================================

-- 1. Auto-update updated_at
create or replace function touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_users_updated before update on public.users for each row execute procedure touch_updated_at();
create trigger trg_chambers_updated before update on public.chambers for each row execute procedure touch_updated_at();
create trigger trg_chamber_settings_updated before update on public.chamber_settings for each row execute procedure touch_updated_at();
create trigger trg_leads_updated before update on public.leads for each row execute procedure touch_updated_at();
create trigger trg_cases_updated before update on public.cases for each row execute procedure touch_updated_at();
create trigger trg_message_threads_updated before update on public.message_threads for each row execute procedure touch_updated_at();

-- 2. Financial Integrity (Invoice Calculation)
create or replace function calculate_invoice_item_total()
returns trigger language plpgsql as $$
begin
  new.total := new.quantity * new.unit_price;
  return new;
end;
$$;
create trigger trg_invoice_item_total before insert or update on public.invoice_items for each row execute procedure calculate_invoice_item_total();

-- 3. Auto-set hourly rate for time entries
create or replace function set_default_hourly_rate()
returns trigger language plpgsql as $$
begin
  if new.rate is null then
    select default_hourly_rate into new.rate
    from public.chamber_settings cs
    join public.cases c on c.chamber_id = cs.chamber_id
    where c.id = new.case_id;
  end if;
  return new;
end;
$$;
create trigger trg_time_entries_rate before insert on public.time_entries for each row execute procedure set_default_hourly_rate();

-- 4. Auth User Sync
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, email, full_name, role)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''), coalesce(new.raw_user_meta_data->>'role', 'client'));
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

-- 5. Helper Function
create or replace function has_permission(p_permission text)
returns boolean language sql security definer set search_path = public as $$
  select exists (
    select 1 from public.users u
    join public.role_permissions rp on rp.role = u.role
    join public.permissions p on p.id = rp.permission_id
    where u.id = auth.uid() and p.key = p_permission
  );
$$;
grant execute on function has_permission(text) to authenticated;

create or replace function get_chamber_lawyers(p_chamber_id uuid)
returns setof public.users language sql security definer set search_path = public as $$
  select * from public.users where chamber_id = p_chamber_id and role = 'lawyer' and status = 'active' and deleted_at is null order by created_at desc;
$$;
grant execute on function get_chamber_lawyers(uuid) to authenticated;

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) - HARDENED
-- ==============================================================================

alter table public.chambers enable row level security;
alter table public.chamber_settings enable row level security;
alter table public.users enable row level security;
alter table public.leads enable row level security;
alter table public.cases enable row level security;
alter table public.case_clients enable row level security;
alter table public.hearings enable row level security;
alter table public.case_tasks enable row level security;
alter table public.case_documents enable row level security;
alter table public.time_entries enable row level security;
alter table public.message_threads enable row level security;
alter table public.messages enable row level security;
alter table public.thread_reads enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;
alter table public.payments enable row level security;
alter table public.audit_logs enable row level security;
alter table public.ai_actions enable row level security;

-- USERS
create policy "Authenticated users can view profiles" on public.users for select using (auth.role() = 'authenticated' and deleted_at is null);
create policy "Users can update own profile" on public.users for update using (auth.uid() = id);

-- CHAMBERS
create policy "Authenticated users can view chambers" on public.chambers for select using (auth.role() = 'authenticated' and deleted_at is null);
create policy "Users can create chambers" on public.chambers for insert with check (auth.role() = 'authenticated');
create policy "Admins can update own chamber" on public.chambers for update using (auth.uid() = admin_id);

-- SETTINGS
create policy "Settings visible to members" on public.chamber_settings for select using (
  exists (select 1 from public.users u where u.id = auth.uid() and u.chamber_id = chamber_settings.chamber_id)
);
create policy "Admins manage settings" on public.chamber_settings for all using (
  exists (select 1 from public.users u where u.id = auth.uid() and u.chamber_id = chamber_settings.chamber_id and u.role = 'chamber_admin')
);

-- LEADS
create policy "Chamber members view leads" on public.leads for select using (
  (deleted_at is null) and
  exists (select 1 from public.users u where u.id = auth.uid() and u.chamber_id = leads.chamber_id)
);
create policy "Chamber members manage leads" on public.leads for all using (
  exists (select 1 from public.users u where u.id = auth.uid() and u.chamber_id = leads.chamber_id)
);

-- CASES
create policy "View cases (Role Based)" on public.cases for select using (
  (deleted_at is null) AND (
    client_id = auth.uid() OR
    assigned_to = auth.uid() OR
    exists (select 1 from public.case_clients cc where cc.case_id = cases.id and cc.client_id = auth.uid()) OR
    exists (
      select 1 from public.users u 
      where u.id = auth.uid() 
      and u.chamber_id = cases.chamber_id 
      and u.role in ('chamber_admin', 'lawyer')
    )
  )
);
create policy "Delete cases (No Legal Hold)" on public.cases for delete using (
  legal_hold = false AND
  exists (select 1 from public.users u where u.id = auth.uid() and u.chamber_id = cases.chamber_id and u.role = 'chamber_admin')
);

-- ACCESS INHERITANCE (Docs, Time, Tasks)
create policy "Access case related items" on public.case_documents for select using (
  (deleted_at is null) and
  exists (select 1 from public.cases c where c.id = case_documents.case_id and (
    c.client_id = auth.uid() OR c.assigned_to = auth.uid() OR
    exists (select 1 from public.case_clients cc where cc.case_id = c.id and cc.client_id = auth.uid()) OR
    exists (select 1 from public.users u where u.id = auth.uid() and u.chamber_id = c.chamber_id)
  ))
);

create policy "Time tracking visibility" on public.time_entries for select using (
  (deleted_at is null) and (
  user_id = auth.uid() OR
  exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'chamber_admin' and u.chamber_id = (select chamber_id from public.cases where id = time_entries.case_id))
  )
);

-- MESSAGING SECURITY FIX
create policy "View threads" on public.message_threads for select using (
  exists (select 1 from public.cases c where c.id = message_threads.case_id and (
    c.client_id = auth.uid() OR 
    exists (select 1 from public.case_clients cc where cc.case_id = c.id and cc.client_id = auth.uid()) OR
    exists (select 1 from public.users u where u.id = auth.uid() and u.chamber_id = c.chamber_id)
  ))
);

create policy "View messages" on public.messages for select using (
  sender_id = auth.uid() OR 
  exists (
    select 1 from public.message_threads t
    join public.cases c on c.id = t.case_id
    where t.id = messages.thread_id
      and (
        c.client_id = auth.uid()
        or exists (select 1 from public.case_clients cc where cc.case_id = c.id and cc.client_id = auth.uid())
        or exists (select 1 from public.users u where u.id = auth.uid() and u.chamber_id = c.chamber_id)
      )
  )
);

-- PAYMENTS RLS
create policy "Admins manage payments" on public.payments for all using (
  exists (
    select 1 from public.invoices i
    join public.users u on u.id = auth.uid()
    where i.id = payments.invoice_id
      and u.chamber_id = i.chamber_id
      and u.role = 'chamber_admin'
  )
);

-- BILLING & AUDIT
create policy "Admins View Invoices" on public.invoices for all using (
  exists (select 1 from public.users u where u.id = auth.uid() and u.chamber_id = invoices.chamber_id and u.role = 'chamber_admin')
);
create policy "Clients View Own Invoices" on public.invoices for select using (client_id = auth.uid());

create policy "Admins view audit logs" on public.audit_logs for select using (
  exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'chamber_admin')
);
