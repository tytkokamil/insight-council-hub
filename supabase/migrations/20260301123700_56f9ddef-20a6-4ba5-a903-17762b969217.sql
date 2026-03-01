
-- Referral codes: one per user
CREATE TABLE public.referral_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  code text NOT NULL UNIQUE DEFAULT substr(replace(encode(gen_random_bytes(6), 'base64'), '/', ''), 1, 8),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own referral code"
  ON public.referral_codes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own referral code"
  ON public.referral_codes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Referral conversions: tracks signups via referral
CREATE TABLE public.referral_conversions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL,
  referred_user_id uuid,
  referred_email text,
  plan text NOT NULL DEFAULT 'starter',
  commission_amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  activated_at timestamptz,
  commission_released_at timestamptz,
  payout_month text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.referral_conversions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own referral conversions"
  ON public.referral_conversions FOR SELECT
  USING (auth.uid() = referrer_id);

CREATE INDEX idx_referral_codes_code ON public.referral_codes(code);
CREATE INDEX idx_referral_conversions_referrer ON public.referral_conversions(referrer_id);
