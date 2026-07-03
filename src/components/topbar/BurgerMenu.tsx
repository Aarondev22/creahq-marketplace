import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Palette, Languages, Moon, Sun, FileText, Tag, Shield, Store, Gamepad2, Ticket } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { AdminPanel } from "@/components/admin/AdminPanel";

const categories = [
  { label: "Illustration", slug: "illustration" },
  { label: "Musik & Sound", slug: "musik" },
  { label: "3D & Modelle", slug: "3d" },
  { label: "Templates", slug: "templates" },
  { label: "Presets", slug: "presets" },
  { label: "Schrift", slug: "schrift" },
  { label: "Code-Snippets", slug: "code" },
  { label: "Foto & Video", slug: "fotovideo" },
  { label: "Coaching", slug: "coaching" },
  { label: "Beratung", slug: "beratung" },
];

const themen = [
  { label: "Perfekt für daheim", q: "daheim" },
  { label: "Frisch reingekommen", q: "" },
  { label: "Versteckte Perlen", q: "perlen" },
  { label: "Community-Picks", q: "community" },
  { label: "Limitiert", q: "limitiert" },
];

const legal = [
  { label: "Impressum", to: "/impressum" },
  { label: "AGB", to: "/agb" },
  { label: "Datenschutz", to: "/datenschutz" },
  { label: "Cookies", to: "/cookies" },
];

