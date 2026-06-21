CREATE TABLE IF NOT EXISTS workflow_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  assignment_id UUID REFERENCES company_status(id) ON DELETE CASCADE,
  workflow_type TEXT NOT NULL, -- e.g., 'brochure', 'jnf', 'database', 'drive'
  task_name TEXT NOT NULL,     -- e.g., 'Send JNF', 'Prepare Database'
  assigned_to UUID REFERENCES users(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'waiting_response', 'completed', 'cancelled')),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_workflow_tasks_assigned_to ON workflow_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_workflow_tasks_company ON workflow_tasks(company_id);
