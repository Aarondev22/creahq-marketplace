import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { X } from "lucide-react";

type Faq = {
  q: string;
  a: string;
  color: string;
  ink: string;
  rotate: number;
  size: "sm" | "md" | "lg";
  emoji: string;
};

const faqs: Faq[] = [
  {
    q: "Was ist CreaHQ überhaupt?",
    a: "Ein verspielter Marktplatz für Sachen, die Creator selbst gemacht haben — von Illustrationen über Audio-Presets bis hin zu Beratung. Du stöberst, kaufst, lädst runter. Fertig.",
    color: "bg-brand text-primary-foreground", ink: "text-primary-foreground",
    rotate: -4, size: "lg", emoji: "✨",
  },
  {
    q: "Wer verkauft hier?",
    a: "Jede:r, die was zu zeigen hat. Du eröffnest in ~2 Minuten deinen eigenen Shop mit Profil, Branding und Produkten. Aktuell 0 € Plattformgebühr.",
    color: "bg-amber-200", ink: "text-amber-950",
    rotate: 3, size: "md", emoji: "🎨",
  },
  {
    q: "Wie krieg ich meine Sachen?",
    a: "Digitale Produkte gibt's nach dem Kauf sofort als signierten Download. Services laufen über direkte Absprache mit dem Creator — Email kommt mit der Bestellung.",
    color: "bg-emerald-200", ink: "text-emerald-950",
    rotate: -2, size: "md", emoji: "📦",
  },
  {
    q: "Was kostet das Verkaufen?",
    a: "Im MVP: nichts. Wir nehmen aktuell keine Plattformgebühr, du behältst (abzüglich Stripe-Gebühren) alles. Später kommt fair gestaffelte Provision dazu.",
    color: "bg-sky-200", ink: "text-sky-950",
    rotate: 5, size: "sm", emoji: "💸",
  },
  {
    q: "Wie sicher ist der Kauf?",
    a: "Zahlung läuft über Stripe — gleiche Infrastruktur wie bei Shopify, Substack & Co. Keine Kartendaten bei uns, kein Risiko bei dir.",
    color: "bg-pink-200", ink: "text-pink-950",
    rotate: -6, size: "md", emoji: "🛡️",
  },
];

const sizeClass: Record<Faq["size"], string> = {
  sm: "w-52 h-44",
  md: "w-60 h-52",
  lg: "w-72 h-60",
};

// Scattered hand-tuned positions (percent of board)
const positions = [
  { left: "6%",  top: "8%" },
  { left: "62%", top: "4%" },
  { left: "38%", top: "30%" },
  { left: "4%",  top: "58%" },
  { left: "60%", top: "55%" },
];

export function FaqStickerBoard() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="mx-auto max-w-7xl px-6 py-20">
      <div className="mb-10 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-brand-soft px-3 py-1 text-xs font-bold uppercase tracking-widest text-brand">
          Häufig gefragt
        </div>
        <h2 className="mt-4 font-display text-4xl font-black tracking-tight text-brand-ink sm:text-5xl">
          Fragen? <span className="italic text-brand">Klick eine Karte.</span>
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Sticker-Wand. Schau dich um. Nichts ist in Reihen sortiert — das wäre ja langweilig.
        </p>
      </div>

      {/* Desktop: scattered board. Mobile: stacked but rotated. */}
      <div className="relative hidden h-[560px] w-full md:block">
        {faqs.map((f, i) => (
          <motion.button
            key={i}
            onClick={() => setOpen(i)}
            style={{ left: positions[i].left, top: positions[i].top, ["--rot" as never]: `${f.rotate}deg` }}
            initial={{ opacity: 0, scale: 0.7, rotate: f.rotate }}
            whileInView={{ opacity: 1, scale: 1, rotate: f.rotate }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08, type: "spring", stiffness: 200, damping: 18 }}
            whileHover={{ scale: 1.06, rotate: 0, y: -6, zIndex: 30 }}
            whileTap={{ scale: 0.96 }}
            className={`absolute ${sizeClass[f.size]} ${f.color} ${f.ink} grid rounded-3xl p-5 text-left shadow-[0_18px_40px_-12px_rgba(60,30,90,0.35)] [animation:float-slow_6s_ease-in-out_infinite]`}
          >
            <div className="flex items-start justify-between">
              <span className="text-3xl">{f.emoji}</span>
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">
                #{String(i + 1).padStart(2, "0")}
              </span>
            </div>
            <div className="self-end">
              <div className="font-display text-xl font-black leading-tight">{f.q}</div>
              <div className="mt-1 text-[11px] font-semibold uppercase tracking-wider opacity-70">
                Klick für Antwort →
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Mobile: still rotated cards but in a tight flowing layout */}
      <div className="flex flex-col items-center gap-5 md:hidden">
        {faqs.map((f, i) => (
          <motion.button
            key={i}
            onClick={() => setOpen(i)}
            style={{ rotate: `${f.rotate}deg` }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.06 }}
            className={`${f.color} ${f.ink} w-[85%] rounded-3xl p-5 text-left shadow-xl`}
          >
            <div className="flex items-start justify-between">
              <span className="text-3xl">{f.emoji}</span>
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">
                #{String(i + 1).padStart(2, "0")}
              </span>
            </div>
            <div className="mt-3 font-display text-xl font-black leading-tight">{f.q}</div>
          </motion.button>
        ))}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {open !== null && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] grid place-items-center bg-brand-ink/40 p-6 backdrop-blur-sm"
            onClick={() => setOpen(null)}
          >
            <motion.div
              initial={{ scale: 0.7, rotate: faqs[open].rotate, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              exit={{ scale: 0.7, rotate: faqs[open].rotate, opacity: 0 }}
              transition={{ type: "spring", stiffness: 220, damping: 22 }}
              onClick={(e) => e.stopPropagation()}
              className={`relative w-full max-w-lg rounded-[2rem] ${faqs[open].color} ${faqs[open].ink} p-8 shadow-2xl`}
            >
              <button
                onClick={() => setOpen(null)}
                aria-label="Schließen"
                className="absolute right-5 top-5 grid h-9 w-9 place-items-center rounded-full bg-black/10 transition-colors hover:bg-black/20"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="text-5xl">{faqs[open].emoji}</div>
              <h3 className="mt-4 font-display text-3xl font-black leading-tight">{faqs[open].q}</h3>
              <p className="mt-4 text-base leading-relaxed opacity-90">{faqs[open].a}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
