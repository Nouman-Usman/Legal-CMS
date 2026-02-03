-- Seed data for Legal Case Management Platform
-- This script adds sample data for all three user roles

-- Disable foreign key checks temporarily if needed
SET session_replication_role = replica;

-- 1. Insert sample chambers
INSERT INTO chambers (name, email, phone, address, city, country, website)
VALUES 
  ('Apex Law Partners', 'info@apexlaw.com', '+1-212-555-0100', '123 Legal Avenue', 'New York', 'USA', 'https://apexlaw.com'),
  ('Justice Associates', 'contact@justice.com', '+1-415-555-0200', '456 Court Street', 'San Francisco', 'USA', 'https://justice.com'),
  ('Global Legal Solutions', 'hello@globallegal.com', '+44-20-7555-0300', '789 Bar Lane', 'London', 'UK', 'https://globallegal.com')
ON CONFLICT (name) DO NOTHING;

-- Get chamber IDs for use in user creation
-- Note: We'll use actual UUIDs from the inserted chambers

-- 2. Insert chamber admin users (these will be synced with Supabase auth in practice)
INSERT INTO users (id, email, full_name, role, chamber_id, phone, verified)
SELECT 
  uuid_generate_v4(),
  'admin@apexlaw.com',
  'Sarah Johnson',
  'chamber_admin',
  (SELECT id FROM chambers WHERE name = 'Apex Law Partners' LIMIT 1),
  '+1-212-555-0101',
  true
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@apexlaw.com')
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (id, email, full_name, role, chamber_id, phone, verified)
SELECT 
  uuid_generate_v4(),
  'admin@justice.com',
  'Michael Chen',
  'chamber_admin',
  (SELECT id FROM chambers WHERE name = 'Justice Associates' LIMIT 1),
  '+1-415-555-0201',
  true
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@justice.com')
ON CONFLICT (email) DO NOTHING;

-- 3. Insert lawyer users
INSERT INTO users (id, email, full_name, role, chamber_id, phone, specialization, bar_registration_number, verified, bio)
SELECT 
  uuid_generate_v4(),
  'john.lawyer@apexlaw.com',
  'John Smith',
  'lawyer',
  (SELECT id FROM chambers WHERE name = 'Apex Law Partners' LIMIT 1),
  '+1-212-555-0110',
  'Corporate Law',
  'NY-2024-001',
  true,
  'Experienced corporate lawyer with 15 years of practice'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'john.lawyer@apexlaw.com')
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (id, email, full_name, role, chamber_id, phone, specialization, bar_registration_number, verified, bio)
SELECT 
  uuid_generate_v4(),
  'emma.counsel@apexlaw.com',
  'Emma Davis',
  'lawyer',
  (SELECT id FROM chambers WHERE name = 'Apex Law Partners' LIMIT 1),
  '+1-212-555-0111',
  'Intellectual Property',
  'NY-2024-002',
  true,
  'Specialized in IP and patent litigation'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'emma.counsel@apexlaw.com')
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (id, email, full_name, role, chamber_id, phone, specialization, bar_registration_number, verified, bio)
SELECT 
  uuid_generate_v4(),
  'david.partner@justice.com',
  'David Martinez',
  'lawyer',
  (SELECT id FROM chambers WHERE name = 'Justice Associates' LIMIT 1),
  '+1-415-555-0210',
  'Family Law',
  'CA-2024-001',
  true,
  'Dedicated family law attorney with expertise in mediation'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'david.partner@justice.com')
ON CONFLICT (email) DO NOTHING;

-- 4. Insert client users
INSERT INTO users (id, email, full_name, role, phone, verified, bio)
SELECT 
  uuid_generate_v4(),
  'client1@example.com',
  'Alice Williams',
  'client',
  '+1-555-1001',
  true,
  'Tech startup founder'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'client1@example.com')
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (id, email, full_name, role, phone, verified, bio)
SELECT 
  uuid_generate_v4(),
  'client2@example.com',
  'Robert Brown',
  'client',
  '+1-555-1002',
  true,
  'Real estate investor'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'client2@example.com')
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (id, email, full_name, role, phone, verified, bio)
SELECT 
  uuid_generate_v4(),
  'client3@example.com',
  'Lisa Anderson',
  'client',
  '+1-555-1003',
  true,
  'Small business owner'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'client3@example.com')
ON CONFLICT (email) DO NOTHING;

