-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- User Roles Enum
CREATE TYPE user_role AS ENUM ('chamber_admin', 'lawyer', 'client');
CREATE TYPE case_status AS ENUM ('draft', 'open', 'closed', 'archived');
CREATE TYPE message_type AS ENUM ('text', 'document', 'system');
CREATE TYPE notification_type AS ENUM ('case_update', 'message', 'deadline', 'system');

-- Chambers table
CREATE TABLE IF NOT EXISTS chambers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(20),
  address TEXT,
  city VARCHAR(100),
  country VARCHAR(100),
  logo_url TEXT,
  website TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  full_name VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  role user_role NOT NULL DEFAULT 'client',
  chamber_id UUID REFERENCES chambers(id) ON DELETE SET NULL,
  phone VARCHAR(20),
  bio TEXT,
  specialization VARCHAR(255),
  bar_registration_number VARCHAR(100),
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cases table
CREATE TABLE IF NOT EXISTS cases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_number VARCHAR(100) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status case_status NOT NULL DEFAULT 'draft',
  chamber_id UUID NOT NULL REFERENCES chambers(id) ON DELETE CASCADE,
  assigned_lawyer_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  client_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  case_type VARCHAR(100),
  court VARCHAR(255),
  filing_date DATE,
  hearing_date DATE,
  deadline DATE,
  priority VARCHAR(50) DEFAULT 'normal',
  documents_count INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Case Documents table
CREATE TABLE IF NOT EXISTS case_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  uploaded_by_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_type VARCHAR(50),
  file_size INT,
  document_type VARCHAR(100),
  description TEXT,
  is_confidential BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Case Activity/Timeline table
CREATE TABLE IF NOT EXISTS case_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  activity_type VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages table (for chat functionality)
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  content TEXT NOT NULL,
  message_type message_type NOT NULL DEFAULT 'text',
  file_url TEXT,
  edited_at TIMESTAMP WITH TIME ZONE,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
  notification_type notification_type NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  related_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tasks/Deadlines table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  assigned_to_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  due_date DATE NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  priority VARCHAR(50) DEFAULT 'normal',
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_users_chamber_id ON users(chamber_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_cases_chamber_id ON cases(chamber_id);
CREATE INDEX idx_cases_assigned_lawyer_id ON cases(assigned_lawyer_id);
CREATE INDEX idx_cases_client_id ON cases(client_id);
CREATE INDEX idx_cases_status ON cases(status);
CREATE INDEX idx_case_documents_case_id ON case_documents(case_id);
CREATE INDEX idx_case_documents_uploaded_by_id ON case_documents(uploaded_by_id);
CREATE INDEX idx_case_activities_case_id ON case_activities(case_id);
CREATE INDEX idx_messages_case_id ON messages(case_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_tasks_case_id ON tasks(case_id);
CREATE INDEX idx_tasks_assigned_to_id ON tasks(assigned_to_id);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE chambers ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Chambers policies
CREATE POLICY "Chambers viewable by chamber users" ON chambers
  FOR SELECT USING (
    id IN (SELECT chamber_id FROM users WHERE id = auth.uid())
  );

-- Users policies
CREATE POLICY "Users can read their own profile" ON users
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users in same chamber can view each other (limited)" ON users
  FOR SELECT USING (
    chamber_id IN (SELECT chamber_id FROM users WHERE id = auth.uid())
  );

-- Cases policies
CREATE POLICY "Cases viewable by involved parties and chamber" ON cases
  FOR SELECT USING (
    client_id = auth.uid() OR 
    assigned_lawyer_id = auth.uid() OR
    chamber_id IN (SELECT chamber_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Lawyers and clients can update cases they're involved in" ON cases
  FOR UPDATE USING (
    assigned_lawyer_id = auth.uid() OR
    client_id = auth.uid()
  )
  WITH CHECK (
    assigned_lawyer_id = auth.uid() OR
    client_id = auth.uid()
  );

-- Case documents policies
CREATE POLICY "Case documents viewable by involved parties" ON case_documents
  FOR SELECT USING (
    case_id IN (
      SELECT id FROM cases WHERE
        client_id = auth.uid() OR
        assigned_lawyer_id = auth.uid() OR
        chamber_id IN (SELECT chamber_id FROM users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Users can upload documents to their cases" ON case_documents
  FOR INSERT WITH CHECK (
    uploaded_by_id = auth.uid() AND
    case_id IN (
      SELECT id FROM cases WHERE
        client_id = auth.uid() OR
        assigned_lawyer_id = auth.uid()
    )
  );

-- Messages policies
CREATE POLICY "Messages viewable by case participants" ON messages
  FOR SELECT USING (
    case_id IN (
      SELECT id FROM cases WHERE
        client_id = auth.uid() OR
        assigned_lawyer_id = auth.uid() OR
        chamber_id IN (SELECT chamber_id FROM users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Users can send messages to their cases" ON messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    case_id IN (
      SELECT id FROM cases WHERE
        client_id = auth.uid() OR
        assigned_lawyer_id = auth.uid()
    )
  );

-- Notifications policies
CREATE POLICY "Users can only see their own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());

-- Tasks policies
CREATE POLICY "Tasks viewable by case participants" ON tasks
  FOR SELECT USING (
    case_id IN (
      SELECT id FROM cases WHERE
        client_id = auth.uid() OR
        assigned_lawyer_id = auth.uid() OR
        chamber_id IN (SELECT chamber_id FROM users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Users can update tasks assigned to them" ON tasks
  FOR UPDATE USING (assigned_to_id = auth.uid())
  WITH CHECK (assigned_to_id = auth.uid());
