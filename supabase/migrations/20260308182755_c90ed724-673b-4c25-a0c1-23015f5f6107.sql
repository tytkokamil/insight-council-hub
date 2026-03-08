
CREATE TABLE public.sso_configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  provider_name text NOT NULL,
  entity_id text NOT NULL,
  sso_url text NOT NULL,
  certificate text NOT NULL,
  attribute_mapping jsonb DEFAULT '{"email": "email", "firstName": "given_name", "lastName": "family_name"}'::jsonb,
  is_active boolean DEFAULT false,
  domain_hint text,
  test_passed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(org_id)
);

ALTER TABLE public.sso_configurations ENABLE ROW LEVEL SECURITY;

-- org_owner can read/write their own org's SSO config
CREATE POLICY "org_owner_manage_sso" ON public.sso_configurations
  FOR ALL USING (
    public.has_role(auth.uid(), 'org_owner') 
    AND org_id = public.get_user_org_id(auth.uid())
  );

-- org_admin can read SSO config
CREATE POLICY "org_admin_read_sso" ON public.sso_configurations
  FOR SELECT USING (
    public.is_org_admin_or_owner(auth.uid())
    AND org_id = public.get_user_org_id(auth.uid())
  );

-- platform_admin can manage all
CREATE POLICY "platform_admin_manage_sso" ON public.sso_configurations
  FOR ALL USING (public.is_platform_admin(auth.uid()));

-- Service role needs access for SSO callback (no RLS bypass needed for service role)

-- Allow public domain lookup for SSO login flow (only domain_hint and is_active)
CREATE OR REPLACE FUNCTION public.get_sso_config_by_domain(_domain text)
RETURNS TABLE(org_id uuid, provider_name text, sso_url text, entity_id text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT sc.org_id, sc.provider_name, sc.sso_url, sc.entity_id
  FROM public.sso_configurations sc
  WHERE sc.domain_hint = _domain
    AND sc.is_active = true
  LIMIT 1;
$$;
