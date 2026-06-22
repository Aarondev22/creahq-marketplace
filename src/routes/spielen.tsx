import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";
import { Gamepad2, Palette, Flag, Sparkles, Trophy, RotateCcw, Check, X } from "lucide-react";
import { toast } from "sonner";
import { useEffect, useMemo, useRef, useState } from "react";

export const Route = createFileRoute("/spielen")({
  head: () => ({
    meta: [
      { title: "Spielen & Codes — CreaHQ" },
      { name: "description", content: "KI-Mini-Games und Codes einlösen auf CreaHQ. Quiz, Doodle, Flaggen — sammel Streaks und Bonus-Codes." },
      { property: "og:title", content: "Spielen & Codes — CreaHQ" },
      { property: "og:description", content: "Mini-Games und Codes für Creator und Käufer." },
    ],
  }),
  component: SpielenPage,
});

type GameId = "quiz" | "doodle" | "flag" | "sticker" | null;

function SpielenPage() {
  const [active, setActive] = useState<GameId>(null);

  return (
    <PageShell
      eyebrow="Spielen"
      title="KI-Mini-Games & Codes."
      lead="Kleine Spielereien zwischendurch. Streak halten = Bonus-Code im Checkout."
    >
      {active && (
        <div className="mb-6 flex items-center justify-between rounded-2xl border border-border bg-card p-3">
          <button
            onClick={() => setActive(null)}
            className="rounded-xl bg-brand-soft px-3 py-1.5 text-sm font-bold text-brand-ink hover:bg-brand hover:text-primary-foreground"
          >
            ← Zurück zur Übersicht
          </button>
          <span className="text-xs text-muted-foreground">Spiel läuft</span>
        </div>
      )}

      {!active && (
        <div className="grid gap-5 md:grid-cols-2">
          <GameCard
            icon={<Sparkles className="h-6 w-6" />}
            title="Tages-Quiz"
            desc="3 Fragen rund um Creator-Sachen. Alle richtig = Bonus-Code."
            cta="Spielen"
            onClick={() => setActive("quiz")}
            live
          />
          <GameCard
            icon={<Palette className="h-6 w-6" />}
            title="Doodle-Search"
            desc="Kritzel was ein — wir raten und schlagen Listings vor."
            cta="Spielen"
            onClick={() => setActive("doodle")}
            live
          />
          <GameCard
            icon={<Flag className="h-6 w-6" />}
            title="Flaggen-Memo"
            desc="Erkenn die Flagge in 3 Sekunden. Streak hochhalten."
            cta="Spielen"
            onClick={() => setActive("flag")}
            live
          />
          <GameCard
            icon={<Gamepad2 className="h-6 w-6" />}
            title="Sticker-Sammler"
            desc="Finde den Glücksstern im Hero. Klick gefunden? Zähler steigt."
            cta="Status"
            onClick={() => setActive("sticker")}
            live
          />
        </div>
      )}

      {active === "quiz" && <Quiz />}
      {active === "doodle" && <Doodle />}
      {active === "flag" && <FlagGame />}
      {active === "sticker" && <Sticker />}

      <div className="mt-10 rounded-3xl border-2 border-dashed border-brand/40 bg-brand-soft/40 p-6 text-center sm:p-8">
        <h3 className="font-display text-xl font-black text-brand-ink sm:text-2xl">Code einlösen</h3>
        <p className="mt-2 text-sm text-muted-foreground">Rabatt-Codes & Founder-Codes gibst du auf <a href="/redeem" className="font-semibold text-brand hover:underline">/redeem</a> ein.</p>
      </div>
    </PageShell>
  );
}

function GameCard({ icon, title, desc, cta, onClick, live = false }: { icon: React.ReactNode; title: string; desc: string; cta: string; onClick: () => void; live?: boolean }) {
  return (
    <button
      onClick={onClick}
      className="group relative overflow-hidden rounded-3xl border border-border bg-card p-6 text-left transition-all hover:-translate-y-1 hover:border-brand hover:brand-glow"
    >
      {live && <span className="absolute right-4 top-4 rounded-full bg-brand px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-foreground">live</span>}
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand text-primary-foreground">{icon}</span>
        <h3 className="font-display text-lg font-black text-brand-ink">{title}</h3>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">{desc}</p>
      <div className="mt-4 inline-flex items-center gap-1 rounded-full bg-brand-soft px-3 py-1 text-xs font-bold text-brand-ink">{cta} →</div>
    </button>
  );
}

