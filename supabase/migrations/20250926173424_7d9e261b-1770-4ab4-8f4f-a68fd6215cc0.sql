-- Create private storage bucket for receipt images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
  'receipt-images', 
  'receipt-images', 
  false, 
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
);

-- Add image storage fields to receipts table
ALTER TABLE public.receipts 
ADD COLUMN image_bucket text,
ADD COLUMN image_path text,
ADD COLUMN mime_type text,
ADD COLUMN file_size bigint;

-- Create RLS policies for receipt images storage
CREATE POLICY "Users can upload their own receipt images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'receipt-images' 
  AND auth.uid()::text = split_part(name, '/', 1)
);

CREATE POLICY "Users can view their own receipt images" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'receipt-images' 
  AND auth.uid()::text = split_part(name, '/', 1)
);

CREATE POLICY "Users can delete their own receipt images" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'receipt-images' 
  AND auth.uid()::text = split_part(name, '/', 1)
);