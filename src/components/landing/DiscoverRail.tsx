import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";

type Props = {
  title: string;
  subtitle: string;
  emoji: string;
  emptyMessage: string;
};

export function DiscoverRail({ title, subtitle, emoji, emptyMessage }: Props) {
  return (
    <section className="mx-auto max-w-7xl px-6 py-10">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-2xl" aria-hidden>{emoji}</span>
            <h2 className="truncate font-display text-2xl font-black text-brand-ink sm:text-3xl">
              {title}
            </h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <a
          href="#"
          className="group hidden shrink-0 items-center gap-1 text-sm font-semibold text-brand transition-colors hover:text-brand-ink sm:inline-flex"
        >
          Alle ansehen
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </a>
      </div>

      <div className="relative">
        <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
          {Array.from({ length: 6 }).map((_, i) => (
            <PlaceholderCard key={i} index={i} message={emptyMessage} />
          ))}
        </div>
        <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-surface to-transparent" />
      </div>
    </section>
  );
}

function PlaceholderCard({ index, message }: { index: number; message: string }) {
  const showMessage = index === 1;
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="group relative flex h-64 w-56 shrink-0 flex-col justify-between overflow-hidden rounded-3xl border-2 border-dashed border-brand/30 bg-card/60 p-5 transition-colors hover:border-brand/60"
    >
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-brand-soft/40 via-transparent to-amber-100/30" />
      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-brand/70">
        <span>Bald hier</span>
        <span>#{String(index + 1).padStart(2, "0")}</span>
      </div>

      {showMessage ? (
        <div className="my-auto text-center">
          <motion.div
            className="mx-auto mb-3 text-4xl"
            animate={{ rotate: [-6, 6, -6] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            📦
          </motion.div>
          <p className="text-xs font-medium leading-relaxed text-brand-ink">
            {message}
          </p>
        </div>
      ) : (
        <div className="my-auto space-y-2">
          <div className="h-3 w-3/4 rounded-full bg-brand/15" />
          <div className="h-3 w-1/2 rounded-full bg-brand/10" />
          <div className="mt-4 h-20 rounded-2xl bg-gradient-to-br from-brand/10 to-amber-200/30" />
        </div>
      )}

      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span>Creator gesucht</span>
        <span className="rounded-full bg-brand/10 px-2 py-0.5 font-bold text-brand">—,— €</span>
      </div>
    </motion.div>
  );
}
