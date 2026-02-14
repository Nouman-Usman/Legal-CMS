-- 1. Ensure user exists strictly (assuming auth user exists)
INSERT INTO "users" (id, email, role, full_name)
VALUES (
  '1d7e1507-9453-48f3-9e58-0ec2e7143acd', 
  'test.admin@example.net', 
  'chamber_admin', 
  'Test Admin'
)
ON CONFLICT (id) DO UPDATE SET role = 'chamber_admin';

-- 2. Create Chamber
INSERT INTO "chambers" (id, name, admin_id)
VALUES (
  '11111111-1111-1111-1111-111111111111', 
  'Test Chamber', 
  '1d7e1507-9453-48f3-9e58-0ec2e7143acd'
)
ON CONFLICT (id) DO NOTHING;

-- 3. Link User to Chamber
INSERT INTO "chamber_members" (chamber_id, user_id, role)
VALUES (
  '11111111-1111-1111-1111-111111111111', 
  '1d7e1507-9453-48f3-9e58-0ec2e7143acd', 
  'chamber_admin'
)
ON CONFLICT (chamber_id, user_id) DO NOTHING;

-- 4. Insert Audit Logs (User 1)
INSERT INTO "audit_logs" (user_id, action, entity, metadata)
VALUES 
  ('1d7e1507-9453-48f3-9e58-0ec2e7143acd', 'LOGIN_SUCCESS', 'AUTH', '{"ip": "127.0.0.1"}'),
  ('1d7e1507-9453-48f3-9e58-0ec2e7143acd', 'CASE_CREATED', 'CASE', '{"case_id": "123"}');