/* ───────── Quiz ───────── */
const QUIZ = [
  { q: "Wie viel Gebühr nimmt CreaHQ bei digitalen Produkten zum Start?", a: ["12%", "17%", "20%", "5%"], correct: 1 },
  { q: "Bei wie vielen Verkäufen pro Monat sinkt die Gebühr je 1%?", a: ["alle 10", "alle 25", "alle 50", "alle 100"], correct: 1 },
  { q: "Wer haftet bei Versandschaden MIT Tracking-Nummer?", a: ["Käufer", "Verkäufer", "Versanddienstleister", "CreaHQ"], correct: 2 },
];

function Quiz() {
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const done = step >= QUIZ.length;

  function pick(i: number) {
    if (picked !== null) return;
    setPicked(i);
    if (i === QUIZ[step].correct) setScore((s) => s + 1);
    setTimeout(() => { setPicked(null); setStep((s) => s + 1); }, 700);
  }

  if (done) {
    const win = score === QUIZ.length;
    return (
      <div className="rounded-3xl border border-border bg-card p-8 text-center">
        <Trophy className={`mx-auto h-12 w-12 ${win ? "text-brand" : "text-muted-foreground"}`} />
        <h3 className="mt-3 font-display text-2xl font-black text-brand-ink">{win ? "Perfekt!" : `${score}/${QUIZ.length}`}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{win ? "Bonus-Code: CREA-QUIZ-10 (10% bei deinem nächsten Kauf)" : "Knapp daneben — probier's morgen nochmal."}</p>
        <button
          onClick={() => { setStep(0); setScore(0); }}
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2 text-sm font-bold text-primary-foreground hover:brightness-110"
        >
          <RotateCcw className="h-4 w-4" /> Nochmal
        </button>
        {win && (
          <button
            onClick={() => { navigator.clipboard?.writeText("CREA-QUIZ-10"); toast.success("Code kopiert!"); }}
            className="ml-2 mt-5 rounded-full bg-brand-soft px-5 py-2 text-sm font-bold text-brand-ink hover:bg-brand hover:text-primary-foreground"
          >
            Code kopieren
          </button>
        )}
      </div>
    );
  }

  const cur = QUIZ[step];
  return (
    <div className="rounded-3xl border border-border bg-card p-6 sm:p-8">
      <div className="mb-4 flex items-center justify-between text-xs font-bold text-muted-foreground">
        <span>Frage {step + 1} / {QUIZ.length}</span>
        <span>Score {score}</span>
      </div>
      <h3 className="font-display text-xl font-black text-brand-ink sm:text-2xl">{cur.q}</h3>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {cur.a.map((opt, i) => {
          const isPicked = picked === i;
          const isCorrect = i === cur.correct;
          const state = picked === null ? "" : isCorrect ? "bg-green-500/20 border-green-500" : isPicked ? "bg-red-500/20 border-red-500" : "opacity-60";
          return (
            <button
              key={opt}
              onClick={() => pick(i)}
              disabled={picked !== null}
              className={`flex items-center justify-between rounded-2xl border-2 border-border bg-background p-4 text-left text-sm font-bold text-brand-ink transition-all hover:border-brand ${state}`}
            >
              <span>{opt}</span>
              {picked !== null && isCorrect && <Check className="h-4 w-4 text-green-600" />}
              {isPicked && !isCorrect && <X className="h-4 w-4 text-red-600" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ───────── Doodle ───────── */
function Doodle() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [guess, setGuess] = useState<string | null>(null);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.strokeStyle = "#222";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
  }, []);

  function pos(e: React.PointerEvent) {
    const c = canvasRef.current!;
    const r = c.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * c.width, y: ((e.clientY - r.top) / r.height) * c.height };
  }
  function down(e: React.PointerEvent) {
    setDrawing(true);
    const ctx = canvasRef.current!.getContext("2d")!;
    const p = pos(e);
    ctx.beginPath(); ctx.moveTo(p.x, p.y);
  }
  function move(e: React.PointerEvent) {
    if (!drawing) return;
    const ctx = canvasRef.current!.getContext("2d")!;
    const p = pos(e);
    ctx.lineTo(p.x, p.y); ctx.stroke();
  }
  function up() { setDrawing(false); }

  function clear() {
    const c = canvasRef.current!; const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, c.width, c.height);
    setGuess(null);
  }

  function guessIt() {
    const c = canvasRef.current!; const ctx = c.getContext("2d")!;
    const img = ctx.getImageData(0, 0, c.width, c.height).data;
    let inked = 0;
    for (let i = 0; i < img.length; i += 4) {
      if (img[i] < 200) inked++;
    }
    const density = inked / (c.width * c.height);
    const guesses = density < 0.01 ? ["leeres Blatt", "ein Punkt"] :
      density < 0.04 ? ["Pinsel", "Stift", "Linie"] :
      density < 0.1 ? ["Logo", "Icon", "Typografie"] :
      ["Illustration", "Poster", "abstraktes Kunstwerk"];
    setGuess(guesses[Math.floor(Math.random() * guesses.length)]);
  }

  return (
    <div className="rounded-3xl border border-border bg-card p-6">
      <h3 className="font-display text-xl font-black text-brand-ink">Doodle was ein</h3>
      <p className="mt-1 text-sm text-muted-foreground">Mal grob, was du suchst. Wir „raten" mit einer simplen Pixel-Heuristik.</p>
      <canvas
        ref={canvasRef}
        width={600}
        height={360}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerLeave={up}
        className="mt-4 w-full touch-none rounded-2xl border-2 border-border bg-white"
      />
      <div className="mt-4 flex flex-wrap gap-2">
        <button onClick={guessIt} className="rounded-full bg-brand px-4 py-2 text-sm font-bold text-primary-foreground">KI raten lassen</button>
        <button onClick={clear} className="rounded-full bg-brand-soft px-4 py-2 text-sm font-bold text-brand-ink">Löschen</button>
      </div>
      {guess && (
        <div className="mt-4 rounded-2xl bg-brand-soft p-4 text-sm text-brand-ink">
          Sieht aus wie: <strong>{guess}</strong> · <a href={`/browse?q=${encodeURIComponent(guess)}`} className="underline">Listings ansehen →</a>
        </div>
      )}
    </div>
  );
}

/* ───────── Flag Game ───────── */
const FLAGS = [
  { emoji: "🇩🇪", name: "Deutschland" },
  { emoji: "🇫🇷", name: "Frankreich" },
  { emoji: "🇪🇸", name: "Spanien" },
  { emoji: "🇮🇹", name: "Italien" },
  { emoji: "🇯🇵", name: "Japan" },
  { emoji: "🇧🇷", name: "Brasilien" },
  { emoji: "🇸🇪", name: "Schweden" },
  { emoji: "🇳🇱", name: "Niederlande" },
];

function FlagGame() {
  const [round, setRound] = useState(0);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(() => Number(localStorage.getItem("creahq:flag-best") ?? 0));
  const cur = useMemo(() => FLAGS[Math.floor(Math.random() * FLAGS.length)], [round]);
  const opts = useMemo(() => {
    const set = new Set<string>([cur.name]);
    while (set.size < 4) set.add(FLAGS[Math.floor(Math.random() * FLAGS.length)].name);
    return Array.from(set).sort(() => Math.random() - 0.5);
  }, [cur]);

  function pick(name: string) {
    if (name === cur.name) {
      const s = streak + 1;
      setStreak(s);
      if (s > best) { setBest(s); localStorage.setItem("creahq:flag-best", String(s)); }
      toast.success("Richtig!");
    } else {
      toast.error(`Falsch — war ${cur.name}`);
      setStreak(0);
    }
    setRound((r) => r + 1);
  }

  return (
    <div className="rounded-3xl border border-border bg-card p-8 text-center">
      <div className="mb-4 flex justify-between text-xs font-bold text-muted-foreground">
        <span>Streak: {streak}</span>
        <span>Bestwert: {best}</span>
      </div>
      <div className="text-[120px] leading-none">{cur.emoji}</div>
      <div className="mt-6 grid gap-2 sm:grid-cols-2">
        {opts.map((o) => (
          <button key={o} onClick={() => pick(o)} className="rounded-2xl border-2 border-border bg-background p-4 text-sm font-bold text-brand-ink hover:border-brand">{o}</button>
        ))}
      </div>
    </div>
  );
}

/* ───────── Sticker counter ───────── */
function Sticker() {
  const found = Number(typeof window !== "undefined" ? localStorage.getItem("creahq:star-found") ?? 0 : 0);
  return (
    <div className="rounded-3xl border border-border bg-card p-8 text-center">
      <Sparkles className="mx-auto h-12 w-12 text-brand" />
      <h3 className="mt-3 font-display text-2xl font-black text-brand-ink">Sticker-Sammler</h3>
      <p className="mt-2 text-sm text-muted-foreground">Du hast den Hero-Stern <strong>{found}×</strong> entdeckt.</p>
      <a href="/" className="mt-5 inline-block rounded-full bg-brand px-5 py-2 text-sm font-bold text-primary-foreground">Zur Startseite →</a>
    </div>
  );
}
