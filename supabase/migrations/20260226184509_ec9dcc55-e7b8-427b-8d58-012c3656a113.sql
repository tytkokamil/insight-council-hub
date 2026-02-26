
ALTER TABLE public.audit_logs
  ADD COLUMN IF NOT EXISTS change_reason text,
  ADD COLUMN IF NOT EXISTS signed_by uuid,
  ADD COLUMN IF NOT EXISTS signed_at timestamptz,
  ADD COLUMN IF NOT EXISTS signature_method text;

COMMENT ON COLUMN public.audit_logs.change_reason IS 'User-provided justification for this change';
COMMENT ON COLUMN public.audit_logs.signed_by IS 'User who electronically signed this action';
COMMENT ON COLUMN public.audit_logs.signed_at IS 'Timestamp of electronic signature';
COMMENT ON COLUMN public.audit_logs.signature_method IS 'Method used: password, checkbox, mfa';
