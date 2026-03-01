
-- Add hash columns for cryptographic chain
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS integrity_hash text;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS previous_hash text;

-- Create immutability trigger: block UPDATE and DELETE on audit_logs
CREATE OR REPLACE FUNCTION public.audit_logs_immutable()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RAISE EXCEPTION 'Audit log entries are immutable and cannot be modified or deleted.';
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_audit_logs_no_update
  BEFORE UPDATE ON public.audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_logs_immutable();

CREATE TRIGGER trg_audit_logs_no_delete
  BEFORE DELETE ON public.audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_logs_immutable();

-- Create hash chain trigger on INSERT
CREATE OR REPLACE FUNCTION public.audit_logs_hash_chain()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  prev_hash text;
  hash_input text;
BEGIN
  -- Get the previous hash (most recent entry)
  SELECT integrity_hash INTO prev_hash
  FROM public.audit_logs
  ORDER BY created_at DESC, id DESC
  LIMIT 1;

  IF prev_hash IS NULL THEN
    prev_hash := 'GENESIS';
  END IF;

  -- Build hash input: previous_hash + timestamp + user_id + action + old_value + new_value
  hash_input := prev_hash || '|' ||
    COALESCE(NEW.created_at::text, '') || '|' ||
    COALESCE(NEW.user_id::text, '') || '|' ||
    COALESCE(NEW.action, '') || '|' ||
    COALESCE(NEW.old_value, '') || '|' ||
    COALESCE(NEW.new_value, '');

  NEW.previous_hash := prev_hash;
  NEW.integrity_hash := encode(digest(hash_input, 'sha256'), 'hex');

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_audit_logs_hash_chain
  BEFORE INSERT ON public.audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_logs_hash_chain();

-- Drop existing RLS policies that allow UPDATE/DELETE (if any)
-- The existing policies only allow INSERT and SELECT which is correct

-- Create index on hash for verification queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_integrity_hash ON public.audit_logs(integrity_hash);