-- 5. Insert sample cases
INSERT INTO cases (case_number, title, description, status, chamber_id, assigned_lawyer_id, client_id, case_type, court, filing_date, hearing_date, deadline, priority)
SELECT 
  'CASE-2024-001',
  'Smith v. TechCorp - Patent Infringement',
  'Intellectual property dispute regarding patent #8,123,456. Client alleges unauthorized use of patented technology.',
  'open',
  (SELECT id FROM chambers WHERE name = 'Apex Law Partners' LIMIT 1),
  (SELECT id FROM users WHERE email = 'emma.counsel@apexlaw.com' LIMIT 1),
  (SELECT id FROM users WHERE email = 'client1@example.com' LIMIT 1),
  'Intellectual Property',
  'U.S. District Court, Southern District of New York',
  '2024-01-15',
  '2024-06-20',
  '2024-05-31',
  'high'
WHERE NOT EXISTS (SELECT 1 FROM cases WHERE case_number = 'CASE-2024-001')
ON CONFLICT (case_number) DO NOTHING;

INSERT INTO cases (case_number, title, description, status, chamber_id, assigned_lawyer_id, client_id, case_type, court, filing_date, hearing_date, deadline, priority)
SELECT 
  'CASE-2024-002',
  'Brown v. PropertyDev LLC - Real Estate Dispute',
  'Commercial real estate dispute involving breach of contract and property development agreement violation.',
  'open',
  (SELECT id FROM chambers WHERE name = 'Apex Law Partners' LIMIT 1),
  (SELECT id FROM users WHERE email = 'john.lawyer@apexlaw.com' LIMIT 1),
  (SELECT id FROM users WHERE email = 'client2@example.com' LIMIT 1),
  'Real Estate',
  'New York Supreme Court',
  '2024-02-01',
  '2024-07-15',
  '2024-06-30',
  'high'
WHERE NOT EXISTS (SELECT 1 FROM cases WHERE case_number = 'CASE-2024-002')
ON CONFLICT (case_number) DO NOTHING;

INSERT INTO cases (case_number, title, description, status, chamber_id, assigned_lawyer_id, client_id, case_type, court, filing_date, hearing_date, deadline, priority)
SELECT 
  'CASE-2024-003',
  'Anderson v. Former Partner - Business Dissolution',
  'Business partnership dissolution dispute with ongoing negotiations regarding asset distribution and liabilities.',
  'draft',
  (SELECT id FROM chambers WHERE name = 'Apex Law Partners' LIMIT 1),
  (SELECT id FROM users WHERE email = 'john.lawyer@apexlaw.com' LIMIT 1),
  (SELECT id FROM users WHERE email = 'client3@example.com' LIMIT 1),
  'Corporate',
  'New York Supreme Court',
  NULL,
  NULL,
  '2024-04-15',
  'medium'
WHERE NOT EXISTS (SELECT 1 FROM cases WHERE case_number = 'CASE-2024-003')
ON CONFLICT (case_number) DO NOTHING;

INSERT INTO cases (case_number, title, description, status, chamber_id, assigned_lawyer_id, client_id, case_type, court, filing_date, hearing_date, deadline, priority)
SELECT 
  'CASE-2024-004',
  'Williams Custody Modification - Family Court',
  'Modification of existing child custody and support arrangements due to changed circumstances.',
  'open',
  (SELECT id FROM chambers WHERE name = 'Justice Associates' LIMIT 1),
  (SELECT id FROM users WHERE email = 'david.partner@justice.com' LIMIT 1),
  (SELECT id FROM users WHERE email = 'client1@example.com' LIMIT 1),
  'Family Law',
  'San Francisco Superior Court',
  '2024-01-20',
  '2024-05-10',
  '2024-04-30',
  'urgent'
WHERE NOT EXISTS (SELECT 1 FROM cases WHERE case_number = 'CASE-2024-004')
ON CONFLICT (case_number) DO NOTHING;

-- 6. Insert sample messages
INSERT INTO messages (case_id, sender_id, content, message_type)
SELECT 
  (SELECT id FROM cases WHERE case_number = 'CASE-2024-001' LIMIT 1),
  (SELECT id FROM users WHERE email = 'emma.counsel@apexlaw.com' LIMIT 1),
  'Initial discovery phase complete. Documents have been filed with the court.',
  'text'
WHERE NOT EXISTS (SELECT 1 FROM messages WHERE content = 'Initial discovery phase complete. Documents have been filed with the court.')
ON CONFLICT DO NOTHING;

