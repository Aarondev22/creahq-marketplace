ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_category_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_category_check CHECK (category = ANY (ARRAY['message','chat','refill_shop','refill_listing','order','sale','shipment','offer','founder_news','system']));

ALTER TABLE public.private_offers ADD COLUMN IF NOT EXISTS qty integer NOT NULL DEFAULT 1;
ALTER TABLE public.private_offers ADD COLUMN IF NOT EXISTS note text;
ALTER TABLE public.private_offers ADD COLUMN IF NOT EXISTS created_by uuid;
ALTER TABLE public.private_offers ADD COLUMN IF NOT EXISTS accepted_at timestamptz;
ALTER TABLE public.private_offers ADD COLUMN IF NOT EXISTS declined_at timestamptz;

DROP POLICY IF EXISTS offer_seller_insert ON public.private_offers;
CREATE POLICY offer_party_insert ON public.private_offers FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = created_by
  AND (auth.uid() = seller_id OR auth.uid() = buyer_id)
  AND EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = conversation_id AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
  )
);

GRANT SELECT, INSERT, UPDATE ON public.private_offers TO authenticated;
GRANT ALL ON public.private_offers TO service_role;