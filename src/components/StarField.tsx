import { motion } from "motion/react";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Sparkles, Star as StarIcon } from "lucide-react";

const LS_ENABLED = "creahq:stars-enabled";
const LS_FOUND = "creahq:star-found";

function randPos() {
  return {
    top: `${2 + Math.random() * 96}%`,
    left: `${3 + Math.random() * 92}%`,
  };
}

/**
 * A field of lucky stars scattered across the full homepage.
 * - Stars are positioned absolutely inside the nearest relative parent,
 *   so wrap the page in a `relative` container that spans full height.
 * - Each star re-randomizes its own position on click and bumps a counter.
 * - A floating pill lets the user turn the field on/off (persisted).
 */
export function StarField({ count = 6 }: { count?: number }) {
  const [enabled, setEnabled] = useState(true);
  const [seeds, setSeeds] = useState<{ id: number; pos: { top: string; left: string } }[]>(
    () => Array.from({ length: count }, (_, i) => ({ id: i, pos: randPos() }))
  );

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_ENABLED);
      if (raw !== null) setEnabled(raw === "1");
    } catch { /* noop */ }
  }, []);

  const toggle = useCallback(() => {
    setEnabled((v) => {
      const nv = !v;
      try { localStorage.setItem(LS_ENABLED, nv ? "1" : "0"); } catch { /* noop */ }
      toast(nv ? "✨ Sterne wieder an." : "Sterne aus — ruhig hier jetzt.");
      return nv;
    });
  }, []);

  const catchStar = useCallback((id: number) => {
    try {
      const cur = Number(localStorage.getItem(LS_FOUND) ?? 0);
      localStorage.setItem(LS_FOUND, String(cur + 1));
    } catch { /* noop */ }
    toast("✨ Glücksstern gefangen!");
    setSeeds((arr) => arr.map((s) => (s.id === id ? { ...s, pos: randPos() } : s)));
  }, []);

  return (
    <>
      {enabled && (
        <div aria-hidden={false} className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
          {seeds.map((s) => (
            <motion.button
              key={`${s.id}-${s.pos.top}-${s.pos.left}`}
              onClick={() => catchStar(s.id)}
              aria-label="Glücksstern — klicken zum Sammeln"
              title="Glücksstern!"
              className="pointer-events-auto absolute grid h-11 w-11 -translate-x-1/2 -translate-y-1/2 cursor-pointer place-items-center rounded-full bg-amber-300 text-lg text-amber-900 shadow-lg ring-2 ring-amber-200/70 transition-transform hover:scale-110 sm:h-12 sm:w-12"
              style={{ top: s.pos.top, left: s.pos.left }}
              initial={{ scale: 0, rotate: -180, opacity: 0 }}
              animate={{ scale: 1, rotate: [0, 360], opacity: 1 }}
              transition={{
                scale: { duration: 0.4 },
                opacity: { duration: 0.4 },
                rotate: { duration: 24 + s.id * 2, repeat: Infinity, ease: "linear" },
              }}
              whileTap={{ scale: 1.35 }}
            >
              ★
            </motion.button>
          ))}
        </div>
      )}

      {/* Toggle pill — fixed, always available on the homepage */}
      <button
        onClick={toggle}
        aria-pressed={enabled}
        title={enabled ? "Glückssterne ausschalten" : "Glückssterne einschalten"}
        className={`fixed bottom-4 right-4 z-40 inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-2 text-xs font-bold shadow-lg backdrop-blur transition-colors ${
          enabled
            ? "bg-amber-300/90 text-amber-900 hover:bg-amber-300"
            : "bg-card/90 text-brand-ink hover:bg-brand-soft"
        }`}
      >
        {enabled ? <StarIcon className="h-3.5 w-3.5 fill-current" /> : <Sparkles className="h-3.5 w-3.5" />}
        {enabled ? "Sterne an" : "Sterne aus"}
      </button>
    </>
  );
}
