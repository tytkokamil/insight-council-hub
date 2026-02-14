
-- Drop existing SELECT policy on decisions
DROP POLICY IF EXISTS "Authenticated users can view decisions" ON public.decisions;

-- New policy: visible if no team assigned, OR user is creator, OR user is assignee, OR user is team member, OR user is admin
CREATE POLICY "Team-based decision visibility"
ON public.decisions
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND (
    team_id IS NULL
    OR created_by = auth.uid()
    OR assignee_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.team_members
      WHERE team_members.team_id = decisions.team_id
      AND team_members.user_id = auth.uid()
    )
    OR has_role(auth.uid(), 'admin'::user_role)
  )
);
