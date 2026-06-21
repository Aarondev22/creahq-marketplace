import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "buyer" | "seller" | "admin" | "founder";

export type AuthState = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  roles: AppRole[];
  isFounder: boolean;
  isAdmin: boolean;
  isSeller: boolean;
};

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    roles: [],
    isFounder: false,
    isAdmin: false,
    isSeller: false,
  });

  useEffect(() => {
    let mounted = true;

    async function loadRoles(user: User | null): Promise<AppRole[]> {
      if (!user) return [];
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
      return (data ?? []).map((r) => r.role as AppRole);
    }

    function apply(session: Session | null) {
      const user = session?.user ?? null;
      loadRoles(user).then((roles) => {
        if (!mounted) return;
        setState({
          user,
          session,
          loading: false,
          roles,
          isFounder: roles.includes("founder"),
          isAdmin: roles.includes("admin") || roles.includes("founder"),
          isSeller: roles.includes("seller"),
        });
      });
    }

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => apply(session));
    supabase.auth.getSession().then(({ data }) => apply(data.session));
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return state;
}
