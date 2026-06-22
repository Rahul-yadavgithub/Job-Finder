-- Add composite indexes for frequently queried patterns
CREATE INDEX IF NOT EXISTS idx_company_status_branch_locked ON company_status(branch_id, locked);
CREATE INDEX IF NOT EXISTS idx_company_status_base_mid ON company_status(base_status, mid_status);
CREATE INDEX IF NOT EXISTS idx_admin_requests_status_source ON admin_requests(status, request_source);
CREATE INDEX IF NOT EXISTS idx_workflow_tasks_assigned_status ON workflow_tasks(assigned_to, status);
CREATE INDEX IF NOT EXISTS idx_company_timeline_company_event ON company_timeline(company_id, event_type);
