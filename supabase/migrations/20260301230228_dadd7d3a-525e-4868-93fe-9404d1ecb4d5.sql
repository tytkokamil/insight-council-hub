
-- daily_briefs table: stores org-level AI generated daily briefs
CREATE TABLE public.daily_briefs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  brief_date date NOT NULL DEFAULT CURRENT_DATE,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  momentum_score integer NOT NULL DEFAULT 0,
  momentum_breakdown jsonb DEFAULT NULL,
  stats jsonb DEFAULT NULL,
  cost_summary jsonb DEFAULT NULL,
  generated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(org_id, brief_date)
);

-- RLS
ALTER TABLE public.daily_briefs ENABLE ROW LEVEL SECURITY;

-- Users can read their org's briefs
CREATE POLICY "Users can read own org daily briefs"
  ON public.daily_briefs FOR SELECT
  USING (org_id = public.get_user_org_id(auth.uid()));

-- Service role inserts (edge function)
CREATE POLICY "Service role can insert daily briefs"
  ON public.daily_briefs FOR INSERT
  WITH CHECK (true);

-- Index for fast lookup
CREATE INDEX idx_daily_briefs_org_date ON public.daily_briefs(org_id, brief_date DESC);
