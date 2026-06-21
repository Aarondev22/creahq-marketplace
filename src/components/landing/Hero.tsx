import { motion, Reorder } from "motion/react";
import { useEffect, useState } from "react";
import { ArrowRight, Sparkles, Store } from "lucide-react";

type Theme = { id: string; label: string; emoji: string; bg: string; ink: string };

const initialThemes: Theme[] = [
  { id: "candy",  label: "Candy",   emoji: "🍭", bg: "from-pink-200 to-fuchsia-200",  ink: "text-fuchsia-900" },
  { id: "sun",    label: "Sun",     emoji: "🌞", bg: "from-amber-100 to-orange-200",  ink: "text-orange-900" },
  { id: "forest", label: "Forest",  emoji: "🌿", bg: "from-emerald-100 to-lime-200",  ink: "text-emerald-900" },
  { id: "ocean",  label: "Ocean",   emoji: "🌊", bg: "from-sky-100 to-cyan-200",      ink: "text-sky-900" },
  { id: "noir",   label: "Noir",    emoji: "🌙", bg: "from-zinc-200 to-zinc-300",     ink: "text-zinc-900" },
];

export function Hero() {
  const [themes, setThemes] = useState<Theme[]>(initialThemes);
  const active = themes[0];

  useEffect(() => {
    try {
      const stored = localStorage.getItem("creahq:hero-themes");
      if (stored) setThemes(JSON.parse(stored));
    } catch {/* noop */}
  }, []);

  useEffect(() => {
    try { localStorage.setItem("creahq:hero-themes", JSON.stringify(themes)); } catch {/* noop */}
  }, [themes]);

  return (
    <section className="relative overflow-hidden">
      {/* Animated blobs */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -left-32 top-10 h-80 w-80 bg-brand/25 [animation:blob_18s_ease-in-out_infinite]"
        animate={{ rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute right-0 top-32 h-72 w-72 bg-amber-200/60 [animation:blob_22s_ease-in-out_infinite]"
        animate={{ rotate: -360 }}
        transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
      />

      <div className="relative mx-auto grid max-w-7xl gap-10 px-4 pb-16 pt-10 sm:px-6 sm:pb-20 sm:pt-14 md:grid-cols-[1.15fr_1fr] md:pt-20">
        <div className="flex flex-col justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex w-fit items-center gap-2 rounded-full border border-brand/30 bg-brand-soft px-3 py-1 text-xs font-semibold text-brand-ink"
          >
            <Sparkles className="h-3.5 w-3.5 text-brand" />
            Marktplatz für Creator-Sachen
          </motion.div>

          <h1 className="mt-5 font-display text-[2.5rem] font-black leading-[0.95] tracking-tight text-brand-ink sm:text-6xl md:text-7xl">
            Mach{" "}
            <span className="relative inline-block">
              <span className="relative z-10 text-brand">deins.</span>
              <motion.span
                aria-hidden
                className="absolute inset-x-0 bottom-1 -z-0 h-4 rounded-full bg-amber-200"
                initial={{ scaleX: 0, originX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.5, duration: 0.6, ease: "easeOut" }}
              />
            </span>
            <br />
            Find{" "}
            <span className="italic text-brand-ink/80">ihres.</span>
          </h1>

          <p className="mt-6 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
            CreaHQ ist der verspielte Marktplatz für{" "}
            <span className="font-semibold text-brand-ink">digitale Produkte und Services</span> von echten Creatorn.
            Stöbern, entdecken, sofort runterladen — oder selbst einen Shop eröffnen und loslegen.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href="#entdecken"
              className="group inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3.5 text-sm font-bold text-primary-foreground brand-glow transition-transform hover:scale-105"
            >
              Jetzt entdecken
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </a>
            <a
              href="#verkaufen"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-3 text-sm font-semibold text-brand-ink transition-colors hover:border-brand hover:text-brand"
            >
              <Store className="h-4 w-4" />
              Eigenen Shop eröffnen
            </a>
          </div>

          <div className="mt-8 flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex -space-x-2">
              {["🎨","🎧","✏️","📦","🧩"].map((e, i) => (
                <div key={i} className="grid h-7 w-7 place-items-center rounded-full border-2 border-surface bg-brand-soft text-xs">
                  {e}
                </div>
              ))}
            </div>
            <span>Werkstatt geöffnet — Creator willkommen.</span>
          </div>
        </div>

        {/* Theme shuffle card */}
        <motion.div
          initial={{ opacity: 0, y: 30, rotate: -2 }}
          animate={{ opacity: 1, y: 0, rotate: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="relative"
        >
          <div className={`relative overflow-hidden rounded-[2.5rem] border border-border bg-gradient-to-br ${active.bg} p-6 brand-glow transition-all duration-500 sm:p-8`}>
            <div className="flex items-start justify-between">
              <div className={`text-xs font-bold uppercase tracking-widest ${active.ink}`}>
                Vorschau-Stil
              </div>
              <div className="rounded-full bg-white/70 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-brand-ink backdrop-blur">
                Nur diese Box
              </div>
            </div>
            <div className={`mt-8 font-display text-5xl font-black leading-none ${active.ink}`}>
              {active.label}
              <span className="ml-2 inline-block [animation:wiggle_3s_ease-in-out_infinite]">{active.emoji}</span>
            </div>
            <div className={`mt-2 text-sm ${active.ink} opacity-75`}>
              Plättchen schieben = Stimmung mixen. Ändert nichts an der Website.
            </div>


            <Reorder.Group
              axis="x"
              values={themes}
              onReorder={setThemes}
              className="mt-8 flex gap-2 overflow-x-auto pb-1 no-scrollbar"
            >
              {themes.map((t) => (
                <Reorder.Item
                  key={t.id}
                  value={t}
                  whileDrag={{ scale: 1.1, rotate: 4, zIndex: 20 }}
                  className="grid h-16 w-16 shrink-0 cursor-grab place-items-center rounded-2xl bg-white/80 text-2xl shadow-md backdrop-blur active:cursor-grabbing"
                >
                  {t.emoji}
                </Reorder.Item>
              ))}
            </Reorder.Group>
          </div>

          {/* Floating stickers */}
          <motion.div
            aria-hidden
            className="absolute -right-3 -top-3 grid h-16 w-16 place-items-center rounded-2xl bg-brand text-2xl text-primary-foreground brand-glow"
            style={{ ["--rot" as never]: "12deg" }}
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            ✦
          </motion.div>
          <motion.div
            aria-hidden
            className="absolute -bottom-4 -left-4 grid h-14 w-14 place-items-center rounded-full bg-amber-300 text-xl"
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
          >
            ★
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
