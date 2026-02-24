
-- 1. Create organizations table (without RLS policies that reference org_id on other tables)
CREATE TABLE public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  plan text NOT NULL DEFAULT 'starter',
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- 2. Add org_id to core tables
ALTER TABLE public.profiles ADD COLUMN org_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL;
ALTER TABLE public.teams ADD COLUMN org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.decisions ADD COLUMN org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.tasks ADD COLUMN org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.risks ADD COLUMN org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.automation_rules ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.audit_logs ADD COLUMN org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.notifications ADD COLUMN org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.decision_templates ADD COLUMN org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.strategic_goals ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;

-- 3. Add missing fields to decisions per spec
ALTER TABLE public.decisions ADD COLUMN cost_per_day numeric DEFAULT 0;
ALTER TABLE public.decisions ADD COLUMN health_score integer DEFAULT NULL;
ALTER TABLE public.decisions ADD COLUMN ai_analysis_cache jsonb DEFAULT NULL;

-- 4. Indexes
CREATE INDEX idx_profiles_org_id ON public.profiles(org_id);
CREATE INDEX idx_teams_org_id ON public.teams(org_id);
CREATE INDEX idx_decisions_org_id ON public.decisions(org_id);
CREATE INDEX idx_tasks_org_id ON public.tasks(org_id);
CREATE INDEX idx_risks_org_id ON public.risks(org_id);

-- 5. Updated_at trigger for organizations
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. Helper function
CREATE OR REPLACE FUNCTION public.get_user_org_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT org_id FROM public.profiles WHERE user_id = _user_id LIMIT 1
$$;

-- 7. RLS for organizations (now that org_id exists on profiles)
CREATE POLICY "Members can view own org"
  ON public.organizations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.org_id = organizations.id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Org admins can update org"
  ON public.organizations FOR UPDATE
  USING (is_org_admin_or_owner(auth.uid()) AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.org_id = organizations.id AND p.user_id = auth.uid()
  ));

-- 8. Update handle_new_user to create org for first user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  user_count INTEGER;
  assigned_role public.org_role;
  new_org_id UUID;
BEGIN
  SELECT COUNT(*) INTO user_count FROM public.user_roles;
  IF user_count = 0 THEN
    assigned_role := 'org_owner';
    INSERT INTO public.organizations (name, slug)
    VALUES (
      COALESCE(split_part(NEW.email, '@', 2), 'My Organization'),
      replace(split_part(NEW.email, '@', 2), '.', '-') || '-' || substr(gen_random_uuid()::text, 1, 8)
    )
    RETURNING id INTO new_org_id;
  ELSE
    assigned_role := 'org_member';
  END IF;
  INSERT INTO public.profiles (user_id, full_name, org_id)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), new_org_id);
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, assigned_role);
  RETURN NEW;
END;
$function$;
