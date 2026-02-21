
-- Create table for decision version snapshots
CREATE TABLE public.decision_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  decision_id UUID NOT NULL REFERENCES public.decisions(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL DEFAULT 1,
  snapshot JSONB NOT NULL,
  change_reason TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(decision_id, version_number)
);

-- Enable RLS
ALTER TABLE public.decision_versions ENABLE ROW LEVEL SECURITY;

-- Authenticated users can view versions (same visibility as decisions)
CREATE POLICY "Authenticated users can view versions"
ON public.decision_versions
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.decisions d
    WHERE d.id = decision_versions.decision_id
  )
);

-- Users can create versions (decision owners/assignees)
CREATE POLICY "Users can create versions"
ON public.decision_versions
FOR INSERT
WITH CHECK (
  auth.uid() = created_by
);

-- Create index for fast lookups
CREATE INDEX idx_decision_versions_decision_id ON public.decision_versions(decision_id, version_number DESC);
