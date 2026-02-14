
-- Decision dependencies: which decision blocks/influences which
CREATE TABLE public.decision_dependencies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_decision_id UUID NOT NULL REFERENCES public.decisions(id) ON DELETE CASCADE,
  target_decision_id UUID NOT NULL REFERENCES public.decisions(id) ON DELETE CASCADE,
  dependency_type TEXT NOT NULL DEFAULT 'blocks' CHECK (dependency_type IN ('blocks', 'influences', 'requires')),
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(source_decision_id, target_decision_id),
  CHECK (source_decision_id != target_decision_id)
);

ALTER TABLE public.decision_dependencies ENABLE ROW LEVEL SECURITY;

-- Authenticated users can view all dependencies
CREATE POLICY "Authenticated users can view dependencies"
ON public.decision_dependencies FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Users can create dependencies for decisions they own or are assigned to
CREATE POLICY "Decision owners can create dependencies"
ON public.decision_dependencies FOR INSERT
WITH CHECK (
  auth.uid() = created_by AND (
    EXISTS (SELECT 1 FROM decisions WHERE id = source_decision_id AND (created_by = auth.uid() OR assignee_id = auth.uid()))
    OR has_role(auth.uid(), 'admin'::user_role)
  )
);

-- Creators and admins can delete dependencies
CREATE POLICY "Creators can delete dependencies"
ON public.decision_dependencies FOR DELETE
USING (auth.uid() = created_by OR has_role(auth.uid(), 'admin'::user_role));
