import { motion } from "motion/react";
import { ArrowRight, Sparkles, Store, RotateCcw } from "lucide-react";
import { useTheme, HERO_THEMES } from "@/hooks/useTheme";


export function Hero() {
  const { themeId, setTheme, resetTheme } = useTheme();
  const active = HERO_THEMES.find((t) => t.id === themeId) ?? HERO_THEMES[HERO_THEMES.length - 1];
  const list = HERO_THEMES;

  return (
    <section className="relative overflow-hidden">


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

      <div className="relative mx-auto grid max-w-7xl gap-8 px-4 pb-12 pt-8 sm:gap-10 sm:px-6 sm:pb-20 sm:pt-14 md:grid-cols-[1.15fr_1fr] md:pt-20">
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

          <h1 className="mt-5 font-display text-4xl font-black leading-[0.95] tracking-tight text-brand-ink sm:text-6xl md:text-7xl">
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

          <p className="mt-5 max-w-lg text-sm leading-relaxed text-muted-foreground sm:mt-6 sm:text-lg">
            CreaHQ ist der verspielte Marktplatz für{" "}
            <span className="font-semibold text-brand-ink">digitale &amp; physische Produkte, Services und Chatbots</span> von echten Creatorn.
            Stöbern, entdecken, sofort loslegen — oder selbst einen Shop eröffnen.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3 sm:mt-8">
            <button
              onClick={() => document.getElementById("entdecken")?.scrollIntoView({ behavior: "smooth" })}
              className="group inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3.5 text-sm font-bold text-primary-foreground brand-glow transition-transform hover:scale-105"
            >
              Jetzt entdecken
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
            <a
              href="#verkaufen"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-3 text-sm font-semibold text-brand-ink transition-colors hover:border-brand hover:text-brand"
            >
              <Store className="h-4 w-4" />
              Eigenen Shop eröffnen
            </a>
          </div>

          <div className="mt-6 flex items-center gap-4 text-xs text-muted-foreground sm:mt-8">
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

        {/* Theme picker card — applies GLOBALLY */}
        <motion.div
          initial={{ opacity: 0, y: 30, rotate: -2 }}
          animate={{ opacity: 1, y: 0, rotate: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="relative"
        >
          <div className="relative overflow-hidden rounded-[2rem] border border-border bg-brand-soft/60 p-5 brand-glow transition-all duration-500 sm:rounded-[2.5rem] sm:p-8">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs font-bold uppercase tracking-widest text-brand-ink/70">Theme-Mixer</div>
                <div className="mt-1 text-[11px] text-muted-foreground">Tap = ganze Seite ändert die Stimmung.</div>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <div className="inline-flex rounded-full bg-white/70 p-0.5 shadow-sm backdrop-blur">
                  <button
                    onClick={() => setTab("color")}
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                      tab === "color" ? "bg-brand text-primary-foreground" : "text-brand-ink hover:bg-white"
                    }`}
                  >
                    <Palette className="h-3 w-3" /> Farben
                  </button>
                  <button
                    onClick={() => setTab("country")}
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                      tab === "country" ? "bg-brand text-primary-foreground" : "text-brand-ink hover:bg-white"
                    }`}
                  >
                    <Flag className="h-3 w-3" /> Länder
                  </button>
                </div>
                <button
                  onClick={resetTheme}
                  className="inline-flex items-center gap-1 rounded-full bg-white/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-brand-ink shadow-sm backdrop-blur transition-colors hover:bg-white"
                  title="Standard wiederherstellen"
                >
                  <RotateCcw className="h-3 w-3" /> Reset
                </button>
              </div>
            </div>

            <div className="mt-6 font-display text-3xl font-black leading-none text-brand-ink sm:text-4xl">
              {active.label}
              <span className="ml-2 inline-block [animation:wiggle_3s_ease-in-out_infinite]">{active.emoji}</span>
            </div>

            <div
              className={`mt-6 grid gap-2 sm:gap-2.5 ${
                tab === "country" ? "grid-cols-5 sm:grid-cols-5" : "grid-cols-5"
              }`}
            >
              {list.map((t) => {
                const isActive = t.id === themeId;
                const swatchBg = t.kind === "country" && t.swatches
                  ? `linear-gradient(135deg, ${t.swatches[0]} 0%, ${t.swatches[1]} 50%, ${t.swatches[2]} 100%)`
                  : undefined;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    aria-label={`Theme ${t.label}`}
                    title={t.label}
                    className={`grid ${tab === "country" ? "h-11" : "h-14"} place-items-center overflow-hidden rounded-2xl text-2xl shadow-sm backdrop-blur transition-all ${
                      isActive ? "scale-110 ring-2 ring-brand" : "hover:scale-105"
                    }`}
                    style={{ background: swatchBg ?? (isActive ? "#ffffff" : t.softLight) }}
                  >
                    <span className="drop-shadow-sm">{t.emoji}</span>
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-[11px] text-muted-foreground">
              {tab === "country"
                ? "Flaggen-Farben schmelzen in den ganzen Hintergrund. Hell/Dunkel wirkt weiter."
                : "Farben wirken auf die ganze Seite — Hell/Dunkel auch."}
            </p>
          </div>

          {/* Lucky star moved to <LuckyStar /> at section level — wandert über die Seite. */}

          <motion.div
            aria-hidden
            className="absolute -right-3 -top-3 grid h-16 w-16 place-items-center rounded-2xl bg-brand text-2xl text-primary-foreground brand-glow"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            ✦
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
