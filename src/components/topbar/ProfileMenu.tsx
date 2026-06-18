import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, Store, LogIn, UserPlus, LayoutDashboard, ShoppingBag, Settings } from "lucide-react";

export function ProfileMenu() {
  // MVP: nicht eingeloggt — Auth kommt im nächsten Schritt
  const isAuthed = false;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label="Profil"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand to-brand-ink text-primary-foreground transition-transform hover:scale-105"
        >
          <User className="h-5 w-5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {isAuthed ? (
          <>
            <DropdownMenuLabel>Mein Konto</DropdownMenuLabel>
            <DropdownMenuItem><LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard</DropdownMenuItem>
            <DropdownMenuItem><ShoppingBag className="mr-2 h-4 w-4" /> Meine Käufe</DropdownMenuItem>
            <DropdownMenuItem><Store className="mr-2 h-4 w-4" /> Verkaufen</DropdownMenuItem>
            <DropdownMenuItem><Settings className="mr-2 h-4 w-4" /> Profil</DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuLabel>Willkommen bei CreaHQ</DropdownMenuLabel>
            <DropdownMenuItem><LogIn className="mr-2 h-4 w-4" /> Anmelden</DropdownMenuItem>
            <DropdownMenuItem><UserPlus className="mr-2 h-4 w-4" /> Registrieren</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Store className="mr-2 h-4 w-4" /> Eigenen Shop eröffnen
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
