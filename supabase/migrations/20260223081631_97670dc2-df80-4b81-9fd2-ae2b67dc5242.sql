
-- Table for email OTP codes (TOTP uses Supabase native MFA)
CREATE TABLE public.email_otp_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for fast lookup
CREATE INDEX idx_email_otp_user ON public.email_otp_codes(user_id, used, expires_at);

-- Auto-cleanup old codes
CREATE OR REPLACE FUNCTION public.cleanup_expired_otp()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  DELETE FROM public.email_otp_codes
  WHERE expires_at < now() - interval '1 hour';
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_cleanup_otp
AFTER INSERT ON public.email_otp_codes
FOR EACH STATEMENT
EXECUTE FUNCTION public.cleanup_expired_otp();

-- RLS
ALTER TABLE public.email_otp_codes ENABLE ROW LEVEL SECURITY;

-- Users can view their own OTP codes (for verification)
CREATE POLICY "Users can view own OTP codes"
ON public.email_otp_codes FOR SELECT
USING (auth.uid() = user_id);

-- System inserts via edge function (service role), no user INSERT policy needed
-- Users should not be able to insert/update/delete OTP codes directly

-- MFA preferences table  
CREATE TABLE public.mfa_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  totp_enabled BOOLEAN NOT NULL DEFAULT false,
  email_otp_enabled BOOLEAN NOT NULL DEFAULT false,
  preferred_method TEXT NOT NULL DEFAULT 'none',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_mfa_settings_user ON public.mfa_settings(user_id);

ALTER TABLE public.mfa_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own MFA settings"
ON public.mfa_settings FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own MFA settings"
ON public.mfa_settings FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own MFA settings"
ON public.mfa_settings FOR UPDATE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_mfa_settings_updated_at
BEFORE UPDATE ON public.mfa_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
