-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- BRANCHES
CREATE TABLE IF NOT EXISTS branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  sheet_tab_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- USERS
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  roll_number TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('branch_tpr','caller','head')),
  branch_id UUID REFERENCES branches(id),
  status TEXT NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending','approved','suspended')),
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- COMPANIES (lean portal copy — not the MongoDB discovery copy)
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES branches(id),
  company_name TEXT NOT NULL,
  hr_name TEXT,
  email TEXT,
  phone_number TEXT,
  description TEXT,
  data_source TEXT DEFAULT 'manual' 
    CHECK (data_source IN ('manual','csv_import','sheet_sync','scan')),
  mongo_discovery_id TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_name, branch_id)
);

-- COMPANY STATUS
CREATE TABLE IF NOT EXISTS company_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES branches(id),
  base_status TEXT NOT NULL DEFAULT 'not_contacted'
    CHECK (base_status IN (
      'not_contacted','interested','rejected',
      'call_again','not_available'
    )),
  mid_status TEXT CHECK (mid_status IN (
    'pending_review','in_process','accepted','rejected','revoked'
  )),
  top_status TEXT CHECK (top_status IN (
    'confirmed','jnf_sent','visit_scheduled','completed','dropped'
  )),
  locked BOOLEAN DEFAULT false,
  locked_by UUID REFERENCES users(id),
  locked_at TIMESTAMPTZ,
  next_followup_date DATE,
  notes TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- STATUS HISTORY (full audit trail across all tiers)
CREATE TABLE IF NOT EXISTS status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  changed_by UUID NOT NULL REFERENCES users(id),
  layer TEXT NOT NULL CHECK (layer IN ('base','mid','top')),
  old_status TEXT,
  new_status TEXT NOT NULL,
  reason TEXT,
  changed_at TIMESTAMPTZ DEFAULT now()
);

-- CONTACT LOG
CREATE TABLE IF NOT EXISTS contact_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  logged_by UUID NOT NULL REFERENCES users(id),
  method TEXT CHECK (method IN ('phone','email','linkedin')),
  outcome TEXT,
  notes TEXT,
  logged_at TIMESTAMPTZ DEFAULT now()
);

-- HR CONTACTS (verified contacts — raw scraped contacts stay in MongoDB)
CREATE TABLE IF NOT EXISTS hr_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  phone TEXT,
  title TEXT,
  verified_by UUID REFERENCES users(id),
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- VISIT SCHEDULE (top level only)
CREATE TABLE IF NOT EXISTS visit_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  scheduled_date DATE,
  drive_type TEXT CHECK (drive_type IN ('In-Campus','Pool')),
  confirmed BOOLEAN DEFAULT false,
  confirmed_by UUID REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- DOCUMENTS SENT (top level only)
CREATE TABLE IF NOT EXISTS documents_sent (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  doc_type TEXT CHECK (doc_type IN ('JNF','resume_db','offer_letter','email')),
  sent_by UUID REFERENCES users(id),
  sent_at TIMESTAMPTZ DEFAULT now(),
  response_status TEXT DEFAULT 'pending'
    CHECK (response_status IN ('pending','received','no_response'))
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_companies_branch 
  ON companies(branch_id);
CREATE INDEX IF NOT EXISTS idx_company_status_company 
  ON company_status(company_id);
CREATE INDEX IF NOT EXISTS idx_company_status_branch_base 
  ON company_status(branch_id, base_status);
CREATE INDEX IF NOT EXISTS idx_company_status_locked 
  ON company_status(locked, mid_status);
CREATE INDEX IF NOT EXISTS idx_status_history_company 
  ON status_history(company_id, changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_branch_status 
  ON users(branch_id, status);

-- SEED BRANCHES
INSERT INTO branches (name, code, sheet_tab_name) VALUES
  ('MNC', 'mnc', 'MNC'),
  ('CSE', 'cse', 'CSE'),
  ('IT', 'it', 'IT'),
  ('Mechanical', 'mech', 'MECH'),
  ('Civil', 'civil', 'CIVIL'),
  ('Electronics', 'ece', 'ECE'),
  ('MBA', 'mba', 'MBA'),
  ('MCA', 'mca', 'MCA')
ON CONFLICT (code) DO NOTHING;
-- 1. Create the unified company_activities table
CREATE TABLE IF NOT EXISTS company_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id), -- Can be null for system actions
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'call', 'email', 'linkedin', 'note', 'status_change', 'follow_up', 'brochure', 'transfer'
  )),
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast timeline queries
CREATE INDEX IF NOT EXISTS idx_company_activities_company ON company_activities(company_id, created_at DESC);

