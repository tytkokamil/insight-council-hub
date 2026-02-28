
-- 1. Rename enum value: org_reviewer → org_lead
ALTER TYPE public.org_role RENAME VALUE 'org_reviewer' TO 'org_lead';

-- 2. Update has_min_role to treat executive as parallel branch (read-only, not inheriting write permissions)
CREATE OR REPLACE FUNCTION public.has_min_role(_user_id uuid, _min_role text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role::text = ANY(
        CASE _min_role
          WHEN 'org_viewer'    THEN ARRAY['org_viewer','org_member','org_lead','org_executive','org_admin','org_owner']
          WHEN 'org_member'    THEN ARRAY['org_member','org_lead','org_admin','org_owner']
          WHEN 'org_lead'      THEN ARRAY['org_lead','org_admin','org_owner']
          WHEN 'org_executive' THEN ARRAY['org_executive','org_admin','org_owner']
          WHEN 'org_admin'     THEN ARRAY['org_admin','org_owner']
          WHEN 'org_owner'     THEN ARRAY['org_owner']
          ELSE ARRAY['org_owner']
        END
      )
  )
$$;

-- 3. Update comments RLS: change from org_reviewer to org_member (exec excluded from write)
DROP POLICY IF EXISTS "Reviewers can create comments" ON public.comments;
CREATE POLICY "Members can create comments" ON public.comments
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND public.has_min_role(auth.uid(), 'org_member')
  );

DROP POLICY IF EXISTS "Reviewers can update own comments" ON public.comments;
CREATE POLICY "Members can update own comments" ON public.comments
  FOR UPDATE USING (
    auth.uid() = user_id
    AND public.has_min_role(auth.uid(), 'org_member')
  );

DROP POLICY IF EXISTS "Reviewers can delete own comments" ON public.comments;
CREATE POLICY "Members can delete own comments" ON public.comments
  FOR DELETE USING (
    auth.uid() = user_id
    AND public.has_min_role(auth.uid(), 'org_member')
  );

-- 4. Update role_permissions default data: rename org_reviewer references to org_lead
UPDATE public.role_permissions SET role = 'org_lead' WHERE role::text = 'org_lead';

-- 5. Update any user_roles still referencing old value (automatic with enum rename, but be safe)
-- No action needed - enum rename handles this automatically
