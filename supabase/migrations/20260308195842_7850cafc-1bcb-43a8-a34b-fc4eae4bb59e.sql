
-- Add scope and org_id columns to existing review_delegations table
ALTER TABLE public.review_delegations
  ADD COLUMN IF NOT EXISTS scope text NOT NULL DEFAULT 'all' CHECK (scope IN ('all', 'category', 'team')),
  ADD COLUMN IF NOT EXISTS scope_value text,
  ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id);

-- Backfill org_id from delegator's profile
UPDATE public.review_delegations rd
SET org_id = p.org_id
FROM public.profiles p
WHERE rd.delegator_id = p.user_id AND rd.org_id IS NULL;
