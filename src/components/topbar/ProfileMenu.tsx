import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, Store, LogIn, UserPlus, LayoutDashboard, LogOut } from "lucide-react";
import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

import { FounderBadge } from "@/components/FounderBadge";
import { Sparkles } from "lucide-react";

export function ProfileMenu() {
  const { user, loading, isFounder, isAdmin } = useAuth();
  const navigate = useNavigate();
  const router = useRouter();
  const qc = useQueryClient();

  async function handleSignOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    router.invalidate();
    navigate({ to: "/", replace: true });
  }

  const initial = (user?.user_metadata?.display_name ?? user?.email ?? "?").toString().slice(0, 1).toUpperCase();

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
              <span className="truncate text-sm">{user.email}</span>
              {isFounder && <FounderBadge />}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/dashboard"><LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/dashboard"><Store className="mr-2 h-4 w-4" /> Verkaufen</Link>
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
              <Link to="/auth"><LogIn className="mr-2 h-4 w-4" /> Anmelden</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/auth"><UserPlus className="mr-2 h-4 w-4" /> Registrieren</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/auth"><Store className="mr-2 h-4 w-4" /> Eigenen Shop eröffnen</Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
