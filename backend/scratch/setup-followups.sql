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
