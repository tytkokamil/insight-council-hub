
-- 1. Comment type enum
CREATE TYPE public.comment_type AS ENUM ('comment', 'feedback', 'risk_flag');

-- 2. Add type column to comments
ALTER TABLE public.comments ADD COLUMN type public.comment_type NOT NULL DEFAULT 'comment';

-- 3. Audit log table
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_id uuid NOT NULL REFERENCES public.decisions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  action text NOT NULL,
  field_name text,
  old_value text,
  new_value text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view audit logs"
ON public.audit_logs FOR SELECT TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "System can insert audit logs"
ON public.audit_logs FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_audit_logs_decision ON public.audit_logs(decision_id);
CREATE INDEX idx_audit_logs_created ON public.audit_logs(created_at DESC);
