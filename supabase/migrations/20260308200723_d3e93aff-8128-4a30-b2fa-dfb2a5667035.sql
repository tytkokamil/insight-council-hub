-- Add confidential_viewer_ids column
ALTER TABLE public.decisions ADD COLUMN IF NOT EXISTS confidential_viewer_ids uuid[] DEFAULT '{}';

-- Drop existing SELECT policies that handle confidential logic
DROP POLICY IF EXISTS "Team-based decision visibility" ON public.decisions;

-- Recreate SELECT policy with confidential_viewer_ids support
CREATE POLICY "Team-based decision visibility" ON public.decisions
FOR SELECT TO authenticated
USING (
  auth.uid() IS NOT NULL
  AND deleted_at IS NULL
  AND (
    -- Non-confidential: org-based visibility with team scoping
    (
      NOT confidential
      AND org_id = get_user_org_id(auth.uid())
      AND (
        team_id IS NULL
        OR created_by = auth.uid()
        OR owner_id = auth.uid()
        OR assignee_id = auth.uid()
        OR EXISTS (SELECT 1 FROM team_members WHERE team_members.team_id = decisions.team_id AND team_members.user_id = auth.uid())
        OR EXISTS (SELECT 1 FROM decision_shares WHERE decision_shares.decision_id = decisions.id AND EXISTS (SELECT 1 FROM team_members WHERE team_members.team_id = decision_shares.team_id AND team_members.user_id = auth.uid()))
        OR has_min_role(auth.uid(), 'org_executive')
      )
    )
    OR
    -- Confidential: restricted to explicit viewer list + owner/creator/assignee/reviewer + admins
    (
      confidential
      AND org_id = get_user_org_id(auth.uid())
      AND (
        created_by = auth.uid()
        OR owner_id = auth.uid()
        OR assignee_id = auth.uid()
        OR auth.uid() = ANY(confidential_viewer_ids)
        OR EXISTS (SELECT 1 FROM decision_reviews WHERE decision_reviews.decision_id = decisions.id AND decision_reviews.reviewer_id = auth.uid())
        OR has_min_role(auth.uid(), 'org_admin')
      )
    )
  )
);