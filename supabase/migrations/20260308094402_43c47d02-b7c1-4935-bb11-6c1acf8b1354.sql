-- Performance indexes recommended by Optimierungs-Bericht (Section 5.2)

-- Index for Dashboard loads: filter by org, status, created_at
CREATE INDEX IF NOT EXISTS idx_decisions_org_status_created
  ON public.decisions (org_id, status, created_at DESC)
  WHERE deleted_at IS NULL;

-- Index for Audit Trail pagination
CREATE INDEX IF NOT EXISTS idx_audit_logs_org_created
  ON public.audit_logs (org_id, created_at DESC);

-- Index for decision lookups by owner (common filter)
CREATE INDEX IF NOT EXISTS idx_decisions_owner_status
  ON public.decisions (owner_id, status)
  WHERE deleted_at IS NULL;

-- Index for tasks by assignee (task board loads)
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_status
  ON public.tasks (assignee_id, status)
  WHERE deleted_at IS NULL;

-- Index for team-based decision queries
CREATE INDEX IF NOT EXISTS idx_decisions_team_status
  ON public.decisions (team_id, status, created_at DESC)
  WHERE deleted_at IS NULL AND team_id IS NOT NULL;