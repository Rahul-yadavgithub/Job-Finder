-- 1. Templates Table: Defines available workflows and their allowed states
CREATE TABLE IF NOT EXISTS company_workflow_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_type TEXT UNIQUE NOT NULL, -- e.g., 'brochure', 'mou_signing'
  display_name TEXT NOT NULL,         -- e.g., 'Brochure', 'MoU Signing'
  description TEXT,
  allowed_states JSONB NOT NULL,      -- e.g., ["pending", "sent", "acknowledged"]
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Instances Table: Tracks the actual state of a workflow for a specific company assignment
CREATE TABLE IF NOT EXISTS company_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID REFERENCES company_status(id) ON DELETE CASCADE,
  workflow_type TEXT REFERENCES company_workflow_templates(workflow_type) ON UPDATE CASCADE,
  status TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(assignment_id, workflow_type)
);

-- Index for fast dashboard querying
CREATE INDEX IF NOT EXISTS idx_company_workflows_assignment ON company_workflows(assignment_id);

-- 3. Seed initial templates
INSERT INTO company_workflow_templates (workflow_type, display_name, description, allowed_states)
VALUES 
  ('brochure', 'Brochure', 'Track the brochure sending process', '["not_required", "pending", "sent", "acknowledged"]'),
  ('jnf', 'JNF', 'Track the Job Notification Form process', '["pending", "sent", "waiting_response", "received"]'),
  ('database', 'Database', 'Track the student database process', '["pending", "requested", "prepared", "sent", "received"]'),
  ('drive', 'Drive', 'Track the recruitment drive process', '["not_started", "planning", "date_proposed", "date_confirmed", "completed"]')
ON CONFLICT (workflow_type) DO UPDATE SET 
  allowed_states = EXCLUDED.allowed_states,
  display_name = EXCLUDED.display_name;
