
-- Create storage bucket for project documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-documents', 'project-documents', false);

-- Allow authenticated users to upload files
CREATE POLICY "Anyone can upload documents"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'project-documents');

-- Allow authenticated users to read their documents
CREATE POLICY "Anyone can read documents"
ON storage.objects
FOR SELECT
USING (bucket_id = 'project-documents');

-- Allow authenticated users to delete their documents
CREATE POLICY "Anyone can delete documents"
ON storage.objects
FOR DELETE
USING (bucket_id = 'project-documents');

-- Allow authenticated users to update their documents
CREATE POLICY "Anyone can update documents"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'project-documents');
