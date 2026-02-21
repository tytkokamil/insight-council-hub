
-- Add 'proposed' and 'archived' to decision_status enum
ALTER TYPE public.decision_status ADD VALUE IF NOT EXISTS 'proposed' AFTER 'draft';
ALTER TYPE public.decision_status ADD VALUE IF NOT EXISTS 'archived' AFTER 'rejected';
