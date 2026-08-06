import { useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, LogIn, UserPlus, LayoutDashboard, LogOut, ShoppingCart, Settings } from "lucide-react";
import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { FounderBadge } from "@/components/FounderBadge";
import { useCart } from "@/lib/cart";

export function ProfileMenu() {
  const { user, loading, isFounder, isAdmin } = useAuth();
  const navigate = useNavigate();
  const router = useRouter();
  const qc = useQueryClient();
  const { totalCount } = useCart();
  const [displayName, setDisplayName] = useState<string | null>(null);

  useEffect(() => {
  let active = true;

  async function load() {
    if (!user) {
      setDisplayName(null);
      return;
    }
    const { data } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .maybeSingle();
    if (active) setDisplayName(data?.display_name ?? null);
  }

  void load();

  function onProfileUpdated(e: Event) {
    const detail = (e as CustomEvent<{ display_name?: string }>).detail;
    if (detail?.display_name) setDisplayName(detail.display_name);
    else void load();
  }

  window.addEventListener("creahq:profile-updated", onProfileUpdated);
  return () => {
    active = false;
    window.removeEventListener("creahq:profile-updated", onProfileUpdated);
  };
}, [user?.id]);

  async function handleSignOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    router.invalidate();
    navigate({ to: "/", replace: true });
  }

  const shownName =
  displayName ??
  (user?.user_metadata?.display_name as string | undefined) ??
  "";
  const initial = (shownName || "?").toString().slice(0, 1).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label="Profil"
          className={`relative grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-black text-primary-foreground transition-transform hover:scale-105 ${isFounder ? "bg-gradient-to-br from-brand to-fuchsia-600 ring-2 ring-amber-300" : "bg-gradient-to-br from-brand to-brand-ink"}`}
        >
          {user ? initial : <User className="h-5 w-5" />}
          {isFounder && <span className="absolute -bottom-1 -right-1 grid h-4 w-4 place-items-center rounded-full bg-amber-300 text-[8px]">👑</span>}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        {loading ? (
          <DropdownMenuLabel>Lade …</DropdownMenuLabel>
        ) : user ? (
          <>
            <DropdownMenuLabel className="flex flex-col gap-1">
              <span className="truncate text-sm font-bold text-brand-ink">{shownName}</span>
              {isFounder && <FounderBadge />}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/dashboard" search={{ tab: "overview" as const }}><LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/einstellungen"><Settings className="mr-2 h-4 w-4" /> Einstellungen</Link>
            </DropdownMenuItem>

            <DropdownMenuItem asChild>
              <Link to="/warenkorb">
                <ShoppingCart className="mr-2 h-4 w-4" />
                Warenkorb
                {totalCount > 0 && (
                  <span className="ml-auto rounded-full bg-brand px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                    {totalCount}
                  </span>
                )}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" /> Abmelden
            </DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuLabel>Willkommen bei CreaHQ</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link to="/auth" search={{ mode: "signin" }}><LogIn className="mr-2 h-4 w-4" /> Anmelden</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/auth" search={{ mode: "signup" }}><UserPlus className="mr-2 h-4 w-4" /> Registrieren</Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}