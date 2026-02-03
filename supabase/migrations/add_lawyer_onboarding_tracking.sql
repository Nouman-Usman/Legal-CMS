-- Add onboarding_completed field to users table to track lawyer onboarding status
alter table public.users
add column if not exists onboarding_completed boolean default false;

-- Add lawyer_profile data storage (JSONB for flexible fields)
alter table public.users
add column if not exists lawyer_profile jsonb;

-- Create index for tracking incomplete onboarding
create index if not exists idx_users_onboarding_status on public.users(role, onboarding_completed) where role = 'lawyer' and onboarding_completed = false;
