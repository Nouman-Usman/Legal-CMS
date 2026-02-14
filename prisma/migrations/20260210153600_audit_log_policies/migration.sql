-- Enable RLS on audit_logs
ALTER TABLE "audit_logs" ENABLE ROW LEVEL SECURITY;

-- 1. SELECT Policy: Admins can view logs where the user belongs to their chamber
-- Logic:
-- 1. Find the chamber(s) the current user (admin) belongs to.
-- 2. Ensure the current user has 'chamber_admin' role.
-- 3. Find logs where the user_id also belongs to one of those chambers.

CREATE POLICY "view_chamber_audit_logs" ON "audit_logs"
FOR SELECT USING (
  EXISTS (
    SELECT 1 
    FROM "chamber_members" admin_cm
    JOIN "users" admin_user ON admin_user.id = admin_cm.user_id
    JOIN "chamber_members" target_cm ON target_cm.chamber_id = admin_cm.chamber_id
    WHERE admin_cm.user_id = auth.uid()
      AND admin_user.role = 'chamber_admin'
      AND target_cm.user_id = audit_logs.user_id
  )
);

-- 2. INSERT Policy: Authenticated users can log their own actions
CREATE POLICY "insert_own_audit_logs" ON "audit_logs"
FOR INSERT WITH CHECK (
  auth.uid() = user_id
);
