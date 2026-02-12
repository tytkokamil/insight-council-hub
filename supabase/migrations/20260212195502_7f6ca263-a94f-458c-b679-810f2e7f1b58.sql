
-- Add missing foreign key references (skip already existing ones)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'audit_logs_user_id_fkey') THEN
    ALTER TABLE public.audit_logs ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'decision_reviews_reviewer_id_fkey') THEN
    ALTER TABLE public.decision_reviews ADD CONSTRAINT decision_reviews_reviewer_id_fkey FOREIGN KEY (reviewer_id) REFERENCES public.profiles(user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'decisions_created_by_fkey') THEN
    ALTER TABLE public.decisions ADD CONSTRAINT decisions_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'decisions_assignee_id_fkey') THEN
    ALTER TABLE public.decisions ADD CONSTRAINT decisions_assignee_id_fkey FOREIGN KEY (assignee_id) REFERENCES public.profiles(user_id);
  END IF;
END $$;
