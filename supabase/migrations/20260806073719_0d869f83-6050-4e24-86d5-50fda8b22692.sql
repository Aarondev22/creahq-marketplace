
CREATE POLICY "public read banners" ON storage.objects FOR SELECT USING (bucket_id = 'shop-banners');
CREATE POLICY "owners upload banners" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'shop-banners' AND (auth.uid())::text = (storage.foldername(name))[1]);
CREATE POLICY "owners update banners" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'shop-banners' AND (auth.uid())::text = (storage.foldername(name))[1]);
CREATE POLICY "owners delete banners" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'shop-banners' AND (auth.uid())::text = (storage.foldername(name))[1]);
