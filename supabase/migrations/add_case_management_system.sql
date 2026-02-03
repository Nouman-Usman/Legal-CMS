-- Create cases table for chambers management
CREATE TABLE IF NOT EXISTS cases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chamber_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  case_number VARCHAR(50) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'pending', 'closed', 'archived')),
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  case_type VARCHAR(100),
  filing_date DATE,
  next_hearing_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for performance
CREATE INDEX idx_cases_chamber_id ON cases(chamber_id);
CREATE INDEX idx_cases_client_id ON cases(client_id);
CREATE INDEX idx_cases_assigned_to ON cases(assigned_to);
CREATE INDEX idx_cases_status ON cases(status);
CREATE INDEX idx_cases_priority ON cases(priority);
CREATE INDEX idx_cases_case_number ON cases(case_number);
CREATE INDEX idx_cases_deleted_at ON cases(deleted_at);

-- Enable RLS
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Chamber admins can manage their own cases
CREATE POLICY "chamber_admin_manage_own_cases" ON cases
  USING (
    chamber_id = auth.uid() AND auth.role() = 'authenticated'
  );

CREATE POLICY "chamber_admin_insert_cases" ON cases
  FOR INSERT
  WITH CHECK (
    chamber_id = auth.uid() AND auth.role() = 'authenticated'
  );

CREATE POLICY "chamber_admin_update_cases" ON cases
  FOR UPDATE
  USING (
    chamber_id = auth.uid() AND auth.role() = 'authenticated'
  );

CREATE POLICY "chamber_admin_delete_cases" ON cases
  FOR DELETE
  USING (
    chamber_id = auth.uid() AND auth.role() = 'authenticated'
  );

-- RLS Policy: Lawyers can view their assigned cases
CREATE POLICY "lawyers_view_assigned_cases" ON cases
  FOR SELECT
  USING (
    assigned_to = auth.uid() OR 
    (client_id = auth.uid() AND auth.role() = 'authenticated')
  );

-- RLS Policy: Clients can view their own cases
CREATE POLICY "clients_view_own_cases" ON cases
  FOR SELECT
  USING (
    client_id = auth.uid() AND auth.role() = 'authenticated'
  );

-- Create case_documents table
CREATE TABLE IF NOT EXISTS case_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  document_name VARCHAR(255) NOT NULL,
  document_url TEXT NOT NULL,
  document_type VARCHAR(50),
  file_size INTEGER,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_case_documents_case_id ON case_documents(case_id);
CREATE INDEX idx_case_documents_uploaded_by ON case_documents(uploaded_by);
ALTER TABLE case_documents ENABLE ROW LEVEL SECURITY;

-- RLS for case_documents
CREATE POLICY "case_document_access" ON case_documents
  USING (
    EXISTS (
      SELECT 1 FROM cases
      WHERE cases.id = case_documents.case_id
      AND (cases.chamber_id = auth.uid() OR cases.assigned_to = auth.uid() OR cases.client_id = auth.uid())
    )
  );

-- Create case_tasks table
CREATE TABLE IF NOT EXISTS case_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  due_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_case_tasks_case_id ON case_tasks(case_id);
CREATE INDEX idx_case_tasks_assigned_to ON case_tasks(assigned_to);
CREATE INDEX idx_case_tasks_status ON case_tasks(status);
ALTER TABLE case_tasks ENABLE ROW LEVEL SECURITY;

-- RLS for case_tasks
CREATE POLICY "case_task_access" ON case_tasks
  USING (
    EXISTS (
      SELECT 1 FROM cases
      WHERE cases.id = case_tasks.case_id
      AND (cases.chamber_id = auth.uid() OR cases.assigned_to = auth.uid() OR cases.client_id = auth.uid())
    )
  );

-- Create case_messages table
CREATE TABLE IF NOT EXISTS case_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_case_messages_case_id ON case_messages(case_id);
CREATE INDEX idx_case_messages_user_id ON case_messages(user_id);
ALTER TABLE case_messages ENABLE ROW LEVEL SECURITY;

-- RLS for case_messages
CREATE POLICY "case_message_access" ON case_messages
  USING (
    EXISTS (
      SELECT 1 FROM cases
      WHERE cases.id = case_messages.case_id
      AND (cases.chamber_id = auth.uid() OR cases.assigned_to = auth.uid() OR cases.client_id = auth.uid())
    )
  );

-- Create case_activity_log table for timeline/audit trail
CREATE TABLE IF NOT EXISTS case_activity_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  changes JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_case_activity_log_case_id ON case_activity_log(case_id);
CREATE INDEX idx_case_activity_log_user_id ON case_activity_log(user_id);
ALTER TABLE case_activity_log ENABLE ROW LEVEL SECURITY;

-- RLS for case_activity_log
CREATE POLICY "case_activity_log_access" ON case_activity_log
  USING (
    EXISTS (
      SELECT 1 FROM cases
      WHERE cases.id = case_activity_log.case_id
      AND (cases.chamber_id = auth.uid() OR cases.assigned_to = auth.uid() OR cases.client_id = auth.uid())
    )
  );

-- Create case_time_entries table for billing
CREATE TABLE IF NOT EXISTS case_time_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  lawyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  hours DECIMAL(5, 2) NOT NULL,
  rate DECIMAL(10, 2),
  entry_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_case_time_entries_case_id ON case_time_entries(case_id);
CREATE INDEX idx_case_time_entries_lawyer_id ON case_time_entries(lawyer_id);
CREATE INDEX idx_case_time_entries_entry_date ON case_time_entries(entry_date);
ALTER TABLE case_time_entries ENABLE ROW LEVEL SECURITY;

-- RLS for case_time_entries
CREATE POLICY "case_time_entries_access" ON case_time_entries
  USING (
    EXISTS (
      SELECT 1 FROM cases
      WHERE cases.id = case_time_entries.case_id
      AND (cases.chamber_id = auth.uid() OR cases.assigned_to = auth.uid())
    )
  );

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
CREATE TRIGGER update_cases_timestamp BEFORE UPDATE ON cases
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_case_tasks_timestamp BEFORE UPDATE ON case_tasks
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_case_messages_timestamp BEFORE UPDATE ON case_messages
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_case_time_entries_timestamp BEFORE UPDATE ON case_time_entries
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Add helpful comments
COMMENT ON TABLE cases IS 'Core cases table for law chamber case management';
COMMENT ON TABLE case_documents IS 'Documents associated with cases';
COMMENT ON TABLE case_tasks IS 'Tasks for case management and tracking';
COMMENT ON TABLE case_messages IS 'Internal communication about cases';
COMMENT ON TABLE case_activity_log IS 'Audit trail of all case changes';
COMMENT ON TABLE case_time_entries IS 'Time tracking for billing purposes';
