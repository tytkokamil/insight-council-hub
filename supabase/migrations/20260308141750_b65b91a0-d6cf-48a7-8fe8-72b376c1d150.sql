
-- Founding customer slots: single-row config table
CREATE TABLE public.founding_customer_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  total_slots INTEGER NOT NULL DEFAULT 20,
  claimed_slots INTEGER NOT NULL DEFAULT 13,
  deadline TIMESTAMPTZ NOT NULL DEFAULT '2026-04-15T23:59:59+02:00',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert initial row
INSERT INTO public.founding_customer_slots (total_slots, claimed_slots, deadline)
VALUES (20, 13, '2026-04-15T23:59:59+02:00');

-- Public read access (no auth needed for landing page)
ALTER TABLE public.founding_customer_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read founding slots"
  ON public.founding_customer_slots
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Only service role can update (via edge function on checkout)
CREATE POLICY "Service role can update founding slots"
  ON public.founding_customer_slots
  FOR UPDATE
  TO authenticated
  USING (public.is_platform_admin(auth.uid()));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.founding_customer_slots;
