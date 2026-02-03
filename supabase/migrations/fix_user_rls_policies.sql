-- FIX 500 ERROR (RECURSIVE RLS)
-- The previous policy caused infinite recursion. This migration fixes it using a Security Definer function.

-- 1. Create Security Definer function to safely check admin status without recursion
CREATE OR REPLACE FUNCTION public.check_is_admin_of_chamber(chamber_arg uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role = 'chamber_admin'
    AND chamber_id = chamber_arg
  );
$$;

GRANT EXECUTE ON FUNCTION public.check_is_admin_of_chamber(uuid) TO authenticated;

-- 2. Reset Policies
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view profiles in system" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can update chamber members" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view active profiles" ON public.users;
DROP POLICY IF EXISTS "Admins manage chamber members" ON public.users;

-- 3. Re-apply Policies (Non-Recursive)

-- VIEW OWN PROFILE (Always allowed)
CREATE POLICY "Users can view own profile"
ON public.users FOR SELECT USING (auth.uid() = id);

-- VIEW OTHERS (Active only)
CREATE POLICY "Users can view active profiles"
ON public.users FOR SELECT USING (auth.role() = 'authenticated' AND deleted_at IS NULL);

-- INSERT OWN
CREATE POLICY "Users can insert own profile"
ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

-- UPDATE OWN
CREATE POLICY "Users can update own profile"
ON public.users FOR UPDATE USING (auth.uid() = id);

-- ADMIN ACCESS (Using the safe function)
CREATE POLICY "Admins manage chamber members"
ON public.users FOR ALL USING (
  check_is_admin_of_chamber(chamber_id)
);

-- Grant privileges
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.users TO service_role;
