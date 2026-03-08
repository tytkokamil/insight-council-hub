
-- Server-side function to get org plan (for use in RLS and edge functions)
CREATE OR REPLACE FUNCTION public.get_org_plan(_org_id uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    CASE 
      WHEN subscription_status = 'trialing' THEN 'pro'
      WHEN subscription_status = 'suspended' THEN 'free'
      ELSE COALESCE(plan, 'free')
    END,
    'free'
  )
  FROM public.organizations
  WHERE id = _org_id
$$;

-- Server-side function to get max users for a plan
CREATE OR REPLACE FUNCTION public.get_plan_max_users(_plan text)
RETURNS integer
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE _plan
    WHEN 'free' THEN 1
    WHEN 'starter' THEN 8
    WHEN 'pro' THEN 25
    WHEN 'enterprise' THEN 999999
    ELSE 1
  END
$$;

-- Server-side function to get max decisions for a plan
CREATE OR REPLACE FUNCTION public.get_plan_max_decisions(_plan text)
RETURNS integer
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE _plan
    WHEN 'free' THEN 10
    WHEN 'starter' THEN 999999
    WHEN 'pro' THEN 999999
    WHEN 'enterprise' THEN 999999
    ELSE 10
  END
$$;

-- Server-side function to check if a feature is allowed for a plan
CREATE OR REPLACE FUNCTION public.is_feature_allowed(_plan text, _feature text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE _feature
    WHEN 'ai_analysis' THEN _plan IN ('pro', 'enterprise')
    WHEN 'ai_brief' THEN _plan IN ('pro', 'enterprise')
    WHEN 'analytics' THEN _plan IN ('pro', 'enterprise')
    WHEN 'executive' THEN _plan IN ('pro', 'enterprise')
    WHEN 'strategy' THEN _plan IN ('pro', 'enterprise')
    WHEN 'webhooks' THEN _plan IN ('pro', 'enterprise')
    WHEN 'live_cod' THEN _plan IN ('pro', 'enterprise')
    WHEN 'crypto_audit' THEN _plan IN ('pro', 'enterprise')
    WHEN 'sso' THEN _plan = 'enterprise'
    WHEN 'custom_branding' THEN _plan = 'enterprise'
    WHEN 'teams' THEN _plan IN ('starter', 'pro', 'enterprise')
    WHEN 'sla' THEN _plan IN ('starter', 'pro', 'enterprise')
    WHEN 'automations' THEN _plan IN ('starter', 'pro', 'enterprise')
    ELSE true
  END
$$;

-- RLS: Enforce max users per plan on user_roles INSERT
CREATE POLICY "enforce_max_users_by_plan" ON public.user_roles
FOR INSERT TO authenticated
WITH CHECK (
  org_id IS NULL
  OR (
    (SELECT COUNT(*) FROM public.user_roles ur2 WHERE ur2.org_id = org_id)
    < public.get_plan_max_users(public.get_org_plan(org_id))
  )
);

-- RLS: Enforce max decisions per plan on decisions INSERT
CREATE POLICY "enforce_max_decisions_by_plan" ON public.decisions
FOR INSERT TO authenticated
WITH CHECK (
  (SELECT COUNT(*) FROM public.decisions d2 
   WHERE d2.org_id = org_id AND d2.deleted_at IS NULL)
  < public.get_plan_max_decisions(
    public.get_org_plan(COALESCE(org_id, public.get_user_org_id(auth.uid())))
  )
);
