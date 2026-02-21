
-- 1. Add plan tier column to feature_flags
ALTER TABLE public.feature_flags 
ADD COLUMN IF NOT EXISTS min_plan text NOT NULL DEFAULT 'starter';

-- Add comment for documentation
COMMENT ON COLUMN public.feature_flags.min_plan IS 'Minimum pricing plan required: starter, pro, business, enterprise';

-- Update existing flags with appropriate plan tiers based on category
UPDATE public.feature_flags SET min_plan = 'starter' WHERE category = 'core';
UPDATE public.feature_flags SET min_plan = 'pro' WHERE category = 'analysis';
UPDATE public.feature_flags SET min_plan = 'business' WHERE category = 'intelligence';
UPDATE public.feature_flags SET min_plan = 'pro' WHERE category = 'admin';

-- 2. Create server-side aggregate function for dashboard KPIs
CREATE OR REPLACE FUNCTION public.get_dashboard_kpis(_user_id uuid, _team_id uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  result jsonb;
  _now timestamptz := now();
BEGIN
  SELECT jsonb_build_object(
    'total_decisions', (
      SELECT count(*) FROM decisions d
      WHERE d.deleted_at IS NULL
        AND ((_team_id IS NOT NULL AND d.team_id = _team_id)
             OR (_team_id IS NULL AND (d.created_by = _user_id OR d.assignee_id = _user_id)))
    ),
    'active_decisions', (
      SELECT count(*) FROM decisions d
      WHERE d.deleted_at IS NULL
        AND d.status NOT IN ('implemented', 'rejected', 'archived', 'cancelled')
        AND ((_team_id IS NOT NULL AND d.team_id = _team_id)
             OR (_team_id IS NULL AND (d.created_by = _user_id OR d.assignee_id = _user_id)))
    ),
    'overdue_decisions', (
      SELECT count(*) FROM decisions d
      WHERE d.deleted_at IS NULL
        AND d.status NOT IN ('implemented', 'rejected', 'archived', 'cancelled')
        AND d.due_date IS NOT NULL AND d.due_date < CURRENT_DATE
        AND ((_team_id IS NOT NULL AND d.team_id = _team_id)
             OR (_team_id IS NULL AND (d.created_by = _user_id OR d.assignee_id = _user_id)))
    ),
    'escalated_decisions', (
      SELECT count(*) FROM decisions d
      WHERE d.deleted_at IS NULL
        AND d.status NOT IN ('implemented', 'rejected', 'archived', 'cancelled')
        AND COALESCE(d.escalation_level, 0) >= 1
        AND ((_team_id IS NOT NULL AND d.team_id = _team_id)
             OR (_team_id IS NULL AND (d.created_by = _user_id OR d.assignee_id = _user_id)))
    ),
    'implemented_decisions', (
      SELECT count(*) FROM decisions d
      WHERE d.deleted_at IS NULL AND d.status = 'implemented'
        AND ((_team_id IS NOT NULL AND d.team_id = _team_id)
             OR (_team_id IS NULL AND (d.created_by = _user_id OR d.assignee_id = _user_id)))
    ),
    'avg_decision_days', (
      SELECT COALESCE(ROUND(AVG(EXTRACT(EPOCH FROM (d.implemented_at - d.created_at)) / 86400)::numeric, 1), 0)
      FROM decisions d
      WHERE d.deleted_at IS NULL AND d.status = 'implemented' AND d.implemented_at IS NOT NULL
        AND ((_team_id IS NOT NULL AND d.team_id = _team_id)
             OR (_team_id IS NULL AND (d.created_by = _user_id OR d.assignee_id = _user_id)))
    ),
    'total_tasks', (
      SELECT count(*) FROM tasks t
      WHERE t.deleted_at IS NULL
        AND ((_team_id IS NOT NULL AND t.team_id = _team_id)
             OR (_team_id IS NULL AND (t.created_by = _user_id OR t.assignee_id = _user_id)))
    ),
    'open_tasks', (
      SELECT count(*) FROM tasks t
      WHERE t.deleted_at IS NULL AND t.status NOT IN ('done')
        AND ((_team_id IS NOT NULL AND t.team_id = _team_id)
             OR (_team_id IS NULL AND (t.created_by = _user_id OR t.assignee_id = _user_id)))
    ),
    'open_risks', (
      SELECT count(*) FROM risks r
      WHERE r.status = 'open'
        AND ((_team_id IS NOT NULL AND r.team_id = _team_id)
             OR (_team_id IS NULL AND r.created_by = _user_id))
    ),
    'pending_reviews', (
      SELECT count(*) FROM decision_reviews dr
      WHERE dr.reviewed_at IS NULL AND dr.reviewer_id = _user_id
    )
  ) INTO result;
  
  RETURN result;
END;
$$;
