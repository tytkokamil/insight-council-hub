-- 1. churn_risk_log: only org admins/owners can insert (system/internal table)
DROP POLICY IF EXISTS "System can insert churn logs" ON public.churn_risk_log;
CREATE POLICY "Org admins can insert churn logs"
  ON public.churn_risk_log
  FOR INSERT
  TO authenticated
  WITH CHECK (
    org_id = public.get_user_org_id(auth.uid())
    AND public.is_org_admin_or_owner(auth.uid())
  );

-- 2. daily_briefs: only same-org authenticated users can insert
DROP POLICY IF EXISTS "Service role can insert daily briefs" ON public.daily_briefs;
CREATE POLICY "Authenticated users can insert own org daily briefs"
  ON public.daily_briefs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    org_id = public.get_user_org_id(auth.uid())
  );

-- 3. support_requests: restrict to authenticated users only
DROP POLICY IF EXISTS "Anyone can submit support requests" ON public.support_requests;
CREATE POLICY "Authenticated users can submit support requests"
  ON public.support_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (true);