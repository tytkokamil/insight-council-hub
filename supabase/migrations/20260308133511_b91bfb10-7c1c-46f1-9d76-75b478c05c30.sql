
-- =====================================================
-- PROMPT 21: Referral Engine tables
-- =====================================================
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_org_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  referrer_profile_id UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  referred_email TEXT NOT NULL,
  referral_code TEXT UNIQUE DEFAULT LEFT(encode(gen_random_bytes(6),'hex'), 8),
  status TEXT NOT NULL DEFAULT 'pending',
  referred_org_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  reward_granted BOOLEAN DEFAULT FALSE,
  reward_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  converted_at TIMESTAMPTZ
);

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE DEFAULT LEFT(encode(gen_random_bytes(4),'hex'),6),
  ADD COLUMN IF NOT EXISTS referred_by_code TEXT,
  ADD COLUMN IF NOT EXISTS referral_credits_eur NUMERIC DEFAULT 0;

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org referrals" ON public.referrals
  FOR SELECT USING (
    referrer_org_id IN (SELECT org_id FROM profiles WHERE user_id = auth.uid())
    OR referred_org_id IN (SELECT org_id FROM profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can create referrals for own org" ON public.referrals
  FOR INSERT WITH CHECK (
    referrer_org_id IN (SELECT org_id FROM profiles WHERE user_id = auth.uid())
  );

-- =====================================================
-- PROMPT 24: NPS & Feedback
-- =====================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS nps_last_shown TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS nps_score INTEGER,
  ADD COLUMN IF NOT EXISTS nps_shown_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS preferred_login TEXT DEFAULT 'password';

CREATE TABLE IF NOT EXISTS public.nps_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  score INTEGER NOT NULL,
  comment TEXT,
  phone TEXT,
  callback_requested BOOLEAN DEFAULT FALSE,
  callback_status TEXT DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.nps_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own NPS" ON public.nps_responses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all NPS" ON public.nps_responses
  FOR SELECT USING (is_org_admin_or_owner(auth.uid()));

CREATE POLICY "Users can view own NPS" ON public.nps_responses
  FOR SELECT USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.feature_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  feature TEXT NOT NULL,
  rating INTEGER,
  sentiment TEXT,
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.feature_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert feedback" ON public.feature_feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view feedback" ON public.feature_feedback
  FOR SELECT USING (is_org_admin_or_owner(auth.uid()));

-- =====================================================
-- PROMPT 29: Churn Prevention
-- =====================================================
CREATE TABLE IF NOT EXISTS public.churn_risk_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  score INTEGER NOT NULL DEFAULT 0,
  risk_level TEXT NOT NULL DEFAULT 'low',
  risk_factors TEXT[] DEFAULT '{}',
  intervention_sent BOOLEAN DEFAULT FALSE,
  intervention_type TEXT,
  intervention_reason TEXT,
  notes TEXT
);

ALTER TABLE public.churn_risk_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view churn logs" ON public.churn_risk_log
  FOR SELECT USING (is_org_admin_or_owner(auth.uid()));

CREATE POLICY "System can insert churn logs" ON public.churn_risk_log
  FOR INSERT WITH CHECK (true);

-- =====================================================
-- PROMPT 30: Launch Checklist
-- =====================================================
CREATE TABLE IF NOT EXISTS public.launch_checklist (
  org_id UUID PRIMARY KEY REFERENCES public.organizations(id) ON DELETE CASCADE,
  completed_items TEXT[] DEFAULT '{}',
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.launch_checklist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage checklist" ON public.launch_checklist
  FOR ALL USING (
    org_id IN (SELECT org_id FROM profiles WHERE user_id = auth.uid())
    AND is_org_admin_or_owner(auth.uid())
  ) WITH CHECK (
    org_id IN (SELECT org_id FROM profiles WHERE user_id = auth.uid())
    AND is_org_admin_or_owner(auth.uid())
  );

-- =====================================================
-- PROMPT 27: API Keys table
-- =====================================================
CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  key_preview TEXT,
  permissions TEXT[] DEFAULT '{}',
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view API keys" ON public.api_keys
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can manage API keys" ON public.api_keys
  FOR ALL USING (
    is_org_admin_or_owner(auth.uid())
    AND org_id IN (SELECT org_id FROM profiles WHERE user_id = auth.uid())
  ) WITH CHECK (
    is_org_admin_or_owner(auth.uid())
    AND org_id IN (SELECT org_id FROM profiles WHERE user_id = auth.uid())
  );
