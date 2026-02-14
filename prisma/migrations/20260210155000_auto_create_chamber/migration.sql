CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  new_user_role text;
  new_chamber_id uuid;
BEGIN
  -- 1. Determine role
  new_user_role := COALESCE(new.raw_user_meta_data->>'role', 'client');

  -- 2. Insert into public.users
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)), 
    new_user_role
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role; -- Ensure role is updated if metadata changes

  -- 3. If role is 'chamber_admin', create a default chamber
  IF new_user_role = 'chamber_admin' THEN
    -- Check if user already has a chamber (as admin)
    SELECT id INTO new_chamber_id FROM chambers WHERE admin_id = new.id;
    
    IF new_chamber_id IS NULL THEN
        -- Create new chamber
        INSERT INTO chambers (name, admin_id)
        VALUES (COALESCE(new.raw_user_meta_data->>'company_name', 'My Chamber'), new.id)
        RETURNING id INTO new_chamber_id;
    END IF;

    -- Add to chamber_members as admin
    INSERT INTO chamber_members (chamber_id, user_id, role)
    VALUES (new_chamber_id, new.id, 'admin')
    ON CONFLICT (chamber_id, user_id) DO NOTHING;
  END IF;

  RETURN new;
END;
$$;

-- Run backfill for existing auth users who might be missing from public table or missing chamber
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT * FROM auth.users LOOP
    -- Simulate trigger logic by calling it manually? No, just copy logic.
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = r.id) THEN
        INSERT INTO public.users (id, email, full_name, role) VALUES (
            r.id, 
            r.email, 
            COALESCE(r.raw_user_meta_data->>'full_name', split_part(r.email, '@', 1)), 
            COALESCE(r.raw_user_meta_data->>'role', 'client')
        );
    END IF;
    
    -- If admin, create chamber
    IF (r.raw_user_meta_data->>'role') = 'chamber_admin' THEN
        IF NOT EXISTS (SELECT 1 FROM chambers WHERE admin_id = r.id) THEN
            WITH new_chamber AS (
                INSERT INTO chambers (name, admin_id) VALUES (COALESCE(r.raw_user_meta_data->>'company_name', 'My Chamber'), r.id) RETURNING id
            )
            INSERT INTO chamber_members (chamber_id, user_id, role)
            SELECT id, r.id, 'admin' FROM new_chamber;
        END IF;
    END IF;
  END LOOP;
END;
$$;
