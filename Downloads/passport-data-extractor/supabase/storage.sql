-- Create the documents storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);

-- Create policies for the documents bucket
CREATE POLICY "Users can upload their own documents" ON storage.objects 
FOR INSERT WITH CHECK (
    bucket_id = 'documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own documents" ON storage.objects 
FOR SELECT USING (
    bucket_id = 'documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can view documents in their organization" ON storage.objects 
FOR SELECT USING (
    bucket_id = 'documents' 
    AND EXISTS (
        SELECT 1 FROM user_profiles admin_profile
        JOIN user_profiles user_profile ON user_profile.id = (storage.foldername(name))[1]::uuid
        WHERE admin_profile.id = auth.uid() 
        AND admin_profile.role IN ('admin', 'superadmin')
        AND (
            admin_profile.role = 'superadmin' 
            OR admin_profile.organization_id = user_profile.organization_id
        )
    )
);

CREATE POLICY "Users can delete their own documents" ON storage.objects 
FOR DELETE USING (
    bucket_id = 'documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);