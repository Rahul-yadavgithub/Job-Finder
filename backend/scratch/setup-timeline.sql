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
