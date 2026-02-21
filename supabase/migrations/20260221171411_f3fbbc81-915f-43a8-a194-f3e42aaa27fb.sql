-- 1. Extend decision_status enum with 'cancelled' and 'superseded'
ALTER TYPE public.decision_status ADD VALUE IF NOT EXISTS 'cancelled';
ALTER TYPE public.decision_status ADD VALUE IF NOT EXISTS 'superseded';

-- 2. Add superseded_by column to decisions
ALTER TABLE public.decisions ADD COLUMN IF NOT EXISTS superseded_by UUID REFERENCES public.decisions(id);

-- 3. Add cancelled_at timestamp
ALTER TABLE public.decisions ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE;
