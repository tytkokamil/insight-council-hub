
-- Tags table for reusable tags
CREATE TABLE public.tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL DEFAULT '#6366f1',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view tags" ON public.tags
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create tags" ON public.tags
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Junction table for decision-tag relationships
CREATE TABLE public.decision_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  decision_id UUID NOT NULL REFERENCES public.decisions(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(decision_id, tag_id)
);

ALTER TABLE public.decision_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view decision tags" ON public.decision_tags
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can tag decisions" ON public.decision_tags
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Tag creators can remove tags" ON public.decision_tags
  FOR DELETE USING (auth.uid() = created_by);

-- Lessons learned table for storing insights from completed decisions
CREATE TABLE public.lessons_learned (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  decision_id UUID NOT NULL REFERENCES public.decisions(id) ON DELETE CASCADE,
  what_went_well TEXT,
  what_went_wrong TEXT,
  key_takeaway TEXT NOT NULL,
  recommendations TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.lessons_learned ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view lessons" ON public.lessons_learned
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create lessons" ON public.lessons_learned
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Creators can update lessons" ON public.lessons_learned
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Creators can delete lessons" ON public.lessons_learned
  FOR DELETE USING (auth.uid() = created_by);

CREATE TRIGGER update_lessons_learned_updated_at
  BEFORE UPDATE ON public.lessons_learned
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
