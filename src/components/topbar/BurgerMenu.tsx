import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Palette, Languages, Moon, Sun, FileText, Tag } from "lucide-react";
import { useState } from "react";

const categories = [
  "Illustration", "Musik & Sound", "3D & Modelle", "Templates", "Presets",
  "Schrift", "Code-Snippets", "Foto & Video", "Coaching", "Beratung",
];

const themen = ["Perfekt für daheim", "Frisch reingekommen", "Versteckte Perlen", "Community-Picks", "Limitiert"];

export function BurgerMenu() {
  const [open, setOpen] = useState(false);

  return (
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
          <SheetTitle className="font-display text-2xl font-black text-brand-ink">
            Stöbern.
          </SheetTitle>
          <p className="text-sm text-muted-foreground">
            Alles, was du nicht in der Topbar findest.
          </p>
        </SheetHeader>

        <Section icon={<Tag className="h-4 w-4" />} title="Kategorien">
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <button
                key={c}
                className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-brand-ink transition-all hover:-translate-y-0.5 hover:border-brand hover:text-brand"
              >
                {c}
              </button>
            ))}
          </div>
        </Section>

        <Section icon={<Palette className="h-4 w-4" />} title="Themenwelten">
          <ul className="space-y-1.5">
            {themen.map((t) => (
              <li key={t}>
                <button className="w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-brand-ink transition-colors hover:bg-brand-soft">
                  {t}
                </button>
              </li>
            ))}
          </ul>
        </Section>

        <Section icon={<Languages className="h-4 w-4" />} title="Sprache">
          <button className="group flex w-full items-center justify-between rounded-xl border-2 border-dashed border-brand/40 bg-card px-4 py-3 text-left transition-all hover:border-brand hover:bg-brand-soft">
            <div>
              <div className="text-sm font-bold text-brand-ink">🇩🇪 Deutsch</div>
              <div className="text-xs text-muted-foreground">
                Mal eine Flagge, wir erkennen die Sprache ✨
              </div>
            </div>
            <span className="rounded-full bg-brand px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
              Bald
            </span>
          </button>
        </Section>

        <Section icon={<Sun className="h-4 w-4" />} title="Aussehen">
          <div className="flex gap-2">
            <button className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-brand bg-card px-3 py-2 text-sm font-semibold text-brand-ink">
              <Sun className="h-4 w-4" /> Hell
            </button>
            <button className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-card/60 px-3 py-2 text-sm font-medium text-muted-foreground">
              <Moon className="h-4 w-4" /> Dunkel
            </button>
          </div>
        </Section>

        <Section icon={<FileText className="h-4 w-4" />} title="Rechtliches">
          <ul className="space-y-1 text-sm">
            {["Impressum", "AGB", "Datenschutz", "Cookies"].map((l) => (
              <li key={l}>
                <a href="#" className="block rounded-lg px-3 py-1.5 text-muted-foreground hover:bg-card hover:text-brand-ink">
                  {l}
                </a>
              </li>
            ))}
          </ul>
        </Section>
      </SheetContent>
    </Sheet>
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
