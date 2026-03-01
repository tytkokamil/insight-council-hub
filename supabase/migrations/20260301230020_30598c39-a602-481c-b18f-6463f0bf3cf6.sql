
CREATE OR REPLACE FUNCTION public.check_plan_limit(_user_id uuid, _limit_type text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _plan text;
  _org_id uuid;
  _count integer;
  _max integer;
  _allowed boolean;
BEGIN
  -- Get user org
  SELECT org_id INTO _org_id FROM profiles WHERE user_id = _user_id LIMIT 1;
  
  -- Get plan
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
      WHEN 'pro' THEN NULL
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
$$;
