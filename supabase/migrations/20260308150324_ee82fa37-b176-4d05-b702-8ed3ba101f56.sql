
-- Fix the only permissive INSERT policy: scope support_requests to authenticated users
-- Add user_id column for proper scoping
ALTER TABLE public.support_requests ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid();

-- Drop old permissive policy
DROP POLICY IF EXISTS "Authenticated users can submit support requests" ON public.support_requests;

-- Create scoped policy: users can only insert rows where they set their own email
CREATE POLICY "Authenticated users can submit support requests"
  ON public.support_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);
