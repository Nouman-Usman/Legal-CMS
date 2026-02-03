-- Fix RLS to allow new users to insert their own profile
CREATE POLICY "Users can insert their own profile" ON users
  FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (id = auth.uid());

-- Also ensure public can sometimes read users for initial checks if needed, 
-- but strict security is better. Current 'SELECT' policies are fine.
