
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS payment_failed_at timestamptz,
  ADD COLUMN IF NOT EXISTS dunning_step integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS dunning_last_sent_at timestamptz;
