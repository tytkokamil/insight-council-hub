-- Fix orphan: create org for user with NULL org_id, then add org_id to user_roles

-- Create a default org for the orphan user
DO $$
DECLARE
  orphan_uid uuid := 'b6ffc841-9389-4356-b1f4-dfd2a22a17ce';
  new_org_id uuid;
BEGIN
  INSERT INTO public.organizations (name, slug)
  VALUES ('Default Organization', 'default-org-' || substr(gen_random_uuid()::text, 1, 8))
  RETURNING id INTO new_org_id;

  UPDATE public.profiles SET org_id = new_org_id WHERE user_id = orphan_uid AND org_id IS NULL;
END $$;

-- 1. Add org_id column to user_roles
ALTER TABLE public.user_roles
  ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;

-- 2. Backfill org_id from profiles
UPDATE public.user_roles ur
SET org_id = p.org_id
FROM public.profiles p
WHERE p.user_id = ur.user_id
  AND ur.org_id IS NULL;

-- 3. Make org_id NOT NULL
ALTER TABLE public.user_roles
  ALTER COLUMN org_id SET NOT NULL;

-- 4. Drop old permissive SELECT policy
DROP POLICY IF EXISTS "Users can view all roles" ON public.user_roles;

-- 5. Create org-scoped SELECT policy
CREATE POLICY "Users can view own org roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (
    org_id = get_user_org_id(auth.uid())
    OR user_id = auth.uid()
  );

-- 6. Drop old ALL policy
DROP POLICY IF EXISTS "Org owners and admins can manage roles" ON public.user_roles;

-- 7. INSERT policy: org-scoped, no owner assignment via RLS
CREATE POLICY "Admins can insert roles in own org"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (
    is_org_admin_or_owner(auth.uid())
    AND org_id = get_user_org_id(auth.uid())
    AND role != 'org_owner'
  );

-- 8. UPDATE policy: org-scoped, prevent self-promotion to owner
CREATE POLICY "Admins can update roles in own org"
  ON public.user_roles FOR UPDATE
  TO authenticated
  USING (
    is_org_admin_or_owner(auth.uid())
    AND org_id = get_user_org_id(auth.uid())
  )
  WITH CHECK (
    is_org_admin_or_owner(auth.uid())
    AND org_id = get_user_org_id(auth.uid())
    AND role != 'org_owner'
  );

-- 9. DELETE policy: org-scoped, cannot delete owner role
CREATE POLICY "Admins can delete roles in own org"
  ON public.user_roles FOR DELETE
  TO authenticated
  USING (
    is_org_admin_or_owner(auth.uid())
    AND org_id = get_user_org_id(auth.uid())
    AND role != 'org_owner'
  );

-- 10. Update handle_new_user to populate org_id in user_roles
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
  INSERT INTO public.user_roles (user_id, role, org_id)
  VALUES (NEW.id, assigned_role, new_org_id);
  RETURN NEW;
END;
$function$;

-- 11. Update transfer_ownership to verify same org
CREATE OR REPLACE FUNCTION public.transfer_ownership(_current_owner_id uuid, _new_owner_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _current_owner_id AND role = 'org_owner'
  ) THEN
    RAISE EXCEPTION 'Only the current owner can transfer ownership';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE user_id = _new_owner_id
  ) THEN
    RAISE EXCEPTION 'Target user not found';
  END IF;
  IF _current_owner_id = _new_owner_id THEN
    RAISE EXCEPTION 'Cannot transfer ownership to yourself';
  END IF;
  IF (SELECT org_id FROM profiles WHERE user_id = _current_owner_id) 
     IS DISTINCT FROM (SELECT org_id FROM profiles WHERE user_id = _new_owner_id) THEN
    RAISE EXCEPTION 'Cannot transfer ownership to a user in a different organization';
  END IF;
  UPDATE public.user_roles SET role = 'org_owner' WHERE user_id = _new_owner_id;
  UPDATE public.user_roles SET role = 'org_admin' WHERE user_id = _current_owner_id;
END;
$function$;