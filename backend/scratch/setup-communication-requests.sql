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
