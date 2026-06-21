
CREATE OR REPLACE FUNCTION public.current_user_roles()
RETURNS SETOF app_role
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT role FROM public.user_roles WHERE user_id = auth.uid() $$;
GRANT EXECUTE ON FUNCTION public.current_user_roles() TO authenticated;

CREATE TABLE public.founder_redeem_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  grants_role app_role NOT NULL DEFAULT 'founder',
  used_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.founder_redeem_codes TO authenticated;
GRANT ALL ON public.founder_redeem_codes TO service_role;
ALTER TABLE public.founder_redeem_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "no_direct_select" ON public.founder_redeem_codes FOR SELECT TO authenticated USING (false);

INSERT INTO public.founder_redeem_codes (code, grants_role)
VALUES ('CREAHQ-FOUNDER-9F4K2X7Q3M8B', 'founder');

CREATE OR REPLACE FUNCTION public.redeem_founder_code(_code TEXT)
RETURNS TABLE(success BOOLEAN, message TEXT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _user UUID := auth.uid();
  _code_row RECORD;
BEGIN
  IF _user IS NULL THEN RETURN QUERY SELECT false, 'Nicht angemeldet'; RETURN; END IF;
  SELECT * INTO _code_row FROM public.founder_redeem_codes WHERE code = _code FOR UPDATE;
  IF NOT FOUND THEN RETURN QUERY SELECT false, 'Code ungültig'; RETURN; END IF;
  IF _code_row.used_by IS NOT NULL THEN RETURN QUERY SELECT false, 'Code bereits eingelöst'; RETURN; END IF;
  INSERT INTO public.user_roles(user_id, role) VALUES (_user, _code_row.grants_role) ON CONFLICT DO NOTHING;
  INSERT INTO public.user_roles(user_id, role) VALUES (_user, 'admin') ON CONFLICT DO NOTHING;
  UPDATE public.founder_redeem_codes SET used_by = _user, used_at = now() WHERE id = _code_row.id;
  RETURN QUERY SELECT true, 'Willkommen, Founder.';
END; $$;
GRANT EXECUTE ON FUNCTION public.redeem_founder_code(TEXT) TO authenticated;

ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS shipping_mode TEXT NOT NULL DEFAULT 'included' CHECK (shipping_mode IN ('included','extra','digital')),
  ADD COLUMN IF NOT EXISTS shipping_price_cents INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS favorites_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS stripe_price_id TEXT;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS shop_shipping_default TEXT DEFAULT 'extra' CHECK (shop_shipping_default IN ('included','extra')),
  ADD COLUMN IF NOT EXISTS stripe_account_id TEXT,
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE,
  shop_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK ((listing_id IS NOT NULL) OR (shop_id IS NOT NULL)),
  UNIQUE(user_id, listing_id),
  UNIQUE(user_id, shop_id)
);
GRANT SELECT, INSERT, DELETE ON public.favorites TO authenticated;
GRANT ALL ON public.favorites TO service_role;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fav_own_select" ON public.favorites FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "fav_own_insert" ON public.favorites FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "fav_own_delete" ON public.favorites FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES public.listings(id) ON DELETE SET NULL,
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(buyer_id, seller_id)
);
GRANT SELECT, INSERT, UPDATE ON public.conversations TO authenticated;
GRANT ALL ON public.conversations TO service_role;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "conv_participant_select" ON public.conversations FOR SELECT TO authenticated
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id OR public.has_role(auth.uid(),'founder') OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "conv_buyer_insert" ON public.conversations FOR INSERT TO authenticated WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY "conv_participant_update" ON public.conversations FOR UPDATE TO authenticated
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);
CREATE TRIGGER conv_touch BEFORE UPDATE ON public.conversations FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'text' CHECK (kind IN ('text','offer','system')),
  offer_id UUID,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "msg_participant_select" ON public.messages FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id
    AND (auth.uid() = c.buyer_id OR auth.uid() = c.seller_id
         OR public.has_role(auth.uid(),'founder') OR public.has_role(auth.uid(),'admin'))));
CREATE POLICY "msg_participant_insert" ON public.messages FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id AND EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id
    AND (auth.uid() = c.buyer_id OR auth.uid() = c.seller_id)));
CREATE POLICY "msg_recipient_update" ON public.messages FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id
    AND (auth.uid() = c.buyer_id OR auth.uid() = c.seller_id)));
CREATE INDEX msg_conv_idx ON public.messages(conversation_id, created_at DESC);

CREATE TABLE public.private_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
  expires_at TIMESTAMPTZ NOT NULL,
  redeemed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.private_offers TO authenticated;
