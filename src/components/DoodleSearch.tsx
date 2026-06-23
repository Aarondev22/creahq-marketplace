import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Eraser, Sparkles, X, Search as SearchIcon, Loader2 } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { guessDoodle } from "@/lib/doodle.functions";

export function DoodleSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [guess, setGuess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const guessFn = useServerFn(guessDoodle);

  useEffect(() => {
    if (!open) return;
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext("2d"); if (!ctx) return;
    ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, c.width, c.height);
    ctx.strokeStyle = "#1a1a1a"; ctx.lineWidth = 6; ctx.lineCap = "round"; ctx.lineJoin = "round";
    setGuess(null); setErr(null);
  }, [open]);

  function pos(e: React.PointerEvent) {
    const c = canvasRef.current!; const r = c.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * c.width, y: ((e.clientY - r.top) / r.height) * c.height };
  }
  function down(e: React.PointerEvent) {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    setDrawing(true);
    const ctx = canvasRef.current!.getContext("2d")!;
    const p = pos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + 0.1, p.y + 0.1); ctx.stroke();
  }
  function move(e: React.PointerEvent) {
    if (!drawing) return;
    const ctx = canvasRef.current!.getContext("2d")!;
    const p = pos(e); ctx.lineTo(p.x, p.y); ctx.stroke();
  }
  function up() { setDrawing(false); }

  function clear() {
    const c = canvasRef.current!; const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, c.width, c.height);
    setGuess(null); setErr(null);
  }

  async function recognize() {
    setLoading(true); setErr(null); setGuess(null);
    try {
      const dataUrl = canvasRef.current!.toDataURL("image/png");
      const { guess: g } = await guessFn({ data: { imageDataUrl: dataUrl } });
      setGuess(g || "unklar");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "KI nicht erreichbar");
    } finally {
      setLoading(false);
    }
  }

  function searchIt() {
    if (!guess || guess === "unklar") return;
    onClose();
    navigate({ to: "/browse", search: { q: guess } as never });
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-3xl border border-border bg-card p-5 shadow-2xl sm:p-7" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-brand">
              <Sparkles className="h-3 w-3" /> Doodle-Suche
            </div>
            <h2 className="mt-2 font-display text-2xl font-black text-brand-ink">Zeichne, was du suchst.</h2>
            <p className="mt-1 text-xs text-muted-foreground">Die KI erkennt deine Skizze und sucht passende Listings.</p>
          </div>
          <button onClick={onClose} aria-label="Schließen" className="grid h-9 w-9 place-items-center rounded-full bg-brand-soft text-brand-ink hover:bg-brand hover:text-primary-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <canvas
          ref={canvasRef}
          width={720}
          height={420}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerLeave={up}
          className="mt-4 w-full touch-none rounded-2xl border-2 border-border bg-white"
        />

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            onClick={recognize}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-primary-foreground brand-glow disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {loading ? "KI denkt …" : "Erkennen lassen"}
          </button>
          <button onClick={clear} className="inline-flex items-center gap-2 rounded-full bg-brand-soft px-4 py-2.5 text-sm font-bold text-brand-ink hover:bg-brand hover:text-primary-foreground">
            <Eraser className="h-4 w-4" /> Löschen
          </button>
          {guess && guess !== "unklar" && (
            <button onClick={searchIt} className="ml-auto inline-flex items-center gap-2 rounded-full border-2 border-brand bg-card px-4 py-2.5 text-sm font-bold text-brand hover:bg-brand hover:text-primary-foreground">
              <SearchIcon className="h-4 w-4" /> „{guess}" suchen
            </button>
          )}
        </div>

        {guess && (
          <div className="mt-4 rounded-2xl bg-brand-soft/60 p-4 text-sm text-brand-ink">
            {guess === "unklar" ? "Hmm, da bin ich mir nicht sicher — versuch's mit mehr Details." : <>Sieht aus wie: <strong>{guess}</strong></>}
          </div>
        )}
        {err && <div className="mt-3 rounded-2xl bg-red-500/10 p-3 text-xs text-red-700">{err}</div>}
      </div>
    </div>
  );
}
