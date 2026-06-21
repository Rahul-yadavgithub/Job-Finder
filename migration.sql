-- 1. Add original_marked_by to company_status
ALTER TABLE company_status
ADD COLUMN IF NOT EXISTS original_marked_by UUID REFERENCES users(id);

-- 2. Create staff_requests table for TPO Staff
CREATE TABLE IF NOT EXISTS staff_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  company_id UUID NOT NULL REFERENCES companies(id),
  assignment_id UUID NOT NULL REFERENCES company_status(id),
  
  raised_by UUID REFERENCES users(id),
  raised_by_name TEXT,
  
  email_to TEXT,
  email_subject TEXT,
  email_body TEXT,
  attachment_template_id UUID REFERENCES email_templates(id),
  attachment_url TEXT,
  attachment_filename TEXT,
  
  status TEXT DEFAULT 'pending_send' CHECK (status IN (
    'pending_send',
    'waiting_response',
    'accepted',
    'rejected'
  )),
  
  sent_at TIMESTAMPTZ,
  actioned_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Note: We also add pending_staff_review to top_stage check constraint
ALTER TABLE company_status DROP CONSTRAINT IF EXISTS company_status_top_stage_check;
ALTER TABLE company_status ADD CONSTRAINT company_status_top_stage_check CHECK (top_stage IN (
  'pending_staff_review',
  'under_admin_review',
  'brochure_sent',
  'jnf_requested',
  'jnf_sent',
  'database_sent',
  'drive_confirmed',
  'drive_scheduled',
  'drive_completed',
  'dropped',
  'called',
  'not_contacted'
));

-- First drop the old constraint
ALTER TABLE communication_requests DROP CONSTRAINT IF EXISTS communication_requests_status_check;

-- Update legacy statuses
UPDATE communication_requests SET status = 'pending_staff_review' WHERE status = 'pending_approval';
UPDATE communication_requests SET status = 'sent' WHERE status = 'approved';

-- Then apply the new constraint
ALTER TABLE communication_requests ADD CONSTRAINT communication_requests_status_check CHECK (status IN ('draft', 'pending_staff_review', 'waiting_response', 'sent', 'rejected', 'accepted', 'pending_approval', 'approved'));
