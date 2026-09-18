import { motion } from "motion/react";
import { ArrowRight, Sparkles, Store, RotateCcw, Package, WandSparkles } from "lucide-react";
import { useTheme, HERO_THEMES } from "@/hooks/useTheme";


export function Hero() {
  const { themeId, setTheme, resetTheme } = useTheme();
  const active = HERO_THEMES.find((t) => t.id === themeId) ?? HERO_THEMES[HERO_THEMES.length - 1];
  const list = HERO_THEMES;

  return (
    <section className="relative overflow-hidden pb-10 pt-5 sm:pb-16 sm:pt-10">


      <motion.div
        aria-hidden
        className="pointer-events-none absolute -left-24 top-12 h-64 w-72 rounded-[38%_62%_55%_45%] bg-confetti-coral/25 [animation:blob_18s_ease-in-out_infinite]"
        animate={{ rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -right-20 top-6 h-72 w-64 rounded-[62%_38%_45%_55%] bg-confetti-sun/55 [animation:blob_22s_ease-in-out_infinite]"
        animate={{ rotate: -360 }}
        transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
      />

      <div className="relative mx-auto grid max-w-7xl gap-4 px-4 sm:px-6 lg:grid-cols-12 lg:grid-rows-[auto_auto]">
        <div className="relative overflow-hidden rounded-[2rem] bg-brand p-7 text-primary-foreground shadow-xl sm:p-10 lg:col-span-7 lg:row-span-2 lg:min-h-[540px] lg:p-14">
          <div className="confetti-grid absolute inset-0 opacity-40" aria-hidden="true" />
          <div className="absolute -bottom-16 -right-10 h-56 w-56 rounded-[35%_65%_45%_55%] bg-confetti-coral" aria-hidden="true" />
          <div className="relative flex h-full flex-col justify-between">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex w-fit items-center gap-2 rounded-full bg-card/15 px-3 py-1 text-xs font-bold text-primary-foreground backdrop-blur"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Marktplatz für Creator-Sachen
          </motion.div>

          <div>
          <h1 className="mt-10 font-display text-5xl font-black leading-[0.9] text-primary-foreground sm:text-7xl lg:text-8xl">
            Mach{" "}
            <span className="relative inline-block">
              <span className="relative z-10 text-confetti-sun">deins.</span>
              <motion.span
                aria-hidden
                className="absolute inset-x-0 bottom-1 -z-0 h-4 rounded-full bg-confetti-mint"
                initial={{ scaleX: 0, originX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.5, duration: 0.6, ease: "easeOut" }}
              />
            </span>
            <br />
            Find{" "}
            <span className="italic text-primary-foreground/80">ihres.</span>
          </h1>

          <p className="mt-6 max-w-xl text-sm leading-relaxed text-primary-foreground/80 sm:text-lg">
            CreaHQ ist der verspielte Marktplatz für{" "}
            <span className="font-bold text-primary-foreground">digitale &amp; physische Produkte, Services und Chatbots</span> von echten Creatorn.
            Stöbern, entdecken, sofort loslegen — oder selbst einen Shop eröffnen.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3 sm:mt-8">
            <button
              onClick={() => document.getElementById("entdecken")?.scrollIntoView({ behavior: "smooth" })}
              className="group inline-flex min-h-12 items-center gap-2 rounded-2xl bg-card px-6 py-3.5 text-sm font-bold text-brand transition-transform hover:-translate-y-1"
            >
              Jetzt entdecken
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
            <a
              href="#verkaufen"
              className="inline-flex min-h-12 items-center gap-2 rounded-2xl border border-primary-foreground/30 bg-primary-foreground/10 px-5 py-3 text-sm font-semibold text-primary-foreground backdrop-blur transition-colors hover:bg-primary-foreground/20"
            >
              <Store className="h-4 w-4" />
              Eigenen Shop eröffnen
            </a>
          </div>

          <div className="mt-8 flex items-center gap-4 text-xs text-primary-foreground/70">
            <div className="flex -space-x-2">
              {["🎨","🎧","✏️","📦","🧩"].map((e, i) => (
                <div key={i} className="grid h-8 w-8 place-items-center rounded-full border-2 border-brand bg-card text-xs">
                  {e}
                </div>
              ))}
            </div>
            <span>Werkstatt geöffnet — Creator willkommen.</span>
          </div></div>
          </div>
        </div>

        {/* Theme picker card — applies GLOBALLY */}
        <motion.div
          initial={{ opacity: 0, y: 30, rotate: -2 }}
          animate={{ opacity: 1, y: 0, rotate: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="relative lg:col-span-5"
        >
          <div className="relative overflow-hidden rounded-[2rem] border border-border bg-card p-5 shadow-lg transition-all duration-500 sm:p-8">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs font-bold uppercase tracking-widest text-brand-ink/70">Theme-Mixer</div>
                <div className="mt-1 text-[11px] text-muted-foreground">Tap = ganze Seite ändert die Stimmung.</div>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
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

            <div className="mt-6 grid grid-cols-5 gap-2 sm:gap-2.5">
              {list.map((t) => {
                const isActive = t.id === themeId;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    aria-label={`Theme ${t.label}`}
                    title={t.label}
                    className={`grid h-14 place-items-center overflow-hidden rounded-2xl text-2xl shadow-sm backdrop-blur transition-all ${
                      isActive ? "scale-110 ring-2 ring-brand" : "hover:scale-105"
                    }`}
                    style={{ background: t.softLight }}
                  >
                    <span className="drop-shadow-sm">{t.emoji}</span>
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-[11px] text-muted-foreground">
              Farben wirken auf die ganze Seite — Hell/Dunkel auch.
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
        <div className="grid gap-4 sm:grid-cols-2 lg:col-span-5">
          <button onClick={() => document.getElementById("entdecken")?.scrollIntoView({ behavior: "smooth" })} className="group relative min-h-40 overflow-hidden rounded-[2rem] bg-confetti-sun p-6 text-left text-brand-ink transition-transform hover:-translate-y-1">
            <Package className="h-8 w-8" />
            <strong className="mt-7 block font-display text-xl">Neue Fundstücke</strong>
            <span className="text-xs opacity-70">Frisch aus den Werkstätten</span>
            <ArrowRight className="absolute bottom-6 right-6 h-5 w-5 transition-transform group-hover:translate-x-1" />
          </button>
          <a href="#verkaufen" className="group relative min-h-40 overflow-hidden rounded-[2rem] bg-confetti-mint p-6 text-brand-ink transition-transform hover:-translate-y-1">
            <WandSparkles className="h-8 w-8" />
            <strong className="mt-7 block font-display text-xl">Selbst verkaufen</strong>
            <span className="text-xs opacity-70">Dein Shop, dein Stil</span>
            <ArrowRight className="absolute bottom-6 right-6 h-5 w-5 transition-transform group-hover:translate-x-1" />
          </a>
        </div>
      </div>
    </section>
  );
}
