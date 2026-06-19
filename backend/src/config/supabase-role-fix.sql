-- Drop the existing role constraint that only allows 'student', 'tpr', 'head'
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Add the new constraint that allows all administrative and worker roles
ALTER TABLE users ADD CONSTRAINT users_role_check 
CHECK (role IN ('student', 'branch_tpr', 'head', 'admin', 'caller', 'coordinator', 'assistant_tpo'));