INSERT INTO messages (case_id, sender_id, content, message_type)
SELECT 
  (SELECT id FROM cases WHERE case_number = 'CASE-2024-001' LIMIT 1),
  (SELECT id FROM users WHERE email = 'client1@example.com' LIMIT 1),
  'Thank you for the update. Please keep me informed of any developments.',
  'text'
WHERE NOT EXISTS (SELECT 1 FROM messages WHERE content = 'Thank you for the update. Please keep me informed of any developments.')
ON CONFLICT DO NOTHING;

INSERT INTO messages (case_id, sender_id, content, message_type)
SELECT 
  (SELECT id FROM cases WHERE case_number = 'CASE-2024-002' LIMIT 1),
  (SELECT id FROM users WHERE email = 'john.lawyer@apexlaw.com' LIMIT 1),
  'Settlement negotiations scheduled for next week. I recommend accepting their latest offer.',
  'text'
WHERE NOT EXISTS (SELECT 1 FROM messages WHERE content = 'Settlement negotiations scheduled for next week. I recommend accepting their latest offer.')
ON CONFLICT DO NOTHING;

-- 7. Insert sample tasks
INSERT INTO tasks (case_id, assigned_to_id, title, description, due_date, status, priority)
SELECT 
  (SELECT id FROM cases WHERE case_number = 'CASE-2024-001' LIMIT 1),
  (SELECT id FROM users WHERE email = 'emma.counsel@apexlaw.com' LIMIT 1),
  'Prepare expert witness report',
  'Coordinate with expert witness and prepare detailed technical report on patent validity.',
  '2024-05-15',
  'pending',
  'high'
WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE title = 'Prepare expert witness report')
ON CONFLICT DO NOTHING;

INSERT INTO tasks (case_id, assigned_to_id, title, description, due_date, status, priority)
SELECT 
  (SELECT id FROM cases WHERE case_number = 'CASE-2024-002' LIMIT 1),
  (SELECT id FROM users WHERE email = 'john.lawyer@apexlaw.com' LIMIT 1),
  'Review property survey documents',
  'Review and analyze all submitted property survey documents and boundary reports.',
  '2024-04-20',
  'pending',
  'high'
WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE title = 'Review property survey documents')
ON CONFLICT DO NOTHING;

INSERT INTO tasks (case_id, assigned_to_id, title, description, due_date, status, priority)
SELECT 
  (SELECT id FROM cases WHERE case_number = 'CASE-2024-004' LIMIT 1),
  (SELECT id FROM users WHERE email = 'david.partner@justice.com' LIMIT 1),
  'Schedule mediation session',
  'Contact opposing counsel to schedule mediation session for custody arrangements.',
  '2024-03-31',
  'pending',
  'urgent'
WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE title = 'Schedule mediation session')
ON CONFLICT DO NOTHING;

-- 8. Insert sample notifications
INSERT INTO notifications (user_id, case_id, notification_type, title, message)
SELECT 
  (SELECT id FROM users WHERE email = 'client1@example.com' LIMIT 1),
  (SELECT id FROM cases WHERE case_number = 'CASE-2024-001' LIMIT 1),
  'case_update',
  'Case Update: CASE-2024-001',
  'Your patent infringement case has progressed to the discovery phase.'
WHERE NOT EXISTS (SELECT 1 FROM notifications WHERE title = 'Case Update: CASE-2024-001')
ON CONFLICT DO NOTHING;

INSERT INTO notifications (user_id, case_id, notification_type, title, message)
SELECT 
  (SELECT id FROM users WHERE email = 'client2@example.com' LIMIT 1),
  (SELECT id FROM cases WHERE case_number = 'CASE-2024-002' LIMIT 1),
  'deadline',
  'Upcoming Deadline: CASE-2024-002',
  'Settlement negotiations scheduled for next week. Please review the proposed terms.'
WHERE NOT EXISTS (SELECT 1 FROM notifications WHERE title = 'Upcoming Deadline: CASE-2024-002')
ON CONFLICT DO NOTHING;

INSERT INTO notifications (user_id, case_id, notification_type, title, message)
SELECT 
  (SELECT id FROM users WHERE email = 'john.lawyer@apexlaw.com' LIMIT 1),
  (SELECT id FROM cases WHERE case_number = 'CASE-2024-003' LIMIT 1),
  'message',
  'New Message: CASE-2024-003',
  'Client has provided additional documentation for the partnership dissolution case.'
WHERE NOT EXISTS (SELECT 1 FROM notifications WHERE title = 'New Message: CASE-2024-003')
ON CONFLICT DO NOTHING;

-- Re-enable foreign key checks
SET session_replication_role = default;
