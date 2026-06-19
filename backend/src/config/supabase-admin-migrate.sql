-- STEP 1 — Extend the existing users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS designation TEXT,
ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS designated_successor BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS succession_note TEXT,
ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS suspended_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS rejected_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS profile_note TEXT,
ADD COLUMN IF NOT EXISTS token_version INTEGER DEFAULT 0;

-- IMPORTANT CONSTRAINT — only one super admin at a time:
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_super_admin 
ON users(is_super_admin) 
WHERE is_super_admin = true;

-- IMPORTANT CONSTRAINT — only one designated successor at a time:
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_successor
ON users(designated_successor)
WHERE designated_successor = true;


-- STEP 2 — Create admin_audit_log table
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  performed_by UUID NOT NULL REFERENCES users(id),
  action_type TEXT NOT NULL CHECK (action_type IN (
    'user_approved',
    'user_rejected', 
    'user_suspended',
    'user_reinstated',
    'role_changed',
    'successor_designated',
    'succession_note_updated',
    'leadership_transferred',
    'emergency_recovery_initiated',
    'password_reset_issued',
    'branch_created',
    'branch_updated'
  )),
  target_user_id UUID REFERENCES users(id),
  target_branch_id UUID REFERENCES branches(id),
  old_value JSONB,
  new_value JSONB,
  reason TEXT,
  ip_address TEXT,
  performed_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_performed_by 
  ON admin_audit_log(performed_by);
CREATE INDEX IF NOT EXISTS idx_audit_target_user 
  ON admin_audit_log(target_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_action_type 
  ON admin_audit_log(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_performed_at 
  ON admin_audit_log(performed_at DESC);

REVOKE DELETE ON admin_audit_log FROM PUBLIC;
REVOKE UPDATE ON admin_audit_log FROM PUBLIC;


-- STEP 3 — Create recovery_requests table
CREATE TABLE IF NOT EXISTS recovery_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_type TEXT NOT NULL CHECK (request_type IN (
    'successor_handover',
    'emergency_recovery'
  )),
  initiated_by UUID REFERENCES users(id),
  new_head_email TEXT NOT NULL,
  new_head_name TEXT NOT NULL,
  recovery_token TEXT UNIQUE,
  token_expires_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',
    'completed', 
    'expired',
    'cancelled'
  )),
  institution_authority_name TEXT,
  institution_authority_contact TEXT,
  developer_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_recovery_token 
  ON recovery_requests(recovery_token) 
  WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_recovery_status 
  ON recovery_requests(status);


-- STEP 4 — Create worker_registration_requests table
CREATE TABLE IF NOT EXISTS worker_registration_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  designation TEXT NOT NULL CHECK (designation IN (
    'caller',
    'coordinator', 
    'assistant_tpo'
  )),
  self_note TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',
    'approved',
    'rejected'
  )),
  reviewed_by UUID REFERENCES users(id),
  review_note TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_worker_reg_status 
  ON worker_registration_requests(status);
CREATE INDEX IF NOT EXISTS idx_worker_reg_email 
  ON worker_registration_requests(email);


-- STEP 5 — Create admin_notifications table
CREATE TABLE IF NOT EXISTS admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES users(id),
  type TEXT NOT NULL CHECK (type IN (
    'new_registration_request',
    'account_approved',
    'account_rejected',
    'leadership_transfer_initiated',
    'recovery_request_created',
    'worker_suspended'
  )),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_user_id UUID REFERENCES users(id),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notif_recipient 
  ON admin_notifications(recipient_id, is_read);


-- STEP 6 — Bootstrap the first super admin
INSERT INTO users (
  name,
  roll_number,
  email, 
  password_hash,
  role,
  is_super_admin,
  status,
  designation
) VALUES (
  'Head TPO Name',
  'HEAD0001',
  'headtpo@nith.ac.in',
  '$2b$12$C.wycxOT6f6RDvD/QMtX9Oegn9.UqYMcen1l39DTTMetp9nisQBrq',
  'head',
  true,
  'approved',
  'Head TPO'
) ON CONFLICT (email) DO NOTHING;
