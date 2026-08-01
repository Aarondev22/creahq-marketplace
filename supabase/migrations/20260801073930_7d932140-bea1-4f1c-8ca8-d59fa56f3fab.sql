REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.current_user_roles() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.redeem_founder_code(text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_roles() TO authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_founder_code(text) TO authenticated;