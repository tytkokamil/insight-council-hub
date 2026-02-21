
-- Create team_role enum
CREATE TYPE public.team_role AS ENUM ('lead', 'member', 'viewer');

-- Add role column to team_members with default 'member'
ALTER TABLE public.team_members
  ADD COLUMN role public.team_role NOT NULL DEFAULT 'member';

-- Set team creators as 'lead'
UPDATE public.team_members tm
SET role = 'lead'
FROM public.teams t
WHERE tm.team_id = t.id AND tm.user_id = t.created_by;

-- Helper function to check team role (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_team_role(_user_id uuid, _team_id uuid, _role team_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE user_id = _user_id
      AND team_id = _team_id
      AND role = _role
  )
$$;

-- Helper: check if user is lead or admin in a team
CREATE OR REPLACE FUNCTION public.is_team_lead_or_admin(_user_id uuid, _team_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE user_id = _user_id
      AND team_id = _team_id
      AND role = 'lead'
  ) OR public.has_role(_user_id, 'admin')
$$;

-- Allow leads (and admins) to update team_members (for role changes)
CREATE POLICY "Leads can update team members"
ON public.team_members
FOR UPDATE
USING (
  public.is_team_lead_or_admin(auth.uid(), team_id)
);

-- Allow leads to insert team members
CREATE POLICY "Leads can insert team members"
ON public.team_members
FOR INSERT
WITH CHECK (
  public.is_team_lead_or_admin(auth.uid(), team_id)
);

-- Allow leads to delete team members
CREATE POLICY "Leads can delete team members"
ON public.team_members
FOR DELETE
USING (
  public.is_team_lead_or_admin(auth.uid(), team_id)
);
