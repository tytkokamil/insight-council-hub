
-- ============================================================
-- COMPLETE ROLE SYSTEM OVERHAUL (fixed)
-- ============================================================

-- 1. Create new org_role enum
CREATE TYPE public.org_role AS ENUM ('org_owner', 'org_admin', 'org_member');

-- 2. Add 'admin' to team_role enum
ALTER TYPE public.team_role ADD VALUE IF NOT EXISTS 'admin';

-- 3. Drop policies that depend on is_team_lead_or_admin
DROP POLICY IF EXISTS "Leads can delete team members" ON public.team_members;
DROP POLICY IF EXISTS "Leads can insert team members" ON public.team_members;
DROP POLICY IF EXISTS "Leads can update team members" ON public.team_members;

-- 4. Drop ALL policies that reference has_role or user_role
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage teams" ON public.teams;
DROP POLICY IF EXISTS "Admins can manage team members" ON public.team_members;
DROP POLICY IF EXISTS "Admins can manage SLA configs" ON public.sla_configs;
DROP POLICY IF EXISTS "Admins can update feature flags" ON public.feature_flags;
DROP POLICY IF EXISTS "Creators can delete dependencies" ON public.decision_dependencies;
DROP POLICY IF EXISTS "Owners can create dependencies" ON public.decision_dependencies;
DROP POLICY IF EXISTS "Team-based decision visibility" ON public.decisions;
DROP POLICY IF EXISTS "Team-based task visibility" ON public.tasks;
DROP POLICY IF EXISTS "Creators and admins can delete goals" ON public.strategic_goals;
DROP POLICY IF EXISTS "Creators and admins can update goals" ON public.strategic_goals;
DROP POLICY IF EXISTS "Inviter or admin can delete invitations" ON public.team_invitations;
DROP POLICY IF EXISTS "Inviter or admin can update invitations" ON public.team_invitations;
DROP POLICY IF EXISTS "Team members can create invitations" ON public.team_invitations;
DROP POLICY IF EXISTS "Team members can view invitations" ON public.team_invitations;
DROP POLICY IF EXISTS "Team members can send messages" ON public.team_messages;
DROP POLICY IF EXISTS "Team members can view messages" ON public.team_messages;
DROP POLICY IF EXISTS "Linkers and admins can delete links" ON public.decision_goal_links;

-- 5. Drop dependent functions
DROP FUNCTION IF EXISTS public.is_team_lead_or_admin(uuid, uuid);
DROP FUNCTION IF EXISTS public.has_role(uuid, public.user_role);

-- 6. Convert user_roles.role column from user_role to org_role
ALTER TABLE public.user_roles ALTER COLUMN role DROP DEFAULT;
ALTER TABLE public.user_roles 
  ALTER COLUMN role TYPE public.org_role 
  USING CASE role::text
    WHEN 'admin' THEN 'org_owner'::public.org_role
    WHEN 'decision_maker' THEN 'org_member'::public.org_role
    WHEN 'reviewer' THEN 'org_member'::public.org_role
    WHEN 'observer' THEN 'org_member'::public.org_role
    ELSE 'org_member'::public.org_role
  END;
ALTER TABLE public.user_roles ALTER COLUMN role SET DEFAULT 'org_member'::public.org_role;

-- 7. Drop old enum
DROP TYPE IF EXISTS public.user_role;

-- 8. Create new helper functions
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.org_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

CREATE OR REPLACE FUNCTION public.is_org_admin_or_owner(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('org_owner', 'org_admin')) $$;

-- Use text cast to avoid "unsafe use of new enum value" error
CREATE OR REPLACE FUNCTION public.is_team_lead_or_admin(_user_id uuid, _team_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ 
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE user_id = _user_id AND team_id = _team_id AND role::text IN ('lead', 'admin')
  ) OR public.is_org_admin_or_owner(_user_id)
$$;

-- 9. Update handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  user_count INTEGER;
  assigned_role public.org_role;
BEGIN
  SELECT COUNT(*) INTO user_count FROM public.user_roles;
  IF user_count = 0 THEN
    assigned_role := 'org_owner';
  ELSE
    assigned_role := 'org_member';
  END IF;
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, assigned_role);
  RETURN NEW;
END;
$function$;

-- 10. Recreate ALL policies

-- user_roles
CREATE POLICY "Org owners and admins can manage roles"
ON public.user_roles FOR ALL USING (public.is_org_admin_or_owner(auth.uid()));

-- teams
CREATE POLICY "Org owners and admins can manage teams"
ON public.teams FOR ALL USING (public.is_org_admin_or_owner(auth.uid()));

-- team_members
CREATE POLICY "Org admins can manage team members"
ON public.team_members FOR ALL USING (public.is_org_admin_or_owner(auth.uid()));

CREATE POLICY "Team admins and leads can manage members"
ON public.team_members FOR DELETE USING (public.is_team_lead_or_admin(auth.uid(), team_id));

CREATE POLICY "Team admins and leads can insert members"
ON public.team_members FOR INSERT WITH CHECK (public.is_team_lead_or_admin(auth.uid(), team_id));

