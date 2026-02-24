
-- =============================================
-- PHASE 2: RLS UPDATE + ROLE_PERMISSIONS TABLE
-- =============================================

-- =============================================
-- PART A: role_permissions table for Custom Roles
-- =============================================

CREATE TABLE IF NOT EXISTS public.role_permissions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  role        public.org_role NOT NULL,
  permission  TEXT NOT NULL,
  enabled     BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(org_id, role, permission)
);

ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view role permissions"
  ON public.role_permissions FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Org admins can manage role permissions"
  ON public.role_permissions FOR ALL
  USING (public.is_org_admin_or_owner(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER set_role_permissions_updated_at
  BEFORE UPDATE ON public.role_permissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- PART B: Helper function to check custom permissions
-- =============================================

CREATE OR REPLACE FUNCTION public.has_permission(_user_id UUID, _permission TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    -- First check org-specific override
    (SELECT rp.enabled
     FROM role_permissions rp
     JOIN user_roles ur ON ur.role = rp.role
     JOIN profiles p ON p.user_id = ur.user_id
     WHERE ur.user_id = _user_id
       AND rp.permission = _permission
       AND rp.org_id = p.org_id
     LIMIT 1),
    -- Then check global override (org_id IS NULL)
    (SELECT rp.enabled
     FROM role_permissions rp
     JOIN user_roles ur ON ur.role = rp.role
     WHERE ur.user_id = _user_id
       AND rp.permission = _permission
       AND rp.org_id IS NULL
     LIMIT 1),
    -- Default: use hardcoded role hierarchy
    true
  )
$$;

-- =============================================
-- PART C: UPDATE RLS POLICIES
-- =============================================

-- ----- DECISIONS -----

-- 1. SELECT: Add executive org-wide read
DROP POLICY IF EXISTS "Team-based decision visibility" ON public.decisions;
CREATE POLICY "Team-based decision visibility" ON public.decisions
  FOR SELECT USING (
    auth.uid() IS NOT NULL
    AND deleted_at IS NULL
    AND (
      (NOT confidential AND (
        team_id IS NULL
        OR created_by = auth.uid()
        OR owner_id = auth.uid()
        OR assignee_id = auth.uid()
        OR EXISTS (SELECT 1 FROM team_members WHERE team_members.team_id = decisions.team_id AND team_members.user_id = auth.uid())
        OR EXISTS (SELECT 1 FROM decision_shares WHERE decision_shares.decision_id = decisions.id AND EXISTS (SELECT 1 FROM team_members WHERE team_members.team_id = decision_shares.team_id AND team_members.user_id = auth.uid()))
        OR public.has_min_role(auth.uid(), 'org_executive')
      ))
      OR (confidential AND (
        created_by = auth.uid()
        OR owner_id = auth.uid()
        OR assignee_id = auth.uid()
        OR EXISTS (SELECT 1 FROM decision_reviews WHERE decision_reviews.decision_id = decisions.id AND decision_reviews.reviewer_id = auth.uid())
        OR public.has_min_role(auth.uid(), 'org_admin')
      ))
    )
  );

-- 2. SELECT deleted: keep admin+
DROP POLICY IF EXISTS "Owners and admins can view deleted decisions" ON public.decisions;
CREATE POLICY "Owners and admins can view deleted decisions" ON public.decisions
  FOR SELECT USING (
    deleted_at IS NOT NULL
    AND (owner_id = auth.uid() OR created_by = auth.uid() OR public.has_min_role(auth.uid(), 'org_admin'))
  );

-- 3. INSERT: Restrict to member+
DROP POLICY IF EXISTS "Users can create decisions" ON public.decisions;
CREATE POLICY "Members can create decisions" ON public.decisions
  FOR INSERT WITH CHECK (
    auth.uid() = created_by
    AND auth.uid() = owner_id
    AND public.has_min_role(auth.uid(), 'org_member')
  );

-- 4. UPDATE: keep admin+ or own
DROP POLICY IF EXISTS "Owners and assignees can update" ON public.decisions;
CREATE POLICY "Owners assignees and admins can update decisions" ON public.decisions
  FOR UPDATE USING (
    (auth.uid() = owner_id AND public.has_min_role(auth.uid(), 'org_member'))
    OR (auth.uid() = assignee_id AND public.has_min_role(auth.uid(), 'org_member'))
    OR public.has_min_role(auth.uid(), 'org_admin')
  );

-- 5. DELETE: admin+
DROP POLICY IF EXISTS "Only org owners can hard delete decisions" ON public.decisions;
CREATE POLICY "Admins can hard delete decisions" ON public.decisions
  FOR DELETE USING (public.has_min_role(auth.uid(), 'org_admin'));


-- ----- TASKS -----

-- SELECT: Add executive org-wide read
DROP POLICY IF EXISTS "Team-based task visibility" ON public.tasks;
CREATE POLICY "Team-based task visibility" ON public.tasks
  FOR SELECT USING (
    auth.uid() IS NOT NULL
    AND deleted_at IS NULL
    AND (
      team_id IS NULL
      OR created_by = auth.uid()
      OR assignee_id = auth.uid()
      OR EXISTS (SELECT 1 FROM team_members WHERE team_members.team_id = tasks.team_id AND team_members.user_id = auth.uid())
      OR public.has_min_role(auth.uid(), 'org_executive')
    )
  );

-- SELECT deleted
DROP POLICY IF EXISTS "Creators and admins can view deleted tasks" ON public.tasks;
CREATE POLICY "Creators and admins can view deleted tasks" ON public.tasks
  FOR SELECT USING (
    deleted_at IS NOT NULL
    AND (created_by = auth.uid() OR public.has_min_role(auth.uid(), 'org_admin'))
  );

-- INSERT: member+
DROP POLICY IF EXISTS "Users can create tasks" ON public.tasks;
CREATE POLICY "Members can create tasks" ON public.tasks
  FOR INSERT WITH CHECK (
    auth.uid() = created_by
    AND public.has_min_role(auth.uid(), 'org_member')
  );

-- UPDATE: keep own + admin
DROP POLICY IF EXISTS "Creators and assignees can update" ON public.tasks;
CREATE POLICY "Creators assignees and admins can update tasks" ON public.tasks
  FOR UPDATE USING (
    (auth.uid() = created_by AND public.has_min_role(auth.uid(), 'org_member'))
    OR (auth.uid() = assignee_id AND public.has_min_role(auth.uid(), 'org_member'))
    OR public.has_min_role(auth.uid(), 'org_admin')
  );

-- DELETE: admin+
DROP POLICY IF EXISTS "Only org owners can hard delete tasks" ON public.tasks;
CREATE POLICY "Admins can hard delete tasks" ON public.tasks
  FOR DELETE USING (public.has_min_role(auth.uid(), 'org_admin'));


-- ----- AUDIT LOGS -----

-- SELECT: Add executive read
DROP POLICY IF EXISTS "Users can view relevant audit logs" ON public.audit_logs;
CREATE POLICY "Users can view relevant audit logs" ON public.audit_logs
  FOR SELECT USING (
    public.has_min_role(auth.uid(), 'org_executive')
    OR EXISTS (
      SELECT 1 FROM decisions d
      WHERE d.id = audit_logs.decision_id
        AND (d.created_by = auth.uid() OR d.owner_id = auth.uid() OR d.assignee_id = auth.uid()
          OR EXISTS (SELECT 1 FROM team_members tm WHERE tm.team_id = d.team_id AND tm.user_id = auth.uid()))
    )
  );


-- ----- COMMENTS -----

-- INSERT: reviewer+
DROP POLICY IF EXISTS "Users can create comments" ON public.comments;
CREATE POLICY "Reviewers can create comments" ON public.comments
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND public.has_min_role(auth.uid(), 'org_reviewer')
  );

-- UPDATE: reviewer+
DROP POLICY IF EXISTS "Users can update own comments" ON public.comments;
CREATE POLICY "Reviewers can update own comments" ON public.comments
  FOR UPDATE USING (
    auth.uid() = user_id
    AND public.has_min_role(auth.uid(), 'org_reviewer')
  );

-- DELETE: reviewer+
DROP POLICY IF EXISTS "Users can delete own comments" ON public.comments;
CREATE POLICY "Reviewers can delete own comments" ON public.comments
  FOR DELETE USING (
    auth.uid() = user_id
    AND public.has_min_role(auth.uid(), 'org_reviewer')
  );


-- ----- RISKS -----

-- INSERT: member+
DROP POLICY IF EXISTS "Users can create risks" ON public.risks;
CREATE POLICY "Members can create risks" ON public.risks
  FOR INSERT WITH CHECK (
    auth.uid() = created_by
    AND public.has_min_role(auth.uid(), 'org_member')
  );

-- SELECT: team-scoped for members, org-wide for executive+
DROP POLICY IF EXISTS "Authenticated users can view risks" ON public.risks;
CREATE POLICY "Role-based risk visibility" ON public.risks
  FOR SELECT USING (
    auth.uid() IS NOT NULL
    AND (
      created_by = auth.uid()
      OR owner_id = auth.uid()
      OR public.has_min_role(auth.uid(), 'org_executive')
      OR (public.has_min_role(auth.uid(), 'org_member') AND (
        team_id IS NULL
        OR EXISTS (SELECT 1 FROM team_members WHERE team_members.team_id = risks.team_id AND team_members.user_id = auth.uid())
      ))
    )
  );

-- UPDATE: keep own + admin
DROP POLICY IF EXISTS "Creators and owners can update risks" ON public.risks;
CREATE POLICY "Creators owners and admins can update risks" ON public.risks
  FOR UPDATE USING (
    auth.uid() = created_by
    OR auth.uid() = owner_id
    OR public.has_min_role(auth.uid(), 'org_admin')
  );


-- ----- DECISION DEPENDENCIES -----

DROP POLICY IF EXISTS "Creators and admins can delete dependencies" ON public.decision_dependencies;
CREATE POLICY "Creators and admins can delete dependencies" ON public.decision_dependencies
  FOR DELETE USING (
    auth.uid() = created_by OR public.has_min_role(auth.uid(), 'org_admin')
  );


-- ----- RISK LINKS -----

DROP POLICY IF EXISTS "Linkers can delete risk links" ON public.risk_decision_links;
CREATE POLICY "Linkers and admins can delete risk links" ON public.risk_decision_links
  FOR DELETE USING (
    auth.uid() = linked_by OR public.has_min_role(auth.uid(), 'org_admin')
  );

DROP POLICY IF EXISTS "Linkers can delete task links" ON public.risk_task_links;
CREATE POLICY "Linkers and admins can delete task links" ON public.risk_task_links
  FOR DELETE USING (
    auth.uid() = linked_by OR public.has_min_role(auth.uid(), 'org_admin')
  );


-- ----- DECISION SHARES -----

DROP POLICY IF EXISTS "Sharers can delete shares" ON public.decision_shares;
CREATE POLICY "Sharers and admins can delete shares" ON public.decision_shares
  FOR DELETE USING (
    auth.uid() = shared_by OR public.has_min_role(auth.uid(), 'org_admin')
  );

DROP POLICY IF EXISTS "Sharers can update own shares" ON public.decision_shares;
CREATE POLICY "Sharers and admins can update shares" ON public.decision_shares
  FOR UPDATE USING (
    auth.uid() = shared_by OR public.has_min_role(auth.uid(), 'org_admin')
  );


-- ----- MEETING SESSIONS -----

DROP POLICY IF EXISTS "Admins can delete sessions" ON public.meeting_sessions;
CREATE POLICY "Admins can delete meeting sessions" ON public.meeting_sessions
  FOR DELETE USING (public.has_min_role(auth.uid(), 'org_admin'));

DROP POLICY IF EXISTS "Creators can update sessions" ON public.meeting_sessions;
CREATE POLICY "Creators and admins can update meeting sessions" ON public.meeting_sessions
  FOR UPDATE USING (
    auth.uid() = created_by OR public.has_min_role(auth.uid(), 'org_admin')
  );

-- Insert default global role_permissions for reference
INSERT INTO public.role_permissions (org_id, role, permission, enabled) VALUES
  -- Viewer defaults
  (NULL, 'org_viewer', 'decisions.read', true),
  (NULL, 'org_viewer', 'decisions.create', false),
  (NULL, 'org_viewer', 'comments.write', false),
  (NULL, 'org_viewer', 'tasks.create', false),
  (NULL, 'org_viewer', 'risks.read', false),
  (NULL, 'org_viewer', 'analytics.view', false),
  -- Reviewer defaults
  (NULL, 'org_reviewer', 'decisions.read', true),
  (NULL, 'org_reviewer', 'decisions.create', false),
  (NULL, 'org_reviewer', 'reviews.submit', true),
  (NULL, 'org_reviewer', 'comments.write', true),
  (NULL, 'org_reviewer', 'tasks.create', false),
  (NULL, 'org_reviewer', 'analytics.view', false),
  -- Member defaults
  (NULL, 'org_member', 'decisions.read', true),
  (NULL, 'org_member', 'decisions.create', true),
  (NULL, 'org_member', 'comments.write', true),
  (NULL, 'org_member', 'reviews.submit', true),
  (NULL, 'org_member', 'tasks.create', true),
  (NULL, 'org_member', 'risks.read', true),
  (NULL, 'org_member', 'risks.create', true),
  (NULL, 'org_member', 'analytics.view', false),
  (NULL, 'org_member', 'templates.manage', false),
  -- Executive defaults
  (NULL, 'org_executive', 'decisions.read', true),
  (NULL, 'org_executive', 'decisions.create', false),
  (NULL, 'org_executive', 'analytics.view', true),
  (NULL, 'org_executive', 'executive.hub', true),
  (NULL, 'org_executive', 'risks.read', true),
  (NULL, 'org_executive', 'audit.read', true),
  (NULL, 'org_executive', 'comments.write', false),
  -- Admin defaults
  (NULL, 'org_admin', 'decisions.read', true),
  (NULL, 'org_admin', 'decisions.create', true),
  (NULL, 'org_admin', 'analytics.view', true),
  (NULL, 'org_admin', 'templates.manage', true),
  (NULL, 'org_admin', 'users.manage', true),
  (NULL, 'org_admin', 'automations.manage', true),
  (NULL, 'org_admin', 'audit.read', true),
  (NULL, 'org_admin', 'sla.manage', true),
  -- Owner defaults
  (NULL, 'org_owner', 'billing.manage', true),
  (NULL, 'org_owner', 'org.settings', true),
  (NULL, 'org_owner', 'owner.assign', true);
