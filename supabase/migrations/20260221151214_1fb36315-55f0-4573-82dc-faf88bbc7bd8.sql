
-- Risks table
CREATE TABLE public.risks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  likelihood INTEGER NOT NULL DEFAULT 3 CHECK (likelihood BETWEEN 1 AND 5),
  impact INTEGER NOT NULL DEFAULT 3 CHECK (impact BETWEEN 1 AND 5),
  risk_score INTEGER GENERATED ALWAYS AS (likelihood * impact) STORED,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'mitigating', 'mitigated', 'accepted', 'closed')),
  owner_id UUID,
  team_id UUID REFERENCES public.teams(id),
  mitigation_plan TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.risks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view risks" ON public.risks FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can create risks" ON public.risks FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Creators and owners can update risks" ON public.risks FOR UPDATE USING (auth.uid() = created_by OR auth.uid() = owner_id);
CREATE POLICY "Creators can delete risks" ON public.risks FOR DELETE USING (auth.uid() = created_by);

CREATE TRIGGER update_risks_updated_at BEFORE UPDATE ON public.risks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Risk-Decision links
CREATE TABLE public.risk_decision_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  risk_id UUID NOT NULL REFERENCES public.risks(id) ON DELETE CASCADE,
  decision_id UUID NOT NULL REFERENCES public.decisions(id) ON DELETE CASCADE,
  linked_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(risk_id, decision_id)
);

ALTER TABLE public.risk_decision_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view risk links" ON public.risk_decision_links FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can create risk links" ON public.risk_decision_links FOR INSERT WITH CHECK (auth.uid() = linked_by);
CREATE POLICY "Linkers can delete risk links" ON public.risk_decision_links FOR DELETE USING (auth.uid() = linked_by OR is_org_admin_or_owner(auth.uid()));

-- Risk-Task links (mitigation tasks)
CREATE TABLE public.risk_task_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  risk_id UUID NOT NULL REFERENCES public.risks(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  linked_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(risk_id, task_id)
);

ALTER TABLE public.risk_task_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view task links" ON public.risk_task_links FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can create task links" ON public.risk_task_links FOR INSERT WITH CHECK (auth.uid() = linked_by);
CREATE POLICY "Linkers can delete task links" ON public.risk_task_links FOR DELETE USING (auth.uid() = linked_by OR is_org_admin_or_owner(auth.uid()));
