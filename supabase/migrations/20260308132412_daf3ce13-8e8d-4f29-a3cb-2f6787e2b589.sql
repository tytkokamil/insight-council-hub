
-- Prompt 11: Dead Decision Detector
-- Add last_activity_at column to track stagnation
ALTER TABLE public.decisions ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ DEFAULT now();

-- Update existing decisions to use updated_at as initial last_activity_at
UPDATE public.decisions SET last_activity_at = updated_at WHERE last_activity_at IS NULL;

-- Function to update last_activity_at when related actions occur
CREATE OR REPLACE FUNCTION public.update_decision_last_activity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.decisions SET last_activity_at = NOW()
  WHERE id = NEW.decision_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Triggers on related tables
CREATE TRIGGER trg_review_activity
AFTER INSERT OR UPDATE ON public.decision_reviews
FOR EACH ROW EXECUTE FUNCTION public.update_decision_last_activity();

CREATE TRIGGER trg_comment_activity
AFTER INSERT ON public.comments
FOR EACH ROW EXECUTE FUNCTION public.update_decision_last_activity();

CREATE TRIGGER trg_audit_activity
AFTER INSERT ON public.audit_logs
FOR EACH ROW EXECUTE FUNCTION public.update_decision_last_activity();

-- Also update last_activity_at on decisions UPDATE itself
CREATE OR REPLACE FUNCTION public.update_decision_self_activity()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status 
    OR OLD.priority IS DISTINCT FROM NEW.priority
    OR OLD.description IS DISTINCT FROM NEW.description
    OR OLD.assignee_id IS DISTINCT FROM NEW.assignee_id THEN
    NEW.last_activity_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = 'public';

CREATE TRIGGER trg_decision_self_activity
BEFORE UPDATE ON public.decisions
FOR EACH ROW EXECUTE FUNCTION public.update_decision_self_activity();

-- Prompt 12: Velocity Score columns (prepare for later)
-- Prompt 16: AI Summary columns
ALTER TABLE public.decisions ADD COLUMN IF NOT EXISTS ai_summary TEXT;
ALTER TABLE public.decisions ADD COLUMN IF NOT EXISTS ai_summary_generated_at TIMESTAMPTZ;
