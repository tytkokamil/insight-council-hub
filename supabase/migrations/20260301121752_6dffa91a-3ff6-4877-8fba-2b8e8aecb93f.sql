
-- Add WhatsApp columns to notification_preferences
ALTER TABLE public.notification_preferences
  ADD COLUMN IF NOT EXISTS whatsapp_phone text,
  ADD COLUMN IF NOT EXISTS whatsapp_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS whatsapp_enabled boolean NOT NULL DEFAULT false;

-- Table for WhatsApp verification codes
CREATE TABLE public.whatsapp_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  phone text NOT NULL,
  code text NOT NULL,
  expires_at timestamptz NOT NULL,
  used boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.whatsapp_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own verifications"
  ON public.whatsapp_verifications FOR SELECT
  USING (auth.uid() = user_id);
