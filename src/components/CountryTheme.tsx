import { useEffect, useState } from "react";
import { toast } from "sonner";
import { RotateCcw } from "lucide-react";

type Country = {
  code: string;
  name: string;
  emoji: string;
  /** Two-color palette used as brand / brand-soft on the whole site. */
  brand: string;        // oklch triplet: "L C H"
  soft: string;         // oklch triplet
  swatches: string[];   // display-only hex swatches
};

const COUNTRIES: Country[] = [
  { code: "de", name: "Deutschland", emoji: "🇩🇪", brand: "0.65 0.19 40",  soft: "0.94 0.05 80",  swatches: ["#000000","#DD0000","#FFCC00"] },
  { code: "fr", name: "Frankreich",  emoji: "🇫🇷", brand: "0.55 0.22 260", soft: "0.94 0.05 20",  swatches: ["#0055A4","#FFFFFF","#EF4135"] },
  { code: "it", name: "Italien",     emoji: "🇮🇹", brand: "0.6 0.19 145",  soft: "0.93 0.06 25",  swatches: ["#008C45","#F4F5F0","#CD212A"] },
  { code: "es", name: "Spanien",     emoji: "🇪🇸", brand: "0.65 0.2 40",   soft: "0.94 0.15 90",  swatches: ["#AA151B","#F1BF00","#AA151B"] },
  { code: "nl", name: "Niederlande", emoji: "🇳🇱", brand: "0.55 0.2 40",   soft: "0.94 0.06 260", swatches: ["#AE1C28","#FFFFFF","#21468B"] },
  { code: "se", name: "Schweden",    emoji: "🇸🇪", brand: "0.55 0.2 250",  soft: "0.92 0.14 90",  swatches: ["#006AA7","#FECC00"] },
  { code: "br", name: "Brasilien",   emoji: "🇧🇷", brand: "0.65 0.19 145", soft: "0.93 0.14 95",  swatches: ["#009C3B","#FFDF00","#002776"] },
  { code: "jp", name: "Japan",       emoji: "🇯🇵", brand: "0.6 0.24 25",   soft: "0.96 0.01 0",   swatches: ["#BC002D","#FFFFFF"] },
  { code: "us", name: "USA",         emoji: "🇺🇸", brand: "0.55 0.2 260",  soft: "0.93 0.14 25",  swatches: ["#B22234","#FFFFFF","#3C3B6E"] },
  { code: "gb", name: "UK",          emoji: "🇬🇧", brand: "0.4 0.2 260",   soft: "0.93 0.12 25",  swatches: ["#012169","#FFFFFF","#C8102E"] },
  { code: "gr", name: "Griechenland",emoji: "🇬🇷", brand: "0.55 0.18 240", soft: "0.96 0.02 240", swatches: ["#0D5EAF","#FFFFFF"] },
  { code: "mx", name: "Mexiko",      emoji: "🇲🇽", brand: "0.55 0.16 150", soft: "0.93 0.14 30",  swatches: ["#006847","#FFFFFF","#CE1126"] },
];

const LS_KEY = "creahq:country-theme";

function apply(c: Country) {
  const root = document.documentElement;
  root.style.setProperty("--brand", `oklch(${c.brand})`);
  root.style.setProperty("--brand-soft", `oklch(${c.soft})`);
}
function clear() {
  const root = document.documentElement;
  root.style.removeProperty("--brand");
  root.style.removeProperty("--brand-soft");
}

export function CountryTheme() {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    try {
      const id = localStorage.getItem(LS_KEY);
      if (!id) return;
      const c = COUNTRIES.find((x) => x.code === id);
      if (c) { apply(c); setActive(c.code); }
    } catch { /* noop */ }
  }, []);

  function pick(c: Country) {
    apply(c);
    setActive(c.code);
    try { localStorage.setItem(LS_KEY, c.code); } catch { /* noop */ }
    toast(`${c.emoji} Farben von ${c.name} übernommen.`);
  }

  function reset() {
    clear();
    setActive(null);
    try { localStorage.removeItem(LS_KEY); } catch { /* noop */ }
    toast("Farben zurückgesetzt.");
  }

  return (
    <div className="rounded-3xl border border-border bg-card p-6 sm:p-8">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-xl font-black text-brand-ink sm:text-2xl">Länder-Farben</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Wähl ein Land — die ganze Seite übernimmt seine Flaggen-Farben.
          </p>
        </div>
        <button
          onClick={reset}
          className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-3 py-1.5 text-xs font-bold text-brand-ink hover:bg-brand hover:text-primary-foreground"
        >
          <RotateCcw className="h-3 w-3" /> Reset
        </button>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
        {COUNTRIES.map((c) => {
          const isActive = active === c.code;
          return (
            <button
              key={c.code}
              onClick={() => pick(c)}
              className={`group flex flex-col items-center gap-1.5 rounded-2xl border-2 p-3 transition-all ${
                isActive ? "border-brand bg-brand-soft" : "border-border bg-background hover:border-brand"
              }`}
              aria-pressed={isActive}
            >
              <span className="text-3xl">{c.emoji}</span>
              <span className="text-[11px] font-bold text-brand-ink">{c.name}</span>
              <div className="flex gap-0.5">
                {c.swatches.map((s, i) => (
                  <span key={i} className="h-2 w-3 rounded-sm ring-1 ring-black/10" style={{ background: s }} />
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
