
REVOKE ALL ON FUNCTION public.tg_notify_new_message() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.tg_notify_order_paid() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.tg_notify_shipment() FROM PUBLIC, anon, authenticated;
