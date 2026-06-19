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
