import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Settings, Store, Sun, Moon, Languages, UserRound, ShieldCheck, ArrowLeft, ChevronRight, ExternalLink } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { LanguageSettings } from "@/components/LanguageSettings";
import { AccountSettings } from "@/components/AccountSettings";
import { SettingsContent } from "@/components/SettingsContent";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const sections = [
  { id: "shop", label: "Dein Shop", icon: Store },
  { id: "brightness", label: "Helligkeit", icon: Sun },
  { id: "language", label: "Sprache", icon: Languages },
  { id: "profile", label: "Profil & Name", icon: UserRound },
  { id: "security", label: "Konto & Sicherheit", icon: ShieldCheck },
] as const;

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24) || "shop";
}

export function SettingsDrawer({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [section, setSection] = useState<string | null>(null);
  const { mode, setMode } = useTheme();
  const { user } = useAuth();
  const { data: profile } = useQuery({
    queryKey: ["profile", "settings", user?.id],
    enabled: !!user && open,
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase.from("profiles").select("id, handle, display_name").eq("id", user.id).maybeSingle();
      return data;
    },
  });

  const shopHandle = useMemo(() => {
    if (!profile) return null;
    if (profile.handle) return profile.handle;
    const fromName = slugify(profile.display_name ?? "");
    return fromName !== "shop" ? fromName : profile.id.slice(0, 8);
  }, [profile]);

  const selected = sections.find((s) => s.id === section);

  return (
    <Sheet open={open} onOpenChange={(value) => { onOpenChange(value); if (!value) setSection(null); }}>
      <SheetContent side="left" className="w-[88vw] max-w-[460px] overflow-y-auto bg-background p-0 sm:w-[36vw] sm:min-w-[360px] sm:max-w-[460px]">
        <SheetHeader className="border-b border-border px-6 py-6 text-left">
          <SheetTitle className="flex items-center gap-2 text-xl">
            <Settings className="h-5 w-5" /> Einstellungen
          </SheetTitle>
          <SheetDescription className="text-sm text-muted-foreground">Dein Shop, Profil und Sicherheit.</SheetDescription>
        </SheetHeader>

        <div className="px-6 py-5">
          {!selected ? (
            <nav aria-label="Einstellungen" className="space-y-1">
              {sections.map((s) => (
                <Button key={s.id} variant="ghost" className="h-auto min-h-16 w-full justify-start gap-3 rounded-none border-b border-border px-0 py-3 text-left" onClick={() => setSection(s.id)}>
                  <s.icon className="h-4 w-4" />
                  <span className="flex-1 text-left">{s.label}</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Button>
              ))}
            </nav>
          ) : (
            <>
              <Button variant="ghost" className="mb-5 px-0" onClick={() => setSection(null)}>
                <ArrowLeft className="h-4 w-4" /> Alle Einstellungen
              </Button>
              <h2 className="mb-6 text-xl font-semibold">{selected.label}</h2>

              {section === "brightness" && (
                <div className="grid grid-cols-2 gap-3">
                  <Button variant={mode === "light" ? "secondary" : "outline"} aria-pressed={mode === "light"} className="h-14" onClick={() => setMode("light")}>
                    <Sun className="h-4 w-4" /> Hell
                  </Button>
                  <Button variant={mode === "dark" ? "secondary" : "outline"} aria-pressed={mode === "dark"} className="h-14" onClick={() => setMode("dark")}>
                    <Moon className="h-4 w-4" /> Dunkel
                  </Button>
                </div>
              )}

              {section === "language" && <LanguageSettings />}

              {(section === "shop" || section === "profile" || section === "security") && !user && (
                <Button asChild>
                  <Link to="/auth" search={{ mode: "signin" }} onClick={() => onOpenChange(false)}>
                    Anmelden
                  </Link>
                </Button>
              )}

              {user && section === "profile" && <SettingsContent />}
              {user && section === "security" && <AccountSettings />}

              {user && section === "shop" && (
                <div className="space-y-3">
                  {shopHandle ? (
                    <Button asChild variant="outline" className="min-h-12 w-full justify-between">
                      <Link to="/shop/$handle" params={{ handle: shopHandle }} onClick={() => onOpenChange(false)}>
                        Meinen Shop ansehen
                      </Link>
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button asChild variant="outline" className="min-h-12 w-full justify-between">
                      <Link to="/shop/$handle" params={{ handle: profile?.id ?? "shop" }} onClick={() => onOpenChange(false)}>
                        Meinen Shop ansehen
                      </Link>
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  )}

                  <Button asChild variant="outline" className="min-h-12 w-full justify-between">
                    <Link to="/einstellungen" search={{ section: "shop" }} onClick={() => onOpenChange(false)}>
                      Shop-Profil bearbeiten
                    </Link>
                    <ChevronRight className="h-4 w-4" />
                  </Button>

                  <Button asChild className="min-h-12 w-full justify-between">
                    <Link to="/einstellungen" search={{ section: "studio" }} onClick={() => onOpenChange(false)}>
                      Shop-Studio
                    </Link>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
