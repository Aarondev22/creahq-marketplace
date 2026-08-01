-- 1. Execute grants for role helper functions
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.current_user_roles() TO authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_founder_code(text) TO authenticated;

-- 2. Data API grants (were missing entirely)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles, public.listings, public.favorites,
  public.conversations, public.messages, public.private_offers, public.orders, public.order_items,
  public.notifications, public.disputes, public.shipments, public.discount_codes,
  public.featured_shops, public.founder_broadcasts, public.user_roles, public.founder_redeem_codes TO authenticated;
GRANT SELECT ON public.profiles, public.listings, public.featured_shops TO anon;
GRANT ALL ON public.profiles, public.listings, public.favorites, public.conversations, public.messages,
  public.private_offers, public.orders, public.order_items, public.notifications, public.disputes,
  public.shipments, public.discount_codes, public.featured_shops, public.founder_broadcasts,
  public.user_roles, public.founder_redeem_codes TO service_role;

-- 3. profiles: banned flag + move sensitive stripe id out of publicly readable table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS banned boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.seller_payment_accounts (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_account_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.seller_payment_accounts TO authenticated;
GRANT ALL ON public.seller_payment_accounts TO service_role;
ALTER TABLE public.seller_payment_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own payment account select" ON public.seller_payment_accounts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own payment account insert" ON public.seller_payment_accounts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own payment account update" ON public.seller_payment_accounts FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER seller_payment_accounts_updated_at BEFORE UPDATE ON public.seller_payment_accounts
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

INSERT INTO public.seller_payment_accounts (user_id, stripe_account_id)
SELECT id, stripe_account_id FROM public.profiles WHERE stripe_account_id IS NOT NULL
ON CONFLICT (user_id) DO NOTHING;
ALTER TABLE public.profiles DROP COLUMN stripe_account_id;

-- 4. listings: more settings
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS images text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS condition text,
  ADD COLUMN IF NOT EXISTS stock integer;

-- 5. contact messages
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  message text NOT NULL,
  handled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.contact_messages TO anon, authenticated;
GRANT SELECT, UPDATE ON public.contact_messages TO authenticated;
GRANT ALL ON public.contact_messages TO service_role;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can send contact message" ON public.contact_messages FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "admins read contact messages" ON public.contact_messages FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'founder'));
CREATE POLICY "admins update contact messages" ON public.contact_messages FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'founder'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'founder'));

-- 6. Admin moderation policies
CREATE POLICY "admins update any profile" ON public.profiles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'founder'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'founder'));
CREATE POLICY "admins update any listing" ON public.listings FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'founder'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'founder'));
CREATE POLICY "admins read all listings" ON public.listings FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'founder'));
CREATE POLICY "admins read all roles" ON public.user_roles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'founder'));
CREATE POLICY "admins grant roles" ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'founder') OR (public.has_role(auth.uid(),'admin') AND role <> 'founder'));
CREATE POLICY "admins revoke roles" ON public.user_roles FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'founder') OR (public.has_role(auth.uid(),'admin') AND role <> 'founder'));

-- 7. founder_redeem_codes: explicit deny of direct writes (redemption only via SECURITY DEFINER fn)
CREATE POLICY "no direct insert" ON public.founder_redeem_codes AS RESTRICTIVE FOR INSERT TO authenticated, anon WITH CHECK (false);
CREATE POLICY "no direct update" ON public.founder_redeem_codes AS RESTRICTIVE FOR UPDATE TO authenticated, anon USING (false) WITH CHECK (false);
CREATE POLICY "no direct delete" ON public.founder_redeem_codes AS RESTRICTIVE FOR DELETE TO authenticated, anon USING (false);