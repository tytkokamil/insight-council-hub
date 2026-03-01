CREATE TABLE public.support_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Allow anyone to insert (public form)
ALTER TABLE public.support_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit support requests"
  ON public.support_requests
  FOR INSERT
  WITH CHECK (true);

-- Only platform admins can read
CREATE POLICY "Platform admins can read support requests"
  ON public.support_requests
  FOR SELECT
  USING (public.is_platform_admin(auth.uid()));
