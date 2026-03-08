
-- Step 1: Update existing data
UPDATE organizations SET plan = 'professional' WHERE plan = 'pro';

-- Step 2: Drop old check constraint if exists (safe approach)
DO $$
BEGIN
  -- Try dropping known constraint names
  BEGIN
    ALTER TABLE organizations DROP CONSTRAINT IF EXISTS organizations_plan_check;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
END $$;

-- Step 3: Add new check constraint
ALTER TABLE organizations ADD CONSTRAINT organizations_plan_check 
  CHECK (plan IN ('free', 'starter', 'professional', 'enterprise'));

-- Step 4: Update DB functions that reference 'pro'

CREATE OR REPLACE FUNCTION public.get_plan_max_users(_plan text)
 RETURNS integer
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
  SELECT CASE _plan
    WHEN 'free' THEN 1
    WHEN 'starter' THEN 8
    WHEN 'professional' THEN 25
    WHEN 'enterprise' THEN 999999
    ELSE 1
  END
$function$;

CREATE OR REPLACE FUNCTION public.get_plan_max_decisions(_plan text)
 RETURNS integer
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
  SELECT CASE _plan
    WHEN 'free' THEN 10
    WHEN 'starter' THEN 999999
    WHEN 'professional' THEN 999999
    WHEN 'enterprise' THEN 999999
    ELSE 10
  END
$function$;

CREATE OR REPLACE FUNCTION public.is_feature_allowed(_plan text, _feature text)
 RETURNS boolean
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
  SELECT CASE _feature
    WHEN 'ai_analysis' THEN _plan IN ('professional', 'enterprise')
    WHEN 'ai_brief' THEN _plan IN ('professional', 'enterprise')
    WHEN 'analytics' THEN _plan IN ('professional', 'enterprise')
    WHEN 'executive' THEN _plan IN ('professional', 'enterprise')
    WHEN 'strategy' THEN _plan IN ('professional', 'enterprise')
    WHEN 'webhooks' THEN _plan IN ('professional', 'enterprise')
    WHEN 'live_cod' THEN _plan IN ('professional', 'enterprise')
    WHEN 'crypto_audit' THEN _plan IN ('professional', 'enterprise')
    WHEN 'sso' THEN _plan = 'enterprise'
    WHEN 'custom_branding' THEN _plan = 'enterprise'
    WHEN 'teams' THEN _plan IN ('starter', 'professional', 'enterprise')
    WHEN 'sla' THEN _plan IN ('starter', 'professional', 'enterprise')
    WHEN 'automations' THEN _plan IN ('starter', 'professional', 'enterprise')
    ELSE true
  END
$function$;

CREATE OR REPLACE FUNCTION public.check_plan_limit(_user_id uuid, _limit_type text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _plan text;
  _org_id uuid;
  _count integer;
  _max integer;
  _allowed boolean;
BEGIN
  SELECT org_id INTO _org_id FROM profiles WHERE user_id = _user_id LIMIT 1;
  
  IF _org_id IS NOT NULL THEN
    SELECT COALESCE(plan, 'free') INTO _plan FROM organizations WHERE id = _org_id;
  ELSE
    _plan := 'free';
  END IF;

  IF _limit_type = 'decisions' THEN
    SELECT count(*) INTO _count FROM decisions WHERE created_by = _user_id AND deleted_at IS NULL;
    _max := CASE _plan
      WHEN 'free' THEN 10
      WHEN 'starter' THEN NULL
      WHEN 'professional' THEN NULL
      WHEN 'enterprise' THEN NULL
      ELSE 10
    END;
    _allowed := _max IS NULL OR _count < _max;
  ELSIF _limit_type = 'teams' THEN
    SELECT count(*) INTO _count FROM team_members WHERE user_id = _user_id;
    _max := CASE _plan
      WHEN 'free' THEN 1
      WHEN 'starter' THEN 3
      ELSE NULL
    END;
    _allowed := _max IS NULL OR _count < _max;
  ELSIF _limit_type = 'automations' THEN
    SELECT count(*) INTO _count FROM automation_rules WHERE created_by = _user_id;
    _max := CASE _plan
      WHEN 'free' THEN 0
      WHEN 'starter' THEN 5
      ELSE NULL
    END;
    _allowed := _max IS NULL OR _count < _max;
  ELSE
    _allowed := true;
    _count := 0;
    _max := NULL;
  END IF;

  RETURN jsonb_build_object(
    'plan', _plan,
    'limit_type', _limit_type,
    'current_count', _count,
    'max_allowed', _max,
    'allowed', _allowed
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_org_plan(_org_id uuid)
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT COALESCE(
    CASE 
      WHEN subscription_status = 'trialing' THEN 'professional'
      WHEN subscription_status = 'suspended' THEN 'free'
      ELSE COALESCE(plan, 'free')
    END,
    'free'
  )
  FROM public.organizations
  WHERE id = _org_id
$function$;
