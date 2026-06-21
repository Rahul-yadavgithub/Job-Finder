-- Step 1: Add new fields to company_status
ALTER TABLE company_status 
ADD COLUMN IF NOT EXISTS interested_by_user_id UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS interested_by_name TEXT,
ADD COLUMN IF NOT EXISTS interested_at TIMESTAMPTZ;

-- Step 2: Add new fields to company_timeline
ALTER TABLE company_timeline
ADD COLUMN IF NOT EXISTS conversation_notes TEXT,
ADD COLUMN IF NOT EXISTS visibility_scope TEXT DEFAULT 'all_roles' 
  CHECK (visibility_scope IN (
    'admin_only', 
    'base_tpr_and_above', 
    'communication_tpr_and_above', 
    'head_tpr_and_above', 
    'all_roles'
  ));

-- Step 3: Update check constraint on event_type in company_timeline
-- First, we need to drop the old constraint. It is typically named <tablename>_<columnname>_check
DO $$ 
DECLARE
  constraint_name text;
BEGIN
  SELECT conname INTO constraint_name
  FROM pg_constraint
  WHERE conrelid = 'company_timeline'::regclass
  AND contype = 'c'
  AND pg_get_constraintdef(oid) ILIKE '%event_type%';

  IF constraint_name IS NOT NULL THEN
    EXECUTE 'ALTER TABLE company_timeline DROP CONSTRAINT ' || constraint_name;
  END IF;
END $$;

-- Add the new comprehensive event_type check constraint
ALTER TABLE company_timeline
ADD CONSTRAINT company_timeline_event_type_check CHECK (event_type IN (
  'company_created',
  'initial_call',
  'interested',
  'call_not_picked',
  'callback_requested',
  'note_added',
  'brochure_requested',
  'brochure_sent',
  'followup_created',
  'followup_completed',
  'communication_request_created',
  'ready_for_head_review',
  'transferred_to_head',
  'head_review_started',
  'head_review_completed',
  'company_assigned_to_tpo',
  'company_assigned_to_coworker',
  'company_assigned_to_head',
  'status_changed',
  'communication_completed',
  -- keeping the old ones for safety just in case
  'marked_interested',
  'brochure_request_raised',
  'jnf_request_raised',
  'jnf_sent',
  'database_request_raised',
  'database_sent',
  'custom_document_sent',
  'followup_sent',
  'company_replied',
  'response_logged',
  'status_updated',
  'reverted_to_branch',
  'accepted_by_comm_tpr',
  'drive_confirmed',
  'drive_scheduled',
  'registrations_opened'
));

-- Step 4: Map existing company_activities to company_timeline
-- We need to assign an assignment_id to these events. We can fetch the active assignment_id from company_status.
INSERT INTO company_timeline (
  company_id,
  assignment_id,
  event_type,
  performed_by,
  performed_by_layer,
  title,
  description,
  metadata,
  conversation_notes,
  visibility_scope,
  created_at
)
SELECT 
  ca.company_id,
  cs.id AS assignment_id,
  CASE 
    WHEN ca.activity_type = 'call' THEN 'initial_call'
    WHEN ca.activity_type = 'note' THEN 'note_added'
    WHEN ca.activity_type = 'status_change' THEN 'status_changed'
    WHEN ca.activity_type = 'follow_up' THEN 'followup_created'
    WHEN ca.activity_type = 'brochure' THEN 'brochure_sent'
    WHEN ca.activity_type = 'transfer' THEN 'transferred_to_head'
    ELSE 'note_added'
  END AS event_type,
  ca.user_id,
  'base' AS performed_by_layer,
  CASE 
    WHEN ca.activity_type = 'call' THEN 'Initial Call'
    WHEN ca.activity_type = 'note' THEN 'Note Added'
    WHEN ca.activity_type = 'status_change' THEN 'Status Changed'
    WHEN ca.activity_type = 'follow_up' THEN 'Follow-up Created'
    WHEN ca.activity_type = 'brochure' THEN 'Brochure Activity'
    WHEN ca.activity_type = 'transfer' THEN 'Transferred to Head'
    ELSE 'Activity Logged'
  END AS title,
  ca.notes AS description,
  ca.metadata,
  ca.notes AS conversation_notes,
  'base_tpr_and_above' AS visibility_scope,
  ca.created_at
FROM company_activities ca
JOIN company_status cs ON cs.company_id = ca.company_id
-- avoid duplicates if script runs multiple times
WHERE NOT EXISTS (
  SELECT 1 FROM company_timeline ct WHERE ct.company_id = ca.company_id AND ct.created_at = ca.created_at
);

-- Note: We do not DROP company_activities table yet to ensure zero data loss during transition, 
-- but we should update the application to stop writing to it.
