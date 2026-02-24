
-- Add missing status values to decision_status enum
ALTER TYPE public.decision_status ADD VALUE IF NOT EXISTS 'open';
ALTER TYPE public.decision_status ADD VALUE IF NOT EXISTS 'in_review';
ALTER TYPE public.decision_status ADD VALUE IF NOT EXISTS 'implementing';