-- 2. Create Trigger Function to automatically log status changes from status_history
CREATE OR REPLACE FUNCTION log_status_change_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO company_activities (company_id, user_id, activity_type, notes, metadata)
  VALUES (
    NEW.company_id,
    NEW.changed_by,
    'status_change',
    'Status changed to ' || REPLACE(NEW.new_status, '_', ' '),
    jsonb_build_object(
      'old_status', NEW.old_status,
      'new_status', NEW.new_status,
      'layer', NEW.layer,
      'reason', NEW.reason
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to status_history
DROP TRIGGER IF EXISTS trigger_log_status_change ON status_history;
CREATE TRIGGER trigger_log_status_change
AFTER INSERT ON status_history
FOR EACH ROW
EXECUTE FUNCTION log_status_change_activity();

-- 3. Create Trigger Function to automatically log contact_log events
CREATE OR REPLACE FUNCTION log_contact_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO company_activities (company_id, user_id, activity_type, notes, metadata)
  VALUES (
    NEW.company_id,
    NEW.logged_by,
    NEW.method, -- 'phone', 'email', 'linkedin'
    NEW.notes,
    jsonb_build_object('outcome', NEW.outcome)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to contact_log
DROP TRIGGER IF EXISTS trigger_log_contact ON contact_log;
CREATE TRIGGER trigger_log_contact
AFTER INSERT ON contact_log
FOR EACH ROW
EXECUTE FUNCTION log_contact_activity();

-- 4. Backfill existing data into company_activities (optional but recommended)
-- Backfill status_history
INSERT INTO company_activities (company_id, user_id, activity_type, notes, metadata, created_at)
SELECT 
  company_id, changed_by, 'status_change', 
  'Status changed to ' || REPLACE(new_status, '_', ' '),
  jsonb_build_object('old_status', old_status, 'new_status', new_status, 'layer', layer, 'reason', reason),
  changed_at
FROM status_history
ON CONFLICT DO NOTHING;

-- Backfill contact_log
INSERT INTO company_activities (company_id, user_id, activity_type, notes, metadata, created_at)
SELECT 
  company_id, logged_by, method, notes,
  jsonb_build_object('outcome', outcome),
  logged_at
FROM contact_log
ON CONFLICT DO NOTHING;

-- 1. Create the communication_requests table
CREATE TABLE IF NOT EXISTS communication_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES users(id),
  request_type TEXT NOT NULL CHECK (request_type IN ('brochure', 'officialCommunication')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'completed', 'rejected')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast queue queries
CREATE INDEX IF NOT EXISTS idx_communication_requests_company ON communication_requests(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_communication_requests_status ON communication_requests(status);

-- 2. Alter company_activities constraint to allow 'communication_request'
ALTER TABLE company_activities DROP CONSTRAINT IF EXISTS company_activities_activity_type_check;
ALTER TABLE company_activities ADD CONSTRAINT company_activities_activity_type_check CHECK (
  activity_type IN ('call', 'email', 'linkedin', 'note', 'status_change', 'follow_up', 'brochure', 'transfer', 'communication_request')
);

-- 3. Create Trigger Function to log communication request activity
CREATE OR REPLACE FUNCTION log_communication_request_activity()
RETURNS TRIGGER AS $$
BEGIN
  -- Log when created
  IF TG_OP = 'INSERT' THEN
    INSERT INTO company_activities (company_id, user_id, activity_type, notes, metadata)
    VALUES (
      NEW.company_id,
      NEW.requested_by,
      'communication_request',
      'Requested ' || NEW.request_type || ' (' || NEW.status || ')',
      jsonb_build_object('request_id', NEW.id, 'request_type', NEW.request_type, 'status', NEW.status, 'notes', NEW.notes)
    );
  -- Log when status changes
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO company_activities (company_id, user_id, activity_type, notes, metadata)
    VALUES (
      NEW.company_id,
      -- We assume the user who updated it is modifying the record, but since we don't track 'updated_by', we log requested_by or NULL.
      -- Alternatively, we can pass user_id via application logic to activities directly, but trigger is cleaner.
      NEW.requested_by, 
      'communication_request',
      'Communication request (' || NEW.request_type || ') status changed to ' || NEW.status,
      jsonb_build_object('request_id', NEW.id, 'old_status', OLD.status, 'new_status', NEW.status)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger
DROP TRIGGER IF EXISTS trigger_log_comm_request ON communication_requests;
CREATE TRIGGER trigger_log_comm_request
AFTER INSERT OR UPDATE ON communication_requests
FOR EACH ROW
EXECUTE FUNCTION log_communication_request_activity();

-- 4. Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_communication_requests_modtime ON communication_requests;
CREATE TRIGGER update_communication_requests_modtime
BEFORE UPDATE ON communication_requests
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- 1. Create the follow_ups table
CREATE TABLE IF NOT EXISTS follow_ups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  assigned_to UUID NOT NULL REFERENCES users(id),
  follow_up_date DATE NOT NULL,
  follow_up_time TIME,
  reason TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for fast dashboard and calendar queries
CREATE INDEX IF NOT EXISTS idx_follow_ups_company ON follow_ups(company_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_assigned_to ON follow_ups(assigned_to, follow_up_date);
CREATE INDEX IF NOT EXISTS idx_follow_ups_status ON follow_ups(status);

-- 2. Alter company_activities constraint to allow 'follow_up' (it was actually already added in Phase 3/4 but ensuring it here)
-- No action strictly needed if it's already 'follow_up' in the constraint, but we can safely ignore it.

-- 3. Create Trigger Function to log follow-up activity
CREATE OR REPLACE FUNCTION log_follow_up_activity()
RETURNS TRIGGER AS $$
BEGIN
  -- Log when created
  IF TG_OP = 'INSERT' THEN
    INSERT INTO company_activities (company_id, user_id, activity_type, notes, metadata)
    VALUES (
      NEW.company_id,
      NEW.assigned_to,
      'follow_up',
      'Scheduled a ' || NEW.priority || ' priority follow-up for ' || NEW.follow_up_date::TEXT,
      jsonb_build_object('follow_up_id', NEW.id, 'reason', NEW.reason, 'priority', NEW.priority, 'date', NEW.follow_up_date, 'time', NEW.follow_up_time)
    );
  -- Log when status changes (like completed)
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO company_activities (company_id, user_id, activity_type, notes, metadata)
    VALUES (
      NEW.company_id,
      NEW.assigned_to, 
      'follow_up',
      'Follow-up marked as ' || NEW.status,
      jsonb_build_object('follow_up_id', NEW.id, 'old_status', OLD.status, 'new_status', NEW.status)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger
DROP TRIGGER IF EXISTS trigger_log_follow_up ON follow_ups;
CREATE TRIGGER trigger_log_follow_up
AFTER INSERT OR UPDATE ON follow_ups
FOR EACH ROW
EXECUTE FUNCTION log_follow_up_activity();

-- 4. Auto-update updated_at timestamp
DROP TRIGGER IF EXISTS update_follow_ups_modtime ON follow_ups;
CREATE TRIGGER update_follow_ups_modtime
BEFORE UPDATE ON follow_ups
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- 1. Update mid_status constraint
ALTER TABLE company_status DROP CONSTRAINT IF EXISTS company_status_mid_status_check;

-- Ensure default is 'interested' instead of letting it be null when starting the mid-layer
ALTER TABLE company_status ALTER COLUMN mid_status SET DEFAULT 'interested';

-- We only apply the check constraint for the allowed mid statuses
ALTER TABLE company_status ADD CONSTRAINT company_status_mid_status_check CHECK (mid_status IN (
  'interested', 'under_communication', 'ready_for_head_review', 'transferred_to_head'
));

-- Update any existing companies that had pending_review or were null, to ensure they don't violate constraint
UPDATE company_status SET mid_status = 'interested' WHERE mid_status IS NULL OR mid_status NOT IN ('interested', 'under_communication', 'ready_for_head_review', 'transferred_to_head');

-- 2. Add transfer fields
ALTER TABLE company_status ADD COLUMN IF NOT EXISTS editing_locked BOOLEAN DEFAULT false;
ALTER TABLE company_status ADD COLUMN IF NOT EXISTS transferred_by UUID REFERENCES users(id);
ALTER TABLE company_status ADD COLUMN IF NOT EXISTS transferred_at TIMESTAMPTZ;

-- 3. Update company_activities constraint to allow 'transferred_to_head'
ALTER TABLE company_activities DROP CONSTRAINT IF EXISTS company_activities_activity_type_check;
ALTER TABLE company_activities ADD CONSTRAINT company_activities_activity_type_check CHECK (
  activity_type IN ('call', 'email', 'linkedin', 'note', 'status_change', 'follow_up', 'brochure', 'transfer', 'communication_request', 'transferred_to_head')
);