export function BurgerMenu() {
  const [open, setOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const { isAdmin, isFounder } = useAuth();
  const { mode, setMode } = useTheme();
  const navigate = useNavigate();
  const close = () => setOpen(false);

  return (
    <>
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          aria-label="Menü öffnen"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-border bg-card text-brand-ink transition-colors hover:bg-brand-soft"
        >
          <Menu className="h-5 w-5" />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[88vw] max-w-sm overflow-y-auto bg-surface-warm p-0">
        <SheetHeader className="border-b border-border bg-card/60 px-6 py-5">
          <SheetTitle className="font-display text-2xl font-black text-brand-ink">Stöbern.</SheetTitle>
          <p className="text-sm text-muted-foreground">Alles, was du nicht in der Topbar findest.</p>
        </SheetHeader>

        <Section icon={<Tag className="h-4 w-4" />} title="Kategorien">
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <button
                key={c.slug}
                onClick={() => { close(); navigate({ to: "/browse", search: { q: c.label, cat: c.slug } as never }); }}
                className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-brand-ink transition-all hover:-translate-y-0.5 hover:border-brand hover:text-brand"
              >
                {c.label}
              </button>
            ))}
          </div>
          <Link to="/kategorien" onClick={close} className="mt-3 inline-block text-xs font-semibold text-brand hover:underline">
            Alle Kategorien →
          </Link>
        </Section>

        <Section icon={<Gamepad2 className="h-4 w-4" />} title="Spielen & Codes">
          <ul className="space-y-1.5">
            <li>
              <button
                onClick={() => { close(); navigate({ to: "/spielen" }); }}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-brand-ink transition-colors hover:bg-brand-soft"
              >
                <span className="text-base">✨</span> Glücksstern-Sammler
              </button>
            </li>
            <li>
              <button
                onClick={() => { close(); navigate({ to: "/spielen" }); }}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-brand-ink transition-colors hover:bg-brand-soft"
              >
                <span className="text-base">🏳️</span> Sprache per Flagge malen
              </button>
            </li>
            <li>
              <button
                onClick={() => { close(); navigate({ to: "/browse" }); }}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-brand-ink transition-colors hover:bg-brand-soft"
              >
                <span className="text-base">🎨</span> Doodle-Suche (in der Suchleiste)
              </button>
            </li>
            <li>
              <button
                onClick={() => { close(); navigate({ to: "/redeem" }); }}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-brand-ink transition-colors hover:bg-brand-soft"
              >
                <Ticket className="h-4 w-4" /> Code einlösen
              </button>
            </li>
          </ul>
        </Section>

        <Section icon={<Palette className="h-4 w-4" />} title="Themenwelten">
          <ul className="space-y-1.5">
            {themen.map((t) => (
              <li key={t.label}>
                <button
                  onClick={() => { close(); navigate({ to: "/browse", search: { q: t.q } as never }); }}
                  className="w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-brand-ink transition-colors hover:bg-brand-soft"
                >
                  {t.label}
                </button>
              </li>
            ))}
          </ul>
        </Section>

        <Section icon={<Languages className="h-4 w-4" />} title="Sprache">
          <button
            onClick={() => { close(); navigate({ to: "/spielen" }); }}
            className="group flex w-full items-center justify-between rounded-xl border-2 border-dashed border-brand/40 bg-card px-4 py-3 text-left transition-all hover:border-brand hover:bg-brand-soft"
          >
            <div>
              <div className="text-sm font-bold text-brand-ink">🇩🇪 Deutsch</div>
              <div className="text-xs text-muted-foreground">Mal eine Flagge im Mini-Game ✨</div>
            </div>
            <span className="rounded-full bg-brand px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">Bald</span>
          </button>
        </Section>

        <Section icon={mode === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />} title="Aussehen">
          <div className="flex gap-2">
            <button
              onClick={() => setMode("light")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors ${
                mode === "light" ? "border-brand bg-card text-brand-ink" : "border-border bg-card/60 text-muted-foreground hover:text-brand-ink"
              }`}
            >
              <Sun className="h-4 w-4" /> Hell
            </button>
            <button
              onClick={() => setMode("dark")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors ${
                mode === "dark" ? "border-brand bg-card text-brand-ink" : "border-border bg-card/60 text-muted-foreground hover:text-brand-ink"
              }`}
            >
              <Moon className="h-4 w-4" /> Dunkel
            </button>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">Wirkt auf alle Seiten und wird gespeichert.</p>
        </Section>

        <Section icon={<FileText className="h-4 w-4" />} title="Rechtliches">
          <ul className="space-y-1 text-sm">
            {legal.map((l) => (
              <li key={l.label}>
                <Link to={l.to} onClick={close} className="block rounded-lg px-3 py-1.5 text-muted-foreground hover:bg-card hover:text-brand-ink">
                  {l.label}
                </Link>
              </li>
            ))}
            <li><Link to="/gebuehren" onClick={close} className="block rounded-lg px-3 py-1.5 text-muted-foreground hover:bg-card hover:text-brand-ink">Gebühren</Link></li>
            <li><Link to="/hilfe" onClick={close} className="block rounded-lg px-3 py-1.5 text-muted-foreground hover:bg-card hover:text-brand-ink">Hilfe & FAQ</Link></li>
            <li><Link to="/kontakt" onClick={close} className="block rounded-lg px-3 py-1.5 text-muted-foreground hover:bg-card hover:text-brand-ink">Kontakt</Link></li>
            <li><Link to="/verkaufen/guide" onClick={close} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-muted-foreground hover:bg-card hover:text-brand-ink"><Store className="h-3.5 w-3.5" />Verkäufer-Guide</Link></li>
          </ul>
        </Section>

        {isAdmin && (
          <Section icon={<Shield className="h-4 w-4" />} title={isFounder ? "Founder-Tools" : "Admin-Tools"}>
            <button
              onClick={() => { setAdminOpen(true); close(); }}
              className="w-full rounded-xl bg-gradient-to-r from-brand to-fuchsia-600 px-4 py-3 text-left text-sm font-bold text-white shadow-sm transition-transform hover:scale-[1.02]"
            >
              🛠️ Admin-Panel öffnen
            </button>
          </Section>
        )}
      </SheetContent>
    </Sheet>
    <AdminPanel open={adminOpen} onClose={() => setAdminOpen(false)} />
    </>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-border px-6 py-5 last:border-b-0">
      <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-brand">
        {icon}
        {title}
      </div>
      {children}
    </div>
  );
}
