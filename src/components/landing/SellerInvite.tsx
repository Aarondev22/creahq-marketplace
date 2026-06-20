import { motion } from "motion/react";
import { Store, ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function SellerInvite() {
  return (
    <section id="verkaufen" className="mx-auto max-w-7xl px-6 py-14">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden rounded-[2rem] border border-brand/30 bg-gradient-to-br from-brand-soft via-card to-amber-100/40 p-8 sm:p-12"
      >
        {/* deco */}
        <div aria-hidden className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brand/20 blur-3xl" />
        <div aria-hidden className="absolute -bottom-12 -left-12 h-44 w-44 rounded-full bg-amber-300/40 blur-3xl" />

        <div className="relative grid gap-8 md:grid-cols-[1.4fr_1fr] md:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-brand px-3 py-1 text-xs font-bold uppercase tracking-widest text-primary-foreground">
              <Store className="h-3.5 w-3.5" />
              Für Creator
            </div>
            <h2 className="mt-4 font-display text-3xl font-black leading-tight text-brand-ink sm:text-4xl md:text-5xl">
              Du machst Sachen?<br />
              <span className="text-brand">Mach daraus Umsatz.</span>
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              In ~2 Minuten ist dein Shop online: Profil gestalten, Produkte hochladen, Stripe verbinden. Du bestimmst Preis, Stil und Versand.
            </p>

            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              <div className="rounded-2xl border border-brand/30 bg-card/70 p-3">
                <div className="text-[10px] font-bold uppercase tracking-widest text-brand">Digital</div>
                <div className="font-display text-2xl font-black text-brand-ink">17 %<span className="text-xs font-bold text-muted-foreground"> pro Verkauf</span></div>
              </div>
              <div className="rounded-2xl border border-amber-300/60 bg-card/70 p-3">
                <div className="text-[10px] font-bold uppercase tracking-widest text-amber-700">Physisch</div>
                <div className="font-display text-2xl font-black text-brand-ink">12 %<span className="text-xs font-bold text-muted-foreground"> pro Verkauf</span></div>
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Keine monatliche Gebühr. Alle 25 Verkäufe im Monat sinkt deine Provision um 1 % — am 1. des Monats geht's wieder bei vorne los.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                to="/auth"
                className="group inline-flex items-center gap-2 rounded-full bg-brand-ink px-6 py-3 text-sm font-bold text-primary-foreground transition-transform hover:scale-105"
              >
                Shop eröffnen
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link to="/gebuehren" className="text-xs font-semibold text-brand hover:underline">
                So funktioniert die Gebühr →
              </Link>
            </div>
          </div>

          {/* visual */}
          <motion.div
            className="relative mx-auto w-full max-w-xs"
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="rounded-3xl border border-border bg-card p-5 brand-glow">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand text-xl text-primary-foreground">
                  🎨
                </div>
                <div className="min-w-0">
                  <div className="truncate font-display text-lg font-bold text-brand-ink">dein-shop</div>
                  <div className="text-xs text-muted-foreground">creahq.app/dein-shop</div>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-2">
                {["🖼️","🎵","📐"].map((e, i) => (
                  <div key={i} className="grid aspect-square place-items-center rounded-xl bg-surface-warm text-xl">
                    {e}
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between text-xs">
                <span className="font-semibold text-brand-ink">3 Produkte</span>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-bold text-emerald-700">Live</span>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
