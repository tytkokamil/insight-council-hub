
-- Team defaults table for smart defaults per team
CREATE TABLE public.team_defaults (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  default_category TEXT NOT NULL DEFAULT 'operational',
  default_priority TEXT NOT NULL DEFAULT 'medium',
  default_review_flow TEXT NOT NULL DEFAULT 'standard',
  default_sla_days INTEGER NOT NULL DEFAULT 7,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_team_defaults UNIQUE (team_id)
);

-- Enable RLS
ALTER TABLE public.team_defaults ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Team members can view defaults"
ON public.team_defaults FOR SELECT
USING (auth.uid() IS NOT NULL AND (
  EXISTS (SELECT 1 FROM team_members WHERE team_members.team_id = team_defaults.team_id AND team_members.user_id = auth.uid())
  OR is_org_admin_or_owner(auth.uid())
));

CREATE POLICY "Team leads and admins can manage defaults"
ON public.team_defaults FOR INSERT
WITH CHECK (is_team_lead_or_admin(auth.uid(), team_id));

CREATE POLICY "Team leads and admins can update defaults"
ON public.team_defaults FOR UPDATE
USING (is_team_lead_or_admin(auth.uid(), team_id));

CREATE POLICY "Team leads and admins can delete defaults"
ON public.team_defaults FOR DELETE
USING (is_team_lead_or_admin(auth.uid(), team_id));

-- Updated_at trigger
CREATE TRIGGER update_team_defaults_updated_at
BEFORE UPDATE ON public.team_defaults
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
