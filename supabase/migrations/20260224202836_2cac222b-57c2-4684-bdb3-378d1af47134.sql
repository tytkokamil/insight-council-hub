
-- 1. Extend org_role enum with 3 new values
ALTER TYPE public.org_role ADD VALUE IF NOT EXISTS 'org_executive';
ALTER TYPE public.org_role ADD VALUE IF NOT EXISTS 'org_reviewer';
ALTER TYPE public.org_role ADD VALUE IF NOT EXISTS 'org_viewer';

-- 2. Add view_mode and decision_count to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS view_mode TEXT DEFAULT 'default';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS decision_count INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS progressive_override BOOLEAN DEFAULT false;

-- 3. Create get_org_role function
CREATE OR REPLACE FUNCTION public.get_org_role(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT role::text FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$$;

-- 4. Create has_min_role function (hierarchical role check)
CREATE OR REPLACE FUNCTION public.has_min_role(_user_id uuid, _min_role text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role::text = ANY(
        CASE _min_role
          WHEN 'org_viewer'    THEN ARRAY['org_viewer','org_reviewer','org_member','org_executive','org_admin','org_owner']
          WHEN 'org_reviewer'  THEN ARRAY['org_reviewer','org_member','org_executive','org_admin','org_owner']
          WHEN 'org_member'    THEN ARRAY['org_member','org_executive','org_admin','org_owner']
          WHEN 'org_executive' THEN ARRAY['org_executive','org_admin','org_owner']
          WHEN 'org_admin'     THEN ARRAY['org_admin','org_owner']
          WHEN 'org_owner'     THEN ARRAY['org_owner']
          ELSE ARRAY['org_owner']
        END
      )
  )
$$;

-- 5. Trigger to increment decision_count on profiles when a new decision is created
CREATE OR REPLACE FUNCTION public.increment_decision_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  UPDATE public.profiles
  SET decision_count = COALESCE(decision_count, 0) + 1
  WHERE user_id = NEW.created_by;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_increment_decision_count ON public.decisions;
CREATE TRIGGER trg_increment_decision_count
  AFTER INSERT ON public.decisions
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_decision_count();
