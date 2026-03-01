
CREATE TABLE public.terminology (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  default_term TEXT NOT NULL,
  custom_term TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(org_id, default_term)
);

ALTER TABLE public.terminology ENABLE ROW LEVEL SECURITY;

-- Members of the org can view terminology
CREATE POLICY "Org members can view terminology"
  ON public.terminology FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.org_id = terminology.org_id AND p.user_id = auth.uid()
    )
  );

-- Admins can manage terminology
CREATE POLICY "Org admins can insert terminology"
  ON public.terminology FOR INSERT
  WITH CHECK (
    is_org_admin_or_owner(auth.uid()) AND
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.org_id = terminology.org_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Org admins can update terminology"
  ON public.terminology FOR UPDATE
  USING (
    is_org_admin_or_owner(auth.uid()) AND
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.org_id = terminology.org_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Org admins can delete terminology"
  ON public.terminology FOR DELETE
  USING (
    is_org_admin_or_owner(auth.uid()) AND
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.org_id = terminology.org_id AND p.user_id = auth.uid()
    )
  );
