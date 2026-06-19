
CREATE POLICY "public read covers" ON storage.objects FOR SELECT USING (bucket_id = 'listing-covers');
CREATE POLICY "owners upload covers" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'listing-covers' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "owners update covers" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'listing-covers' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "owners delete covers" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'listing-covers' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "public read avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "owners upload avatars" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "owners update avatars" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "owners delete avatars" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
