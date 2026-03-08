-- Fix cross-org decision exposure: add org_id scoping to the main SELECT policy

DROP POLICY IF EXISTS "Team-based decision visibility" ON public.decisions;

CREATE POLICY "Team-based decision visibility" ON public.decisions
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IS NOT NULL
    AND deleted_at IS NULL
    AND (
      (
        NOT confidential
        AND decisions.org_id = get_user_org_id(auth.uid())
        AND (
          team_id IS NULL
          OR created_by = auth.uid()
          OR owner_id = auth.uid()
          OR assignee_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM team_members
            WHERE team_members.team_id = decisions.team_id
              AND team_members.user_id = auth.uid()
          )
          OR EXISTS (
            SELECT 1 FROM decision_shares
            WHERE decision_shares.decision_id = decisions.id
              AND EXISTS (
                SELECT 1 FROM team_members
                WHERE team_members.team_id = decision_shares.team_id
                  AND team_members.user_id = auth.uid()
              )
          )
          OR has_min_role(auth.uid(), 'org_executive')
        )
      )
      OR (
        confidential
        AND decisions.org_id = get_user_org_id(auth.uid())
        AND (
          created_by = auth.uid()
          OR owner_id = auth.uid()
          OR assignee_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM decision_reviews
            WHERE decision_reviews.decision_id = decisions.id
              AND decision_reviews.reviewer_id = auth.uid()
          )
          OR has_min_role(auth.uid(), 'org_admin')
        )
      )
    )
  );

DROP POLICY IF EXISTS "Owners assignees and admins can update decisions" ON public.decisions;

CREATE POLICY "Owners assignees and admins can update decisions" ON public.decisions
  FOR UPDATE
  TO authenticated
  USING (
    decisions.org_id = get_user_org_id(auth.uid())
    AND (
      (auth.uid() = owner_id AND has_min_role(auth.uid(), 'org_member'))
      OR (auth.uid() = assignee_id AND has_min_role(auth.uid(), 'org_member'))
      OR has_min_role(auth.uid(), 'org_admin')
    )
  );

DROP POLICY IF EXISTS "Admins can hard delete decisions" ON public.decisions;

CREATE POLICY "Admins can hard delete decisions" ON public.decisions
  FOR DELETE
  TO authenticated
  USING (
    decisions.org_id = get_user_org_id(auth.uid())
    AND has_min_role(auth.uid(), 'org_admin')
  );

DROP POLICY IF EXISTS "Owners and admins can view deleted decisions" ON public.decisions;

CREATE POLICY "Owners and admins can view deleted decisions" ON public.decisions
  FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NOT NULL
    AND decisions.org_id = get_user_org_id(auth.uid())
    AND (
      owner_id = auth.uid()
      OR created_by = auth.uid()
      OR has_min_role(auth.uid(), 'org_admin')
    )
  );
