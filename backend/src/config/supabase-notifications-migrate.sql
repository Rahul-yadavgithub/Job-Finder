-- STEP 1 — Extend admin_notifications table (already exists):
-- Add missing fields:

ALTER TABLE admin_notifications
ADD COLUMN IF NOT EXISTS notification_category TEXT 
  CHECK (notification_category IN (
    'company',
    'worker', 
    'request',
    'system'
  )),
ADD COLUMN IF NOT EXISTS action_url TEXT,
ADD COLUMN IF NOT EXISTS triggered_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- STEP 2 — Create notification triggers:

CREATE OR REPLACE FUNCTION notify_admin_on_company_confirmed()
RETURNS TRIGGER AS $$
DECLARE
  admin_id UUID;
  company_name TEXT;
BEGIN
  IF NEW.mid_status = 'accepted' AND 
     (OLD.mid_status IS NULL OR OLD.mid_status != 'accepted') THEN
    
    SELECT c.company_name INTO company_name 
    FROM companies c WHERE c.id = NEW.company_id;
    
    SELECT id INTO admin_id 
    FROM users WHERE is_super_admin = true LIMIT 1;
    
    IF admin_id IS NOT NULL THEN
      INSERT INTO admin_notifications (
        recipient_id, type, title, message,
        notification_category, related_user_id,
        action_url, metadata
      ) VALUES (
        admin_id,
        'company_confirmed',
        'Company Confirmed',
        company_name || ' has been confirmed by mid-level TPR',
        'company',
        NEW.locked_by,
        '/admin/companies?filter=confirmed',
        jsonb_build_object('company_id', NEW.company_id)
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_company_confirmed ON company_status;
CREATE TRIGGER trigger_company_confirmed
AFTER UPDATE ON company_status
FOR EACH ROW
EXECUTE FUNCTION notify_admin_on_company_confirmed();

CREATE OR REPLACE FUNCTION notify_admin_on_status_update()
RETURNS TRIGGER AS $$
DECLARE
  admin_id UUID;
  company_name TEXT;
  worker_name TEXT;
BEGIN
  SELECT c.company_name INTO company_name 
  FROM companies c WHERE c.id = NEW.company_id;
  
  SELECT u.name INTO worker_name
  FROM users u WHERE u.id = NEW.changed_by;
  
  SELECT id INTO admin_id 
  FROM users WHERE is_super_admin = true LIMIT 1;
  
  IF admin_id IS NOT NULL AND NEW.layer = 'mid' THEN
    INSERT INTO admin_notifications (
      recipient_id, type, title, message,
      notification_category, triggered_by,
      action_url, metadata
    ) VALUES (
      admin_id,
      'status_updated',
      'Status Updated by Co-worker',
      worker_name || ' updated ' || company_name || 
        ' to ' || NEW.new_status,
      'company',
      NEW.changed_by,
      '/admin/companies',
      jsonb_build_object(
        'company_id', NEW.company_id,
        'new_status', NEW.new_status,
        'old_status', NEW.old_status
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_status_update_notify ON status_history;
CREATE TRIGGER trigger_status_update_notify
AFTER INSERT ON status_history
FOR EACH ROW
EXECUTE FUNCTION notify_admin_on_status_update();
