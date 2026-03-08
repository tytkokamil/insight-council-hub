
-- Add trial management columns to organizations
ALTER TABLE public.organizations 
  ADD COLUMN IF NOT EXISTS subscription_status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS trial_reminder_sent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS trial_final_reminder_sent boolean NOT NULL DEFAULT false;

-- Update handle_new_user to set trial on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  user_count INTEGER;
  assigned_role public.org_role;
  new_org_id UUID;
BEGIN
  SELECT COUNT(*) INTO user_count FROM public.user_roles;
  IF user_count = 0 THEN
    assigned_role := 'org_owner';
    INSERT INTO public.organizations (name, slug, trial_ends_at, subscription_status, plan)
    VALUES (
      COALESCE(split_part(NEW.email, '@', 2), 'My Organization'),
      replace(split_part(NEW.email, '@', 2), '.', '-') || '-' || substr(gen_random_uuid()::text, 1, 8),
      now() + interval '14 days',
      'trialing',
      'free'
    )
    RETURNING id INTO new_org_id;
  ELSE
    assigned_role := 'org_member';
  END IF;
  INSERT INTO public.profiles (user_id, full_name, org_id)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), new_org_id);
  INSERT INTO public.user_roles (user_id, role, org_id)
  VALUES (NEW.id, assigned_role, new_org_id);
  RETURN NEW;
END;
$function$;
