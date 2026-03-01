
-- Fix the overly permissive INSERT policy on inbound_email_log
DROP POLICY IF EXISTS "Service can insert logs" ON public.inbound_email_log;

-- Only allow inserts if user is authenticated (service role bypasses RLS anyway)
CREATE POLICY "Authenticated can insert email logs"
  ON public.inbound_email_log FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
