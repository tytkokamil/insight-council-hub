-- Performance indexes for large-scale usage
-- Decisions: most common query patterns
CREATE INDEX IF NOT EXISTS idx_decisions_status ON public.decisions (status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_decisions_team_id ON public.decisions (team_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_decisions_due_date ON public.decisions (due_date) WHERE deleted_at IS NULL AND due_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_decisions_escalation_level ON public.decisions (escalation_level) WHERE deleted_at IS NULL AND escalation_level IS NOT NULL AND escalation_level >= 1;
CREATE INDEX IF NOT EXISTS idx_decisions_ai_risk_score ON public.decisions (ai_risk_score) WHERE deleted_at IS NULL AND ai_risk_score IS NOT NULL AND ai_risk_score > 0;
CREATE INDEX IF NOT EXISTS idx_decisions_created_by ON public.decisions (created_by) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_decisions_assignee_id ON public.decisions (assignee_id) WHERE deleted_at IS NULL AND assignee_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_decisions_owner_id ON public.decisions (owner_id) WHERE deleted_at IS NULL;

-- Tasks: common query patterns
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks (status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_team_id ON public.tasks (team_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks (due_date) WHERE deleted_at IS NULL AND due_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON public.tasks (created_by) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_id ON public.tasks (assignee_id) WHERE deleted_at IS NULL AND assignee_id IS NOT NULL;

-- Reviews: pending reviews query
CREATE INDEX IF NOT EXISTS idx_decision_reviews_pending ON public.decision_reviews (reviewer_id) WHERE reviewed_at IS NULL;

-- Notifications: unread notifications
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications (user_id) WHERE read = false;

-- Risks: open risks
CREATE INDEX IF NOT EXISTS idx_risks_open ON public.risks (status) WHERE status = 'open';
