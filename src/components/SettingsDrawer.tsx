import { useState } from "react";
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
  { id: "shop", label: "Dein Shop", icon: Store }, { id: "brightness", label: "Helligkeit", icon: Sun },
  { id: "language", label: "Sprache", icon: Languages }, { id: "profile", label: "Profil & Name", icon: UserRound },
  { id: "security", label: "Konto & Sicherheit", icon: ShieldCheck },
] as const;
export function SettingsDrawer({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [section, setSection] = useState<string | null>(null);
  const { mode, setMode } = useTheme(); const { user } = useAuth();
  const { data: profile } = useQuery({ queryKey: ["profile", "settings", user?.id], enabled: !!user && open, queryFn: async () => {
    if (!user) return null;
    const { data } = await supabase.from("profiles").select("handle").eq("id", user.id).maybeSingle(); return data;
  } });
  const selected = sections.find(s => s.id === section);
  return <Sheet open={open} onOpenChange={value => { onOpenChange(value); if (!value) setSection(null); }}>
    <SheetContent side="left" className="w-[88vw] max-w-[460px] overflow-y-auto bg-background p-0 sm:w-[36vw] sm:min-w-[360px] sm:max-w-[460px]">
      <SheetHeader className="border-b border-border px-6 py-6 text-left"><SheetTitle className="flex items-center gap-2 text-xl"><Settings className="h-5 w-5" /> Einstellungen</SheetTitle><SheetDescription className="sr-only">Shop, Helligkeit, Sprache, Profil und Kontosicherheit</SheetDescription></SheetHeader>
      <div className="px-6 py-5">
        {!selected ? <nav aria-label="Einstellungen">{sections.map((s, i) => <Button key={s.id} variant="ghost" className="h-auto min-h-16 w-full justify-start gap-3 rounded-none border-b border-border px-0 text-left" onClick={() => setSection(s.id)}><s.icon className="text-muted-foreground" /><span className="flex-1">{i + 1}. {s.label}</span><ChevronRight /></Button>)}</nav> : <>
          <Button variant="ghost" className="mb-5 px-0" onClick={() => setSection(null)}><ArrowLeft /> Alle Einstellungen</Button>
          <h2 className="mb-6 text-xl font-semibold">{selected.label}</h2>
          {section === "brightness" && <div className="grid grid-cols-2 gap-3"><Button variant={mode === "light" ? "secondary" : "outline"} aria-pressed={mode === "light"} className="h-14" onClick={() => setMode("light")}><Sun /> Hell</Button><Button variant={mode === "dark" ? "secondary" : "outline"} aria-pressed={mode === "dark"} className="h-14" onClick={() => setMode("dark")}><Moon /> Dunkel</Button></div>}
          {section === "language" && <LanguageSettings />}
          {(section === "shop" || section === "profile" || section === "security") && !user && <Button asChild><Link to="/auth" search={{ mode: "signin" }} onClick={() => onOpenChange(false)}>Anmelden</Link></Button>}
          {user && section === "profile" && <SettingsContent />}
          {user && section === "security" && <AccountSettings />}
          {user && section === "shop" && <div className="space-y-3">
            {profile?.handle && <Button asChild variant="outline" className="min-h-12 w-full justify-between"><Link to="/shop/$handle" params={{ handle: profile.handle }} onClick={() => onOpenChange(false)}>Meinen Shop ansehen<ExternalLink /></Link></Button>}
            <Button asChild variant="outline" className="min-h-12 w-full justify-between"><Link to="/einstellungen" search={{ section: "shop" }} onClick={() => onOpenChange(false)}>Shop-Profil bearbeiten<ChevronRight /></Link></Button>
            <Button asChild className="min-h-12 w-full justify-between"><Link to="/einstellungen" search={{ section: "studio" }} onClick={() => onOpenChange(false)}>Shop-Studio<ChevronRight /></Link></Button>
          </div>}
        </>}
      </div>
    </SheetContent>
  </Sheet>;
}
