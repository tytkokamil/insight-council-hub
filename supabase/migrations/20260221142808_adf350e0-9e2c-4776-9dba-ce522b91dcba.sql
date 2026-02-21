
-- Create delegations table for proxy/vacation coverage
CREATE TABLE public.review_delegations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  delegator_id UUID NOT NULL,
  delegate_id UUID NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT different_users CHECK (delegator_id != delegate_id),
  CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);

-- Enable RLS
ALTER TABLE public.review_delegations ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view delegations they are part of"
ON public.review_delegations FOR SELECT
USING (auth.uid() = delegator_id OR auth.uid() = delegate_id OR is_org_admin_or_owner(auth.uid()));

CREATE POLICY "Users can create their own delegations"
ON public.review_delegations FOR INSERT
WITH CHECK (auth.uid() = delegator_id);

CREATE POLICY "Users can update their own delegations"
ON public.review_delegations FOR UPDATE
USING (auth.uid() = delegator_id);

CREATE POLICY "Users can delete their own delegations"
ON public.review_delegations FOR DELETE
USING (auth.uid() = delegator_id);

-- Trigger for updated_at
CREATE TRIGGER update_review_delegations_updated_at
BEFORE UPDATE ON public.review_delegations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to check if a user has an active delegate right now
CREATE OR REPLACE FUNCTION public.get_active_delegate(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT delegate_id
  FROM public.review_delegations
  WHERE delegator_id = _user_id
    AND active = true
    AND CURRENT_DATE BETWEEN start_date AND end_date
  ORDER BY created_at DESC
  LIMIT 1
$$;
