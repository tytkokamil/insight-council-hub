
-- Add file columns to team_messages
ALTER TABLE public.team_messages
ADD COLUMN file_url text,
ADD COLUMN file_name text,
ADD COLUMN file_type text;

-- Create storage bucket for chat attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('chat-attachments', 'chat-attachments', true);

-- Storage policies: team members can upload
CREATE POLICY "Team members can upload chat files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'chat-attachments' AND auth.uid() IS NOT NULL);

-- Anyone authenticated can view
CREATE POLICY "Authenticated users can view chat files"
ON storage.objects FOR SELECT
USING (bucket_id = 'chat-attachments' AND auth.uid() IS NOT NULL);

-- Uploaders can delete own files
CREATE POLICY "Users can delete own chat files"
ON storage.objects FOR DELETE
USING (bucket_id = 'chat-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);
