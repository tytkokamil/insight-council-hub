
-- Strategic Goals table (OKRs, Revenue targets, KPIs)
CREATE TABLE public.strategic_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  goal_type TEXT NOT NULL DEFAULT 'okr' CHECK (goal_type IN ('okr', 'revenue', 'kpi', 'quarterly')),
  target_value NUMERIC,
  current_value NUMERIC DEFAULT 0,
  unit TEXT DEFAULT '%',
  quarter TEXT,
  year INTEGER DEFAULT EXTRACT(YEAR FROM now()),
  owner_id UUID,
  team_id UUID REFERENCES public.teams(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'achieved', 'at_risk', 'missed')),
  due_date DATE,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Decision-Goal Links (many-to-many)
CREATE TABLE public.decision_goal_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  decision_id UUID NOT NULL REFERENCES public.decisions(id) ON DELETE CASCADE,
  goal_id UUID NOT NULL REFERENCES public.strategic_goals(id) ON DELETE CASCADE,
  impact_weight INTEGER DEFAULT 50 CHECK (impact_weight BETWEEN 0 AND 100),
  linked_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(decision_id, goal_id)
);

-- Enable RLS
ALTER TABLE public.strategic_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decision_goal_links ENABLE ROW LEVEL SECURITY;

-- RLS Policies for strategic_goals
CREATE POLICY "Authenticated users can view goals"
  ON public.strategic_goals FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create goals"
  ON public.strategic_goals FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Creators and admins can update goals"
  ON public.strategic_goals FOR UPDATE
  USING (auth.uid() = created_by OR has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Creators and admins can delete goals"
  ON public.strategic_goals FOR DELETE
  USING (auth.uid() = created_by OR has_role(auth.uid(), 'admin'::user_role));

-- RLS Policies for decision_goal_links
CREATE POLICY "Authenticated users can view links"
  ON public.decision_goal_links FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create links"
  ON public.decision_goal_links FOR INSERT
  WITH CHECK (auth.uid() = linked_by);

CREATE POLICY "Linkers and admins can delete links"
  ON public.decision_goal_links FOR DELETE
  USING (auth.uid() = linked_by OR has_role(auth.uid(), 'admin'::user_role));

-- Triggers for updated_at
CREATE TRIGGER update_strategic_goals_updated_at
  BEFORE UPDATE ON public.strategic_goals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
