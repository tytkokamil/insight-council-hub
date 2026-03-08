
-- Platform admin audit logs
CREATE TABLE IF NOT EXISTS public.platform_admin_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_org_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  target_user_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.platform_admin_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins can read admin logs"
  ON public.platform_admin_logs FOR SELECT TO authenticated
  USING (public.is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins can insert admin logs"
  ON public.platform_admin_logs FOR INSERT TO authenticated
  WITH CHECK (admin_user_id = auth.uid() AND public.is_platform_admin(auth.uid()));

-- Pilot customers table
CREATE TABLE IF NOT EXISTS public.pilot_customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  contact_name TEXT,
  industry TEXT,
  start_date DATE DEFAULT CURRENT_DATE,
  end_date DATE,
  status TEXT DEFAULT 'active',
  enabled_features TEXT[] DEFAULT '{}',
  notes TEXT,
  created_by UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.pilot_customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins can manage pilot customers"
  ON public.pilot_customers FOR ALL TO authenticated
  USING (public.is_platform_admin(auth.uid()));

-- Feature flag org overrides
CREATE TABLE IF NOT EXISTS public.feature_flag_overrides (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  flag_id UUID REFERENCES public.feature_flags(id) ON DELETE CASCADE NOT NULL,
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  enabled BOOLEAN NOT NULL,
  set_by UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(flag_id, org_id)
);

ALTER TABLE public.feature_flag_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins can manage flag overrides"
  ON public.feature_flag_overrides FOR ALL TO authenticated
  USING (public.is_platform_admin(auth.uid()));

CREATE POLICY "Users can read own org flag overrides"
  ON public.feature_flag_overrides FOR SELECT TO authenticated
  USING (org_id = get_user_org_id(auth.uid()));

-- Add columns to organizations
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS support_notes TEXT,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS pilot_customer BOOLEAN DEFAULT false;

-- Add last_seen to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS last_seen TIMESTAMPTZ;
