
-- 1) CONFIDENTIAL DECISIONS: Add confidential flag
ALTER TABLE public.decisions ADD COLUMN IF NOT EXISTS confidential boolean NOT NULL DEFAULT false;

-- 2) OUTCOME TYPE: Add outcome_type enum and column
DO $$ BEGIN
  CREATE TYPE public.outcome_type AS ENUM ('successful', 'partial', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.decisions ADD COLUMN IF NOT EXISTS outcome_type public.outcome_type;

-- 3) Update RLS: Confidential decisions only visible to owner, assignee, reviewers, org admins
DROP POLICY IF EXISTS "Team-based decision visibility" ON public.decisions;

CREATE POLICY "Team-based decision visibility"
ON public.decisions FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND deleted_at IS NULL
  AND (
    -- Non-confidential: normal visibility rules
    (NOT confidential AND (
      team_id IS NULL
      OR created_by = auth.uid()
      OR assignee_id = auth.uid()
      OR EXISTS (SELECT 1 FROM team_members WHERE team_members.team_id = decisions.team_id AND team_members.user_id = auth.uid())
      OR EXISTS (SELECT 1 FROM decision_shares WHERE decision_shares.decision_id = decisions.id AND EXISTS (SELECT 1 FROM team_members WHERE team_members.team_id = decision_shares.team_id AND team_members.user_id = auth.uid()))
      OR is_org_admin_or_owner(auth.uid())
    ))
    OR
    -- Confidential: only owner, assignee, reviewers, org admins
    (confidential AND (
      created_by = auth.uid()
      OR assignee_id = auth.uid()
      OR EXISTS (SELECT 1 FROM decision_reviews WHERE decision_reviews.decision_id = decisions.id AND decision_reviews.reviewer_id = auth.uid())
      OR is_org_admin_or_owner(auth.uid())
    ))
  )
);

-- Keep deleted decisions policy unchanged
-- No changes needed for INSERT/UPDATE/DELETE policies
