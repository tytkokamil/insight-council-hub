
-- Table for pending team invitations
CREATE TABLE public.team_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  invited_by UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(team_id, email)
);

ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;

-- Team members and admins can view invitations
CREATE POLICY "Team members can view invitations"
ON public.team_invitations FOR SELECT
USING (
  auth.uid() IS NOT NULL AND (
    invited_by = auth.uid()
    OR EXISTS (SELECT 1 FROM team_members WHERE team_members.team_id = team_invitations.team_id AND team_members.user_id = auth.uid())
    OR has_role(auth.uid(), 'admin'::user_role)
  )
);

-- Team members can create invitations
CREATE POLICY "Team members can create invitations"
ON public.team_invitations FOR INSERT
WITH CHECK (
  auth.uid() = invited_by AND (
    EXISTS (SELECT 1 FROM team_members WHERE team_members.team_id = team_invitations.team_id AND team_members.user_id = auth.uid())
    OR has_role(auth.uid(), 'admin'::user_role)
  )
);

-- Invited by user or admin can update
CREATE POLICY "Inviter or admin can update invitations"
ON public.team_invitations FOR UPDATE
USING (
  auth.uid() = invited_by OR has_role(auth.uid(), 'admin'::user_role)
);

-- Inviter or admin can delete
CREATE POLICY "Inviter or admin can delete invitations"
ON public.team_invitations FOR DELETE
USING (
  auth.uid() = invited_by OR has_role(auth.uid(), 'admin'::user_role)
);

-- Trigger: when a new user signs up, check if they have pending invitations and auto-accept
CREATE OR REPLACE FUNCTION public.handle_team_invitation_on_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Find all pending invitations for this email and add user to teams
  INSERT INTO public.team_members (team_id, user_id)
  SELECT ti.team_id, NEW.id
  FROM public.team_invitations ti
  WHERE ti.email = NEW.email AND ti.status = 'pending'
  ON CONFLICT DO NOTHING;

  -- Mark invitations as accepted
  UPDATE public.team_invitations
  SET status = 'accepted', accepted_at = now()
  WHERE email = NEW.email AND status = 'pending';

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_check_invitations
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_team_invitation_on_signup();
