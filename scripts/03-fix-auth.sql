-- Connect public users to auth users automatically
-- This script fixes the issue where seeded users have different IDs than authenticated users

-- 1. First, we need to allow updating user IDs by adding ON UPDATE CASCADE to all foreign keys
-- We need to drop existing constraints and re-add them with CASCADE

DO $$
BEGIN
    -- cases: assigned_lawyer_id
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'cases_assigned_lawyer_id_fkey') THEN
        ALTER TABLE cases DROP CONSTRAINT cases_assigned_lawyer_id_fkey;
    END IF;
    ALTER TABLE cases ADD CONSTRAINT cases_assigned_lawyer_id_fkey 
        FOREIGN KEY (assigned_lawyer_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE RESTRICT;

    -- cases: client_id
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'cases_client_id_fkey') THEN
        ALTER TABLE cases DROP CONSTRAINT cases_client_id_fkey;
    END IF;
    ALTER TABLE cases ADD CONSTRAINT cases_client_id_fkey 
        FOREIGN KEY (client_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE;

    -- case_documents: uploaded_by_id
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'case_documents_uploaded_by_id_fkey') THEN
        ALTER TABLE case_documents DROP CONSTRAINT case_documents_uploaded_by_id_fkey;
    END IF;
    ALTER TABLE case_documents ADD CONSTRAINT case_documents_uploaded_by_id_fkey 
        FOREIGN KEY (uploaded_by_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE RESTRICT;

    -- case_activities: user_id
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'case_activities_user_id_fkey') THEN
        ALTER TABLE case_activities DROP CONSTRAINT case_activities_user_id_fkey;
    END IF;
    ALTER TABLE case_activities ADD CONSTRAINT case_activities_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE RESTRICT;

    -- messages: sender_id
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'messages_sender_id_fkey') THEN
        ALTER TABLE messages DROP CONSTRAINT messages_sender_id_fkey;
    END IF;
    ALTER TABLE messages ADD CONSTRAINT messages_sender_id_fkey 
        FOREIGN KEY (sender_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE RESTRICT;

    -- notifications: user_id
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'notifications_user_id_fkey') THEN
        ALTER TABLE notifications DROP CONSTRAINT notifications_user_id_fkey;
    END IF;
    ALTER TABLE notifications ADD CONSTRAINT notifications_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE;

    -- notifications: related_user_id
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'notifications_related_user_id_fkey') THEN
        ALTER TABLE notifications DROP CONSTRAINT notifications_related_user_id_fkey;
    END IF;
    ALTER TABLE notifications ADD CONSTRAINT notifications_related_user_id_fkey 
        FOREIGN KEY (related_user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL;

    -- tasks: assigned_to_id
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'tasks_assigned_to_id_fkey') THEN
        ALTER TABLE tasks DROP CONSTRAINT tasks_assigned_to_id_fkey;
    END IF;
    ALTER TABLE tasks ADD CONSTRAINT tasks_assigned_to_id_fkey 
        FOREIGN KEY (assigned_to_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE RESTRICT;
        
END $$;

-- 2. Create the function to link authenticated users to seeded data
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
  old_user_id UUID;
BEGIN
  -- Check if a seeded user exists with this email
  SELECT id INTO old_user_id FROM public.users WHERE email = NEW.email;

  IF old_user_id IS NOT NULL THEN
    -- If found, update the seeded user's ID to match the new Auth ID
    -- This works because of ON UPDATE CASCADE
    UPDATE public.users SET id = NEW.id, updated_at = NOW() WHERE id = old_user_id;
  ELSE
    -- If not found, inserting a new user is handled by client code or another trigger
    -- But we can do it here for robustness if we want (optional)
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create the trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 4. Temporary Fix for users who might have already signed up and failed
-- You can manually run this part if needed for specific emails
-- UPDATE public.users SET id = (SELECT id FROM auth.users WHERE email = public.users.email) 
-- WHERE EXISTS (SELECT 1 FROM auth.users WHERE email = public.users.email AND id != public.users.id);
