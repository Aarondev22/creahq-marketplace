import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";
import { FlagLangDoodle } from "@/components/FlagLangDoodle";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const LS_LANG = "creahq:lang";
const LANGS = [
  { code: "de", label: "Deutsch" },
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
  { code: "es", label: "Español" },
  { code: "it", label: "Italiano" },
  { code: "nl", label: "Nederlands" },
  { code: "pl", label: "Polski" },
  { code: "tr", label: "Türkçe" },
];

export const Route = createFileRoute("/spielen")({
  head: () => ({
    meta: [
      { title: "Sprache wählen — CreaHQ" },
      { name: "description", content: "Wähle deine Sprache auf CreaHQ aus einer Liste oder male eine Flagge." },
      { property: "og:title", content: "Sprache wählen — CreaHQ" },
      { property: "og:description", content: "Sprache per Liste oder per Flagge malen einstellen." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SprachePage,
});

function SprachePage() {
  const [mode, setMode] = useState<"list" | "draw">("list");
  const [current, setCurrent] = useState<string | null>(null);
  useEffect(() => { try { setCurrent(localStorage.getItem(LS_LANG)); } catch { /* noop */ } }, []);

  function pick(code: string, label: string) {
    try { localStorage.setItem(LS_LANG, code); } catch { /* noop */ }
    setCurrent(code);
    try { window.dispatchEvent(new CustomEvent("creahq:lang-change", { detail: { lang: code } })); } catch { /* noop */ }
    toast(`Sprache: ${label}`);
  }

  return (
    <PageShell eyebrow="Sprache" title="Sprache wählen" lead="Einfach aus der Liste wählen – oder optional eine Flagge malen.">
      <div className="not-prose grid gap-4">
        <div className="flex gap-2">
          {([["list", "Aus Liste wählen"], ["draw", "Flagge malen"]] as const).map(([k, l]) => (
            <button key={k} type="button" onClick={() => setMode(k)}
              className={`min-h-11 flex-1 rounded-full px-4 text-sm font-bold ${mode === k ? "bg-brand text-primary-foreground" : "border border-border text-foreground"}`}>
              {l}
            </button>
          ))}
        </div>
        {mode === "list" ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {LANGS.map((l) => (
              <button key={l.code} type="button" onClick={() => pick(l.code, l.label)}
                className={`min-h-11 rounded-3xl border px-4 text-sm font-semibold ${current === l.code ? "border-brand bg-brand-soft text-foreground" : "border-border text-foreground"}`}>
                {l.label}
              </button>
            ))}
          </div>
        ) : (
          <FlagLangDoodle />
        )}
      </div>
    </PageShell>
  );
}
