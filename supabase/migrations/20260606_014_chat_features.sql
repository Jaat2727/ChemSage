-- Add is_edited column to messages if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'is_edited') THEN
        ALTER TABLE public.messages ADD COLUMN is_edited BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Create chat-attachments bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('chat-attachments', 'chat-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for chat-attachments
-- Note: Real apps should restrict read/write by room members, but for simplicity here we allow auth users.
CREATE POLICY "Allow authenticated reads on chat attachments" 
ON storage.objects FOR SELECT 
TO authenticated 
USING (bucket_id = 'chat-attachments');

CREATE POLICY "Allow authenticated uploads to chat attachments" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'chat-attachments');

CREATE POLICY "Allow authenticated deletes from chat attachments" 
ON storage.objects FOR DELETE 
TO authenticated 
USING (bucket_id = 'chat-attachments' AND auth.uid() = owner);
