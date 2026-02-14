-- User AI provider settings
CREATE TABLE public.user_ai_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  provider TEXT NOT NULL DEFAULT 'lovable',
  api_key TEXT,
  model TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_ai_settings ENABLE ROW LEVEL SECURITY;

-- Users can only access their own settings
CREATE POLICY "Users can view own AI settings"
  ON public.user_ai_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own AI settings"
  ON public.user_ai_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own AI settings"
  ON public.user_ai_settings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own AI settings"
  ON public.user_ai_settings FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_user_ai_settings_updated_at
  BEFORE UPDATE ON public.user_ai_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();