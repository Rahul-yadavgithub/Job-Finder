-- Mid-Layer Communication TPR Portal Database Migration

-- 1. Extend communication_requests table for Email composition
ALTER TABLE communication_requests 
ADD COLUMN IF NOT EXISTS email_to TEXT,
ADD COLUMN IF NOT EXISTS email_subject TEXT,
ADD COLUMN IF NOT EXISTS email_body TEXT,
ADD COLUMN IF NOT EXISTS template_id UUID,
ADD COLUMN IF NOT EXISTS target_branch_id UUID,
ADD COLUMN IF NOT EXISTS urgency TEXT DEFAULT 'normal' CHECK (urgency IN ('normal','urgent')),
ADD COLUMN IF NOT EXISTS follow_up_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_follow_ups INTEGER DEFAULT 2,
ADD COLUMN IF NOT EXISTS next_followup_date DATE,
ADD COLUMN IF NOT EXISTS last_followup_at TIMESTAMPTZ;

-- Drop strict constraint on status and recreate with new states
ALTER TABLE communication_requests DROP CONSTRAINT IF EXISTS communication_requests_status_check;
ALTER TABLE communication_requests ADD CONSTRAINT communication_requests_status_check 
  CHECK (status IN ('draft', 'pending_approval', 'approved', 'sent', 'rejected', 'cancelled', 'completed', 'submitted', 'pending'));

-- Drop strict constraint on request_type and recreate with new states
ALTER TABLE communication_requests DROP CONSTRAINT IF EXISTS communication_requests_request_type_check;
ALTER TABLE communication_requests ADD CONSTRAINT communication_requests_request_type_check 
  CHECK (request_type IN ('institute_brochure', 'branch_brochure', 'jnf_form', 'custom', 'brochure', 'officialCommunication'));

-- 2. Create email_templates table
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_type TEXT NOT NULL CHECK (template_type IN (
    'institute_brochure', 'branch_brochure', 'jnf_form', 'followup_1', 'followup_2', 'custom'
  )),
  branch_id UUID REFERENCES branches(id),
  subject TEXT NOT NULL,
  body_draft TEXT NOT NULL,
  attachment_filename TEXT,
  attachment_url TEXT,
  attachment_size_kb INTEGER,
  is_active BOOLEAN DEFAULT true,
  uploaded_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(template_type, branch_id)
);

-- 3. Create comm_followup_rules table
CREATE TABLE IF NOT EXISTS comm_followup_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  followup_number INTEGER NOT NULL CHECK (followup_number IN (1, 2)),
  wait_days INTEGER NOT NULL DEFAULT 3,
  subject_template TEXT NOT NULL,
  body_template TEXT NOT NULL,
  updated_by UUID REFERENCES users(id),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(followup_number)
);

-- Seed initial follow-up rules
INSERT INTO comm_followup_rules (followup_number, wait_days, subject_template, body_template)
VALUES
  (1, 3, 'Following up | Placement Brochure — NITH', 'Dear {{hr_name}},\n\nThis is a gentle follow-up regarding the placement brochure we sent earlier. We would appreciate your response at your earliest convenience.\n\nThank you.'),
  (2, 5, 'Final Follow-up | Campus Placement 2025-26 — NITH', 'Dear {{hr_name}},\n\nThis is our final follow-up regarding our placement drive. We hope to hear from you soon.\n\nThank you.')
ON CONFLICT (followup_number) DO NOTHING;

-- IMPORTANT: You must manually create a public Storage Bucket named 'templates' in your Supabase dashboard!
