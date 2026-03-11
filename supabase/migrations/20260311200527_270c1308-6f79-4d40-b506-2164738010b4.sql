
DROP POLICY IF EXISTS "Org members can view attachments" ON public.decision_attachments;

CREATE POLICY "Org members can view attachments"
  ON public.decision_attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM decisions d
      JOIN profiles p ON p.org_id = d.org_id
      WHERE d.id = decision_attachments.decision_id
        AND p.user_id = auth.uid()
    )
  );
