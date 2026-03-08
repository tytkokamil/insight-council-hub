-- Allow authenticated users to upload to decision-attachments bucket
CREATE POLICY "Authenticated users can upload decision attachments"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'decision-attachments');

-- Allow authenticated users to delete their own decision attachments
CREATE POLICY "Users can delete own decision attachments"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'decision-attachments' AND (storage.foldername(name))[1] IS NOT NULL);