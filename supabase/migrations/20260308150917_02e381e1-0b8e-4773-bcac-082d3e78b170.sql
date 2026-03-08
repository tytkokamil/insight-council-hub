
-- Replace overly permissive profiles SELECT policy with same-org scoping
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

CREATE POLICY "Users can view same-org profiles" ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    org_id = get_user_org_id(auth.uid())
    OR user_id = auth.uid()
  );
