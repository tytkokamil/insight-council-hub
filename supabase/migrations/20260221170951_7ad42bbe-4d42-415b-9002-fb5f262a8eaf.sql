
-- =============================================
-- 1. SAVED VIEWS TABLE
-- =============================================
CREATE TABLE public.saved_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  icon TEXT DEFAULT 'bookmark',
  entity_type TEXT NOT NULL DEFAULT 'decisions',
  filters JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.saved_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own saved views"
  ON public.saved_views FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own saved views"
  ON public.saved_views FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own saved views"
  ON public.saved_views FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved views"
  ON public.saved_views FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_saved_views_updated_at
  BEFORE UPDATE ON public.saved_views
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- 2. OWNER_ID ON DECISIONS (Role Model Refactor)
-- =============================================
ALTER TABLE public.decisions
  ADD COLUMN owner_id UUID;

-- Default: owner = creator for all existing decisions
UPDATE public.decisions SET owner_id = created_by;

-- Make NOT NULL after backfill
ALTER TABLE public.decisions
  ALTER COLUMN owner_id SET NOT NULL,
  ALTER COLUMN owner_id SET DEFAULT NULL;

-- =============================================
-- 3. UPDATE RLS POLICIES for owner_id
-- =============================================

-- Drop old update policy and recreate with owner
DROP POLICY IF EXISTS "Creators and assignees can update" ON public.decisions;

CREATE POLICY "Owners and assignees can update"
  ON public.decisions FOR UPDATE
  USING (
    (auth.uid() = owner_id)
    OR (auth.uid() = assignee_id)
    OR is_org_admin_or_owner(auth.uid())
  );

-- Update the SELECT policy for deleted decisions to include owner
DROP POLICY IF EXISTS "Creators and admins can view deleted decisions" ON public.decisions;

CREATE POLICY "Owners and admins can view deleted decisions"
  ON public.decisions FOR SELECT
  USING (
    (deleted_at IS NOT NULL)
    AND (
      (owner_id = auth.uid())
      OR (created_by = auth.uid())
      OR is_org_admin_or_owner(auth.uid())
    )
  );

-- Update the main SELECT policy to include owner
DROP POLICY IF EXISTS "Team-based decision visibility" ON public.decisions;

CREATE POLICY "Team-based decision visibility"
  ON public.decisions FOR SELECT
  USING (
    (auth.uid() IS NOT NULL)
    AND (deleted_at IS NULL)
    AND (
      (
        (NOT confidential)
        AND (
          (team_id IS NULL)
          OR (created_by = auth.uid())
          OR (owner_id = auth.uid())
          OR (assignee_id = auth.uid())
          OR (EXISTS (SELECT 1 FROM team_members WHERE team_members.team_id = decisions.team_id AND team_members.user_id = auth.uid()))
          OR (EXISTS (SELECT 1 FROM decision_shares WHERE decision_shares.decision_id = decisions.id AND (EXISTS (SELECT 1 FROM team_members WHERE team_members.team_id = decision_shares.team_id AND team_members.user_id = auth.uid()))))
          OR is_org_admin_or_owner(auth.uid())
        )
      )
      OR (
        confidential
        AND (
          (created_by = auth.uid())
          OR (owner_id = auth.uid())
          OR (assignee_id = auth.uid())
          OR (EXISTS (SELECT 1 FROM decision_reviews WHERE decision_reviews.decision_id = decisions.id AND decision_reviews.reviewer_id = auth.uid()))
          OR is_org_admin_or_owner(auth.uid())
        )
      )
    )
  );

-- Update INSERT policy: owner_id must match auth.uid() on create
DROP POLICY IF EXISTS "Users can create decisions" ON public.decisions;

CREATE POLICY "Users can create decisions"
  ON public.decisions FOR INSERT
  WITH CHECK (
    (auth.uid() = created_by)
    AND (auth.uid() = owner_id)
  );
