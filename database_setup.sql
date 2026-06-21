CREATE TABLE IF NOT EXISTS company_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  company_id UUID NOT NULL 
    REFERENCES companies(id),
  assignment_id UUID NOT NULL
    REFERENCES company_status(id),
  
  event_type TEXT NOT NULL CHECK (event_type IN (
    'marked_interested',
    'brochure_request_raised',
    'brochure_sent',
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
    'registrations_opened',
    'note_added'
  )),
  
  performed_by UUID REFERENCES users(id),
  performed_by_layer TEXT CHECK (performed_by_layer IN (
    'base','comm','admin','system'
  )),
  
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  
  is_visible_to_base BOOLEAN DEFAULT false,
  is_visible_to_comm BOOLEAN DEFAULT true,
  is_visible_to_admin BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_timeline_company
  ON company_timeline(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_timeline_assignment
  ON company_timeline(assignment_id, created_at DESC);

CREATE TABLE IF NOT EXISTS admin_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  request_source TEXT NOT NULL CHECK (request_source IN (
    'comm_tpr',
    'company_response',
    'system'
  )),
  
  request_type TEXT NOT NULL CHECK (request_type IN (
    'send_brochure',
    'send_jnf',
    'send_database',
    'send_custom',
    'confirm_drive',
    'review_company'
  )),
  
  requires_head_tpo BOOLEAN DEFAULT false,
  
  company_id UUID NOT NULL 
    REFERENCES companies(id),
  assignment_id UUID NOT NULL
    REFERENCES company_status(id),
  
  raised_by UUID REFERENCES users(id),
  raised_by_name TEXT,
  
  notes TEXT,
  urgency TEXT DEFAULT 'normal' 
    CHECK (urgency IN ('normal','urgent')),
  
  email_to TEXT,
  email_subject TEXT,
  email_body TEXT,
  attachment_template_id UUID 
    REFERENCES email_templates(id),
  attachment_url TEXT,
  attachment_filename TEXT,
  
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending',
    'actioned',
    'rejected',
    'cancelled'
  )),
  
  actioned_by UUID REFERENCES users(id),
  actioned_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_requests_status
  ON admin_requests(status, requires_head_tpo);
CREATE INDEX IF NOT EXISTS idx_admin_requests_company
  ON admin_requests(company_id, status);

CREATE TABLE IF NOT EXISTS company_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  company_id UUID NOT NULL 
    REFERENCES companies(id),
  assignment_id UUID NOT NULL
    REFERENCES company_status(id),
  
  response_date TIMESTAMPTZ DEFAULT now(),
  response_method TEXT CHECK (response_method IN (
    'email_reply','phone_call','in_person'
  )),
  
  responded_by_name TEXT,
  responded_by_title TEXT,
  
  response_summary TEXT NOT NULL,
  
  next_action_requested TEXT CHECK (
    next_action_requested IN (
      'send_jnf',
      'send_database',
      'send_brochure',
      'schedule_call',
      'schedule_visit',
      'no_action',
      'other'
    )
  ),
  next_action_notes TEXT,
  
  logged_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS drive_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  company_id UUID NOT NULL 
    REFERENCES companies(id),
  assignment_id UUID NOT NULL
    REFERENCES company_status(id),
  
  drive_type TEXT CHECK (drive_type IN (
    'in_campus','pool','virtual','off_campus'
  )),
  
  scheduled_date DATE,
  scheduled_time TEXT,
  venue TEXT,
  
  eligible_branches TEXT[],
  eligible_year TEXT,
  eligible_cgpa DECIMAL,
  
  roles_offered TEXT[],
  salary_package TEXT,
  stipend TEXT,
  
  registration_open BOOLEAN DEFAULT false,
  registration_deadline DATE,
  registered_count INTEGER DEFAULT 0,
  
  jnf_received BOOLEAN DEFAULT false,
  jnf_received_at TIMESTAMPTZ,
  jnf_document_url TEXT,
  
  confirmed_by UUID REFERENCES users(id),
  confirmed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE company_status
ADD COLUMN IF NOT EXISTS top_stage TEXT 
  DEFAULT NULL CHECK (top_stage IN (
    'under_admin_review',
    'brochure_sent',
    'jnf_requested',
    'jnf_sent',
    'database_sent',
    'drive_confirmed',
    'drive_scheduled',
    'drive_completed',
    'dropped'
  )),
ADD COLUMN IF NOT EXISTS drive_id UUID 
  REFERENCES drive_details(id);
