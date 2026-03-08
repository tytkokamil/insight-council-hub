-- =============================================================
-- FIX 1: Decision subtables - scope SELECT to org membership
-- =============================================================

-- Helper function to check if user can access a decision
CREATE OR REPLACE FUNCTION public.can_access_decision(_user_id uuid, _decision_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.decisions d
    WHERE d.id = _decision_id
      AND d.deleted_at IS NULL
      AND d.org_id = get_user_org_id(_user_id)
      AND (d.confidential = false OR d.owner_id = _user_id OR d.created_by = _user_id OR d.assignee_id = _user_id OR is_org_admin_or_owner(_user_id))
  )
$$;

-- comments
DROP POLICY IF EXISTS "Authenticated users can view comments" ON public.comments;
CREATE POLICY "Org members can view comments" ON public.comments
  FOR SELECT TO authenticated
  USING (public.can_access_decision(auth.uid(), decision_id));

-- decision_votes
DROP POLICY IF EXISTS "Authenticated users can view votes" ON public.decision_votes;
CREATE POLICY "Org members can view votes" ON public.decision_votes
  FOR SELECT TO authenticated
  USING (public.can_access_decision(auth.uid(), decision_id));

-- decision_scenarios
DROP POLICY IF EXISTS "Authenticated can view scenarios" ON public.decision_scenarios;
CREATE POLICY "Org members can view scenarios" ON public.decision_scenarios
  FOR SELECT TO authenticated
  USING (public.can_access_decision(auth.uid(), decision_id));

-- stakeholder_positions
DROP POLICY IF EXISTS "Authenticated can view positions" ON public.stakeholder_positions;
CREATE POLICY "Org members can view positions" ON public.stakeholder_positions
  FOR SELECT TO authenticated
  USING (public.can_access_decision(auth.uid(), decision_id));

-- decision_reviews
DROP POLICY IF EXISTS "Authenticated users can view reviews" ON public.decision_reviews;
CREATE POLICY "Org members can view reviews" ON public.decision_reviews
  FOR SELECT TO authenticated
  USING (public.can_access_decision(auth.uid(), decision_id));

-- decision_attachments
DROP POLICY IF EXISTS "Authenticated users can view attachments" ON public.decision_attachments;
CREATE POLICY "Org members can view attachments" ON public.decision_attachments
  FOR SELECT TO authenticated
  USING (public.can_access_decision(auth.uid(), decision_id));

-- lessons_learned
DROP POLICY IF EXISTS "Authenticated users can view lessons" ON public.lessons_learned;
CREATE POLICY "Org members can view lessons" ON public.lessons_learned
  FOR SELECT TO authenticated
  USING (public.can_access_decision(auth.uid(), decision_id));

-- decision_dependencies (has source/target decision IDs)
DROP POLICY IF EXISTS "Authenticated users can view dependencies" ON public.decision_dependencies;
CREATE POLICY "Org members can view dependencies" ON public.decision_dependencies
  FOR SELECT TO authenticated
  USING (
    (source_decision_id IS NOT NULL AND public.can_access_decision(auth.uid(), source_decision_id))
    OR (target_decision_id IS NOT NULL AND public.can_access_decision(auth.uid(), target_decision_id))
  );

-- decision_shares
DROP POLICY IF EXISTS "Authenticated users can view active shares" ON public.decision_shares;
CREATE POLICY "Org members can view active shares" ON public.decision_shares
  FOR SELECT TO authenticated
  USING (
    public.can_access_decision(auth.uid(), decision_id)
    AND (expires_at IS NULL OR expires_at > now())
  );

-- =============================================================
-- FIX 2: NPS responses - scope admin SELECT to same org
-- =============================================================
DROP POLICY IF EXISTS "Admins can view all NPS" ON public.nps_responses;
CREATE POLICY "Admins can view org NPS" ON public.nps_responses
  FOR SELECT TO authenticated
  USING (
    is_org_admin_or_owner(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = nps_responses.user_id
        AND p.org_id = get_user_org_id(auth.uid())
    )
  );

-- =============================================================
-- FIX 3: Strategic goals - scope SELECT to org
-- =============================================================
DROP POLICY IF EXISTS "Authenticated users can view goals" ON public.strategic_goals;
CREATE POLICY "Org members can view goals" ON public.strategic_goals
  FOR SELECT TO authenticated
  USING (org_id = get_user_org_id(auth.uid()));