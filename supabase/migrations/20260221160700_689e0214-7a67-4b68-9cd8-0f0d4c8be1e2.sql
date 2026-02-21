
-- Add share_permission enum
CREATE TYPE public.share_permission AS ENUM ('read', 'comment', 'edit');

-- Add permission and expires_at columns to decision_shares
ALTER TABLE public.decision_shares
  ADD COLUMN permission public.share_permission NOT NULL DEFAULT 'read',
  ADD COLUMN expires_at timestamp with time zone DEFAULT NULL;

-- Update the existing SELECT RLS policy to respect expiration
DROP POLICY IF EXISTS "Authenticated users can view shares" ON public.decision_shares;
CREATE POLICY "Authenticated users can view active shares"
  ON public.decision_shares FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND (expires_at IS NULL OR expires_at > now())
  );

-- Allow viewing expired shares for the sharer (audit purposes)
CREATE POLICY "Sharers can view all own shares"
  ON public.decision_shares FOR SELECT
  USING (auth.uid() = shared_by);

-- Allow sharers to update their shares (change permission/duration)
CREATE POLICY "Sharers can update own shares"
  ON public.decision_shares FOR UPDATE
  USING (auth.uid() = shared_by OR is_org_admin_or_owner(auth.uid()));
