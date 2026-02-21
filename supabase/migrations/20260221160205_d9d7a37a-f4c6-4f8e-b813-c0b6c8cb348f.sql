
-- 1. Soft Delete: Add deleted_at to decisions and tasks
ALTER TABLE public.decisions ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

-- 2. Create index for fast filtering of non-deleted records
CREATE INDEX IF NOT EXISTS idx_decisions_deleted_at ON public.decisions (deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_deleted_at ON public.tasks (deleted_at) WHERE deleted_at IS NULL;

-- 3. Update decisions SELECT policy to exclude soft-deleted records
DROP POLICY IF EXISTS "Team-based decision visibility" ON public.decisions;
CREATE POLICY "Team-based decision visibility" ON public.decisions
FOR SELECT USING (
  (auth.uid() IS NOT NULL)
  AND (deleted_at IS NULL)
  AND (
    (team_id IS NULL)
    OR (created_by = auth.uid())
    OR (assignee_id = auth.uid())
    OR (EXISTS (SELECT 1 FROM team_members WHERE team_members.team_id = decisions.team_id AND team_members.user_id = auth.uid()))
    OR (EXISTS (SELECT 1 FROM decision_shares WHERE decision_shares.decision_id = decisions.id AND EXISTS (SELECT 1 FROM team_members WHERE team_members.team_id = decision_shares.team_id AND team_members.user_id = auth.uid())))
    OR is_org_admin_or_owner(auth.uid())
  )
);

-- 4. Update tasks SELECT policy to exclude soft-deleted records
DROP POLICY IF EXISTS "Team-based task visibility" ON public.tasks;
CREATE POLICY "Team-based task visibility" ON public.tasks
FOR SELECT USING (
  (auth.uid() IS NOT NULL)
  AND (deleted_at IS NULL)
  AND (
    (team_id IS NULL)
    OR (created_by = auth.uid())
    OR (assignee_id = auth.uid())
    OR (EXISTS (SELECT 1 FROM team_members WHERE team_members.team_id = tasks.team_id AND team_members.user_id = auth.uid()))
    OR is_org_admin_or_owner(auth.uid())
  )
);

-- 5. Add policy for viewing soft-deleted decisions (archive page) - only creator and admins
CREATE POLICY "Creators and admins can view deleted decisions" ON public.decisions
FOR SELECT USING (
  (deleted_at IS NOT NULL)
  AND (
    (created_by = auth.uid())
    OR is_org_admin_or_owner(auth.uid())
  )
);

-- 6. Add policy for viewing soft-deleted tasks
CREATE POLICY "Creators and admins can view deleted tasks" ON public.tasks
FOR SELECT USING (
  (deleted_at IS NOT NULL)
  AND (
    (created_by = auth.uid())
    OR is_org_admin_or_owner(auth.uid())
  )
);

-- 7. Restrict hard DELETE to org_owner only (replace existing delete policies)
DROP POLICY IF EXISTS "Creators can delete" ON public.decisions;
CREATE POLICY "Only org owners can hard delete decisions" ON public.decisions
FOR DELETE USING (
  is_org_admin_or_owner(auth.uid())
);

DROP POLICY IF EXISTS "Creators can delete" ON public.tasks;
CREATE POLICY "Only org owners can hard delete tasks" ON public.tasks
FOR DELETE USING (
  is_org_admin_or_owner(auth.uid())
);

-- 8. Protect audit_logs: ensure no DELETE policy exists (already the case, but be explicit)
-- audit_logs has no DELETE policy = nobody can delete audit entries via client
-- This is correct for compliance

-- 9. Create event_types enum for standardized taxonomy
DO $$ BEGIN
  CREATE TYPE public.event_type AS ENUM (
    'decision.created',
    'decision.updated',
    'decision.status_changed',
    'decision.deleted',
    'decision.restored',
    'decision.archived',
    'decision.shared',
    'decision.template_upgraded',
    'review.created',
    'review.approved',
    'review.rejected',
    'review.delegated',
    'task.created',
    'task.updated',
    'task.status_changed',
    'task.deleted',
    'task.restored',
    'escalation.triggered',
    'escalation.resolved',
    'automation.rule_executed',
    'team.member_added',
    'team.member_removed',
    'team.created',
    'risk.created',
    'risk.updated',
    'risk.linked',
    'comment.created',
    'stakeholder.position_changed',
    'goal.linked',
    'goal.unlinked'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