CREATE POLICY "Team admins and leads can update members"
ON public.team_members FOR UPDATE USING (public.is_team_lead_or_admin(auth.uid(), team_id));

-- sla_configs
CREATE POLICY "Org admins can manage SLA configs"
ON public.sla_configs FOR ALL USING (public.is_org_admin_or_owner(auth.uid()));

-- feature_flags
CREATE POLICY "Org admins can update feature flags"
ON public.feature_flags FOR UPDATE USING (public.is_org_admin_or_owner(auth.uid()));

-- decision_dependencies
CREATE POLICY "Creators and admins can delete dependencies"
ON public.decision_dependencies FOR DELETE
USING ((auth.uid() = created_by) OR public.is_org_admin_or_owner(auth.uid()));

CREATE POLICY "Owners can create dependencies"
ON public.decision_dependencies FOR INSERT
WITH CHECK ((auth.uid() = created_by) AND (
  ((source_decision_id IS NOT NULL) AND EXISTS (
    SELECT 1 FROM decisions WHERE decisions.id = decision_dependencies.source_decision_id
    AND (decisions.created_by = auth.uid() OR decisions.assignee_id = auth.uid())
  ))
  OR ((source_task_id IS NOT NULL) AND EXISTS (
    SELECT 1 FROM tasks WHERE tasks.id = decision_dependencies.source_task_id
    AND (tasks.created_by = auth.uid() OR tasks.assignee_id = auth.uid())
  ))
  OR public.is_org_admin_or_owner(auth.uid())
));

-- decisions
CREATE POLICY "Team-based decision visibility"
ON public.decisions FOR SELECT
USING (auth.uid() IS NOT NULL AND (
  team_id IS NULL OR created_by = auth.uid() OR assignee_id = auth.uid()
  OR EXISTS (SELECT 1 FROM team_members WHERE team_members.team_id = decisions.team_id AND team_members.user_id = auth.uid())
  OR public.is_org_admin_or_owner(auth.uid())
));

-- tasks
CREATE POLICY "Team-based task visibility"
ON public.tasks FOR SELECT
USING (auth.uid() IS NOT NULL AND (
  team_id IS NULL OR created_by = auth.uid() OR assignee_id = auth.uid()
  OR EXISTS (SELECT 1 FROM team_members WHERE team_members.team_id = tasks.team_id AND team_members.user_id = auth.uid())
  OR public.is_org_admin_or_owner(auth.uid())
));

-- strategic_goals
CREATE POLICY "Creators and admins can delete goals"
ON public.strategic_goals FOR DELETE
USING ((auth.uid() = created_by) OR public.is_org_admin_or_owner(auth.uid()));

CREATE POLICY "Creators and admins can update goals"
ON public.strategic_goals FOR UPDATE
USING ((auth.uid() = created_by) OR public.is_org_admin_or_owner(auth.uid()));

-- team_invitations
CREATE POLICY "Inviter or admin can delete invitations"
ON public.team_invitations FOR DELETE
USING ((auth.uid() = invited_by) OR public.is_org_admin_or_owner(auth.uid()));

CREATE POLICY "Inviter or admin can update invitations"
ON public.team_invitations FOR UPDATE
USING ((auth.uid() = invited_by) OR public.is_org_admin_or_owner(auth.uid()));

CREATE POLICY "Team members can create invitations"
ON public.team_invitations FOR INSERT
WITH CHECK ((auth.uid() = invited_by) AND (
  EXISTS (SELECT 1 FROM team_members WHERE team_members.team_id = team_invitations.team_id AND team_members.user_id = auth.uid())
  OR public.is_org_admin_or_owner(auth.uid())
));

CREATE POLICY "Team members can view invitations"
ON public.team_invitations FOR SELECT
USING (auth.uid() IS NOT NULL AND (
  invited_by = auth.uid()
  OR EXISTS (SELECT 1 FROM team_members WHERE team_members.team_id = team_invitations.team_id AND team_members.user_id = auth.uid())
  OR public.is_org_admin_or_owner(auth.uid())
));

-- team_messages
CREATE POLICY "Team members can send messages"
ON public.team_messages FOR INSERT
WITH CHECK ((auth.uid() = user_id) AND (
  EXISTS (SELECT 1 FROM team_members WHERE team_members.team_id = team_messages.team_id AND team_members.user_id = auth.uid())
  OR public.is_org_admin_or_owner(auth.uid())
));

CREATE POLICY "Team members can view messages"
ON public.team_messages FOR SELECT
USING (auth.uid() IS NOT NULL AND (
  EXISTS (SELECT 1 FROM team_members WHERE team_members.team_id = team_messages.team_id AND team_members.user_id = auth.uid())
  OR public.is_org_admin_or_owner(auth.uid())
));

-- decision_goal_links
CREATE POLICY "Linkers and admins can delete links"
ON public.decision_goal_links FOR DELETE
USING ((auth.uid() = linked_by) OR public.is_org_admin_or_owner(auth.uid()));
