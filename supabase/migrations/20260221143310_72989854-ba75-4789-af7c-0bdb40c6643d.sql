
-- Cross-Team Visibility: decision_shares table
CREATE TABLE public.decision_shares (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  decision_id UUID NOT NULL REFERENCES public.decisions(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  shared_by UUID NOT NULL,
  shared_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(decision_id, team_id)
);

ALTER TABLE public.decision_shares ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view shares
CREATE POLICY "Authenticated users can view shares"
  ON public.decision_shares FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Decision creator/assignee or org admin can share
CREATE POLICY "Decision owners can share"
  ON public.decision_shares FOR INSERT
  WITH CHECK (
    auth.uid() = shared_by AND (
      EXISTS (
        SELECT 1 FROM decisions
        WHERE decisions.id = decision_shares.decision_id
          AND (decisions.created_by = auth.uid() OR decisions.assignee_id = auth.uid())
      )
      OR is_org_admin_or_owner(auth.uid())
    )
  );

-- Sharer or org admin can remove shares
CREATE POLICY "Sharers can delete shares"
  ON public.decision_shares FOR DELETE
  USING (auth.uid() = shared_by OR is_org_admin_or_owner(auth.uid()));

-- Update decisions SELECT policy to include shared decisions
DROP POLICY IF EXISTS "Team-based decision visibility" ON public.decisions;

CREATE POLICY "Team-based decision visibility"
  ON public.decisions FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND (
      team_id IS NULL
      OR created_by = auth.uid()
      OR assignee_id = auth.uid()
      OR EXISTS (SELECT 1 FROM team_members WHERE team_members.team_id = decisions.team_id AND team_members.user_id = auth.uid())
      OR EXISTS (SELECT 1 FROM decision_shares WHERE decision_shares.decision_id = decisions.id AND EXISTS (SELECT 1 FROM team_members WHERE team_members.team_id = decision_shares.team_id AND team_members.user_id = auth.uid()))
      OR is_org_admin_or_owner(auth.uid())
    )
  );