GRANT ALL ON public.private_offers TO service_role;
ALTER TABLE public.private_offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "offer_party_select" ON public.private_offers FOR SELECT TO authenticated
  USING (auth.uid() IN (seller_id, buyer_id) OR public.has_role(auth.uid(),'founder'));
CREATE POLICY "offer_seller_insert" ON public.private_offers FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "offer_party_update" ON public.private_offers FOR UPDATE TO authenticated
  USING (auth.uid() IN (seller_id, buyer_id));

CREATE TABLE public.discount_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  scope TEXT NOT NULL DEFAULT 'global' CHECK (scope IN ('global','shop')),
  kind TEXT NOT NULL DEFAULT 'percent' CHECK (kind IN ('percent','fixed')),
  amount INTEGER NOT NULL CHECK (amount > 0),
  max_uses INTEGER,
  used_count INTEGER NOT NULL DEFAULT 0,
  valid_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  valid_until TIMESTAMPTZ,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.discount_codes TO authenticated;
GRANT ALL ON public.discount_codes TO service_role;
ALTER TABLE public.discount_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "code_owner_or_founder_all" ON public.discount_codes FOR ALL TO authenticated
  USING (auth.uid() = owner_id OR public.has_role(auth.uid(),'founder') OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (auth.uid() = owner_id OR public.has_role(auth.uid(),'founder') OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "code_anyone_read_active" ON public.discount_codes FOR SELECT TO authenticated
  USING (active = true AND (valid_until IS NULL OR valid_until > now()));

CREATE TABLE public.shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  carrier TEXT NOT NULL,
  tracking_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'shipped' CHECK (status IN ('shipped','in_transit','delivered','returned')),
  shipped_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  delivered_at TIMESTAMPTZ
);
GRANT SELECT, INSERT, UPDATE ON public.shipments TO authenticated;
GRANT ALL ON public.shipments TO service_role;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ship_party_select" ON public.shipments FOR SELECT TO authenticated
  USING (auth.uid() = seller_id OR public.has_role(auth.uid(),'founder') OR public.has_role(auth.uid(),'admin')
    OR EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.buyer_id = auth.uid()));
CREATE POLICY "ship_seller_insert" ON public.shipments FOR INSERT TO authenticated WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "ship_seller_update" ON public.shipments FOR UPDATE TO authenticated
  USING (auth.uid() = seller_id OR public.has_role(auth.uid(),'founder'));

CREATE TABLE public.disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  opened_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','investigating','resolved_buyer','resolved_seller','closed')),
  resolution_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);
GRANT SELECT, INSERT, UPDATE ON public.disputes TO authenticated;
GRANT ALL ON public.disputes TO service_role;
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "disp_party_select" ON public.disputes FOR SELECT TO authenticated
  USING (auth.uid() = opened_by OR public.has_role(auth.uid(),'founder') OR public.has_role(auth.uid(),'admin')
    OR EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.buyer_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.order_items oi WHERE oi.order_id = disputes.order_id AND oi.seller_id = auth.uid()));
CREATE POLICY "disp_buyer_insert" ON public.disputes FOR INSERT TO authenticated WITH CHECK (auth.uid() = opened_by);
CREATE POLICY "disp_founder_update" ON public.disputes FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'founder') OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.featured_shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(shop_id)
);
GRANT SELECT ON public.featured_shops TO anon, authenticated;
GRANT ALL ON public.featured_shops TO service_role;
ALTER TABLE public.featured_shops ENABLE ROW LEVEL SECURITY;
CREATE POLICY "feat_public_read" ON public.featured_shops FOR SELECT USING (true);
CREATE POLICY "feat_founder_write" ON public.featured_shops FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'founder') OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'founder') OR public.has_role(auth.uid(),'admin'));

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'system'
    CHECK (category IN ('message','refill_shop','refill_listing','order','founder_news','system')),
  ADD COLUMN IF NOT EXISTS link TEXT,
  ADD COLUMN IF NOT EXISTS meta JSONB;

CREATE TABLE public.founder_broadcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  segment TEXT NOT NULL DEFAULT 'all' CHECK (segment IN ('all','sellers','buyers','custom')),
  target_user_ids UUID[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.founder_broadcasts TO authenticated;
GRANT ALL ON public.founder_broadcasts TO service_role;
ALTER TABLE public.founder_broadcasts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bcast_founder_all" ON public.founder_broadcasts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'founder') OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'founder') OR public.has_role(auth.uid(),'admin'));

ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
