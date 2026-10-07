CREATE TABLE public.listing_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL,
  file_path text NOT NULL,
  file_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.listing_files TO authenticated;
GRANT ALL ON public.listing_files TO service_role;
ALTER TABLE public.listing_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY listing_files_seller_all ON public.listing_files FOR ALL TO authenticated
  USING (auth.uid() = seller_id) WITH CHECK (auth.uid() = seller_id);
CREATE POLICY listing_files_buyer_read ON public.listing_files FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.order_items oi JOIN public.orders o ON o.id = oi.order_id
    WHERE oi.listing_id = listing_files.listing_id AND o.buyer_id = auth.uid() AND o.status IN ('paid','fulfilled')));

CREATE POLICY "listing_files_upload_own" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'listing-files' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "listing_files_read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'listing-files' AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR EXISTS (SELECT 1 FROM public.listing_files lf JOIN public.order_items oi ON oi.listing_id = lf.listing_id
      JOIN public.orders o ON o.id = oi.order_id
      WHERE lf.file_path = storage.objects.name AND o.buyer_id = auth.uid() AND o.status IN ('paid','fulfilled'))));