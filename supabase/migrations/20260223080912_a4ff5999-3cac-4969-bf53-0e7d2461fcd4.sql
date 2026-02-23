
-- 1. AUDIT LOGS: Restrict to decision participants + org admins
DROP POLICY IF EXISTS "Authenticated users can view audit logs" ON public.audit_logs;

CREATE POLICY "Users can view relevant audit logs"
ON public.audit_logs FOR SELECT
USING (
  is_org_admin_or_owner(auth.uid())
  OR EXISTS (
    SELECT 1 FROM decisions d
    WHERE d.id = audit_logs.decision_id
      AND (d.created_by = auth.uid() OR d.owner_id = auth.uid() OR d.assignee_id = auth.uid()
           OR EXISTS (SELECT 1 FROM team_members tm WHERE tm.team_id = d.team_id AND tm.user_id = auth.uid()))
  )
);

-- 2. DATA RETENTION CONFIG: Restrict to org admins only (remove the broad SELECT)
DROP POLICY IF EXISTS "Authenticated users can view retention config" ON public.data_retention_config;

CREATE POLICY "Only admins can view retention config"
ON public.data_retention_config FOR SELECT
USING (is_org_admin_or_owner(auth.uid()));

-- 3. AUTOMATION RULE LOGS: Restrict to team members + admins
DROP POLICY IF EXISTS "Authenticated users can view rule logs" ON public.automation_rule_logs;

CREATE POLICY "Users can view relevant rule logs"
ON public.automation_rule_logs FOR SELECT
USING (
  is_org_admin_or_owner(auth.uid())
  OR EXISTS (
    SELECT 1 FROM automation_rules ar
    WHERE ar.id = automation_rule_logs.rule_id
      AND (ar.team_id IS NULL OR EXISTS (
        SELECT 1 FROM team_members tm WHERE tm.team_id = ar.team_id AND tm.user_id = auth.uid()
      ))
  )
);

-- 4. SLA CONFIGS: Restrict to team members + admins (needed for frontend display within teams)
DROP POLICY IF EXISTS "Authenticated users can view SLA configs" ON public.sla_configs;

CREATE POLICY "Team members and admins can view SLA configs"
ON public.sla_configs FOR SELECT
USING (
  is_org_admin_or_owner(auth.uid())
  OR EXISTS (SELECT 1 FROM team_members tm WHERE tm.user_id = auth.uid())
);
