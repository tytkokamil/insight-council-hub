
-- Team cost config for Decision Cost Calculator
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS hourly_rate numeric DEFAULT 75;

-- Stakeholder Alignment Map
CREATE TABLE public.stakeholder_positions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  decision_id uuid NOT NULL REFERENCES public.decisions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  position text NOT NULL CHECK (position IN ('for', 'against', 'neutral')),
  concerns text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(decision_id, user_id)
);

ALTER TABLE public.stakeholder_positions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view positions"
ON public.stakeholder_positions FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert own position"
ON public.stakeholder_positions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own position"
ON public.stakeholder_positions FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own position"
ON public.stakeholder_positions FOR DELETE
USING (auth.uid() = user_id);

-- What-If Simulator scenarios
CREATE TABLE public.decision_scenarios (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  decision_id uuid NOT NULL REFERENCES public.decisions(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  probability integer DEFAULT 50,
  impact text,
  outcome_if_positive text,
  outcome_if_negative text,
  ai_analysis jsonb,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.decision_scenarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view scenarios"
ON public.decision_scenarios FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create scenarios"
ON public.decision_scenarios FOR INSERT
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Creators can update scenarios"
ON public.decision_scenarios FOR UPDATE
USING (auth.uid() = created_by);

CREATE POLICY "Creators can delete scenarios"
ON public.decision_scenarios FOR DELETE
USING (auth.uid() = created_by);

-- CEO Morning Brief storage
CREATE TABLE public.briefings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  content jsonb NOT NULL,
  generated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.briefings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own briefings"
ON public.briefings FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can create briefings"
ON public.briefings FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);
