
-- Enums
CREATE TYPE public.decision_status AS ENUM ('draft', 'review', 'approved', 'implemented', 'rejected');
CREATE TYPE public.decision_priority AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE public.decision_category AS ENUM ('strategic', 'budget', 'hr', 'technical', 'operational', 'marketing');
CREATE TYPE public.user_role AS ENUM ('admin', 'decision_maker', 'reviewer', 'observer');

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  role public.user_role NOT NULL DEFAULT 'observer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Teams
CREATE TABLE public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view teams" ON public.teams FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can manage teams" ON public.teams FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Team Members
CREATE TABLE public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(team_id, user_id)
);
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view team members" ON public.team_members FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can manage team members" ON public.team_members FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Decisions
CREATE TABLE public.decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  status public.decision_status NOT NULL DEFAULT 'draft',
  priority public.decision_priority NOT NULL DEFAULT 'medium',
  category public.decision_category NOT NULL DEFAULT 'operational',
  created_by UUID NOT NULL REFERENCES auth.users(id),
  assignee_id UUID REFERENCES auth.users(id),
  team_id UUID REFERENCES public.teams(id),
  due_date DATE,
  ai_risk_score INTEGER DEFAULT 0,
  ai_impact_score INTEGER DEFAULT 0,
  ai_risk_factors TEXT[],
  ai_success_factors TEXT[],
  context TEXT,
  options JSONB DEFAULT '[]'::jsonb,
  outcome TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.decisions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view decisions" ON public.decisions FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can create decisions" ON public.decisions FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Creators and assignees can update" ON public.decisions FOR UPDATE USING (auth.uid() = created_by OR auth.uid() = assignee_id);
CREATE POLICY "Creators can delete" ON public.decisions FOR DELETE USING (auth.uid() = created_by);

-- Decision Reviews
CREATE TABLE public.decision_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_id UUID NOT NULL REFERENCES public.decisions(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES auth.users(id),
  step_order INTEGER NOT NULL DEFAULT 1,
  status public.decision_status NOT NULL DEFAULT 'review',
  feedback TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.decision_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view reviews" ON public.decision_reviews FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Reviewers can update their reviews" ON public.decision_reviews FOR UPDATE USING (auth.uid() = reviewer_id);
CREATE POLICY "Decision creators can create reviews" ON public.decision_reviews FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.decisions WHERE id = decision_id AND created_by = auth.uid())
);

-- Comments
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_id UUID NOT NULL REFERENCES public.decisions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view comments" ON public.comments FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can create comments" ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own comments" ON public.comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON public.comments FOR DELETE USING (auth.uid() = user_id);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON public.teams FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_decisions_updated_at BEFORE UPDATE ON public.decisions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON public.comments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_count INTEGER;
  assigned_role public.user_role;
BEGIN
  SELECT COUNT(*) INTO user_count FROM public.profiles;
  IF user_count = 0 THEN
    assigned_role := 'admin';
  ELSE
    assigned_role := 'observer';
  END IF;
  INSERT INTO public.profiles (user_id, full_name, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), assigned_role);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
