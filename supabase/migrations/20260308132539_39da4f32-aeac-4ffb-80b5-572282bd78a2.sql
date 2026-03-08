
-- Prompt 12: Decision Velocity Score RPC
CREATE OR REPLACE FUNCTION public.get_velocity_score(_org_id UUID DEFAULT NULL, _user_id UUID DEFAULT NULL)
RETURNS TABLE(score INTEGER, grade TEXT, percentile INTEGER, avg_days NUMERIC, industry_avg_days NUMERIC)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE
  _avg NUMERIC;
  _score INTEGER;
  _grade TEXT;
  _percentile INTEGER;
BEGIN
  -- Calculate average days to implement decisions in last 90 days
  SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (d.implemented_at - d.created_at)) / 86400), 0)
  INTO _avg
  FROM decisions d
  WHERE d.status = 'implemented'
    AND d.implemented_at IS NOT NULL
    AND d.created_at > NOW() - INTERVAL '90 days'
    AND d.deleted_at IS NULL
    AND (
      (_org_id IS NOT NULL AND d.org_id = _org_id)
      OR (_user_id IS NOT NULL AND (d.created_by = _user_id OR d.owner_id = _user_id))
    );

  -- Score calculation
  _score := CASE
    WHEN _avg <= 1 THEN 100
    WHEN _avg <= 3 THEN 90
    WHEN _avg <= 5 THEN 75
    WHEN _avg <= 7 THEN 60
    WHEN _avg <= 10 THEN 45
    WHEN _avg <= 14 THEN 30
    ELSE 15
  END;

  -- Grade
  _grade := CASE
    WHEN _score >= 90 THEN 'Blitzschnell'
    WHEN _score >= 75 THEN 'Sehr schnell'
    WHEN _score >= 60 THEN 'Gut'
    WHEN _score >= 45 THEN 'Durchschnittlich'
    WHEN _score >= 30 THEN 'Träge'
    ELSE 'Kritisch langsam'
  END;

  -- Simplified percentile
  _percentile := LEAST(99, GREATEST(1, ROUND(100 - (_avg / 0.2))::INTEGER));

  RETURN QUERY SELECT _score, _grade, _percentile, ROUND(_avg, 1), 8.7::NUMERIC;
END;
$$;
