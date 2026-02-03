-- FORCE update RLS policies for users table

-- 1. Drop existing policies on users table to avoid conflicts
DROP POLICY IF EXISTS "Users can read their own profile" ON users;
DROP POLICY IF EXISTS "Users in same chamber can view each other (limited)" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users; -- In case you ran the previous script
DROP POLICY IF EXISTS "Users can update their own profile" ON users;

-- 2. Re-create base policies
CREATE POLICY "Users can read their own profile" ON users
  FOR SELECT USING (id = auth.uid());

-- 3. Create INSERT policy (Crucial for Sign Up)
CREATE POLICY "Users can insert their own profile" ON users
  FOR INSERT WITH CHECK (id = auth.uid());

-- 4. Create UPDATE policy
CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (id = auth.uid());

-- 5. Additional read policies
CREATE POLICY "Users in same chamber can view each other" ON users
  FOR SELECT USING (
    chamber_id IN (SELECT chamber_id FROM users WHERE id = auth.uid()) 
    OR chamber_id IS NULL -- Allow reading potentially if logic requires (optional, making strict is better)
  );

-- 6. Allow reading chamber admins or lawyers if needed (optional)
-- CREATE POLICY "Public read for directory" ON users ... 
