import { useEffect, useRef, useState } from "react";
import { Eraser, Sparkles, Loader2, Languages, Check } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { guessFlagLang } from "@/lib/flag-lang.functions";

const LS_LANG = "creahq:lang";

/**
 * Draw a national flag, the AI guesses the country and switches
 * the stored UI language. We don't ship a full i18n runtime yet —
 * the choice is persisted so a future translation layer can pick it up.
 */
export function FlagLangDoodle() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ country: string; lang: string } | null>(null);
  const [current, setCurrent] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const guessFn = useServerFn(guessFlagLang);

  useEffect(() => {
    try { setCurrent(localStorage.getItem(LS_LANG)); } catch { /* noop */ }
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function reset() {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext("2d"); if (!ctx) return;
    ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, c.width, c.height);
    ctx.strokeStyle = "#1a1a1a"; ctx.lineWidth = 6; ctx.lineCap = "round"; ctx.lineJoin = "round";
    setResult(null); setErr(null);
  }

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

  async function recognize() {
    setLoading(true); setErr(null); setResult(null);
    try {
      const dataUrl = canvasRef.current!.toDataURL("image/png");
      const r = await guessFn({ data: { imageDataUrl: dataUrl } });
      setResult(r);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "KI nicht erreichbar");
    } finally {
      setLoading(false);
    }
  }

  function applyLang() {
    if (!result || result.lang === "unklar") return;
    try { localStorage.setItem(LS_LANG, result.lang); } catch { /* noop */ }
    setCurrent(result.lang);
    toast(`Sprache auf ${result.country} (${result.lang.toUpperCase()}) gesetzt.`);
  }

  return (
    <div className="rounded-3xl border border-border bg-card p-6 sm:p-8">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-xl font-black text-brand-ink sm:text-2xl">
            Sprache per Flagge
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Zeichne eine Nationalflagge. Die KI erkennt sie und stellt die passende Sprache ein.
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-2.5 py-1 text-[11px] font-bold text-brand-ink">
          <Languages className="h-3 w-3" />
          Aktuell: {current ? current.toUpperCase() : "DE"}
        </div>
      </div>

      <canvas
        ref={canvasRef}
        width={720}
        height={380}
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
          {loading ? "KI denkt …" : "Flagge erkennen"}
        </button>
        <button onClick={reset} className="inline-flex items-center gap-2 rounded-full bg-brand-soft px-4 py-2.5 text-sm font-bold text-brand-ink hover:bg-brand hover:text-primary-foreground">
          <Eraser className="h-4 w-4" /> Neu
        </button>
        {result && result.lang !== "unklar" && (
          <button onClick={applyLang} className="ml-auto inline-flex items-center gap-2 rounded-full border-2 border-brand bg-card px-4 py-2.5 text-sm font-bold text-brand hover:bg-brand hover:text-primary-foreground">
            <Check className="h-4 w-4" /> {result.country} · {result.lang.toUpperCase()} übernehmen
          </button>
        )}
      </div>

      {result && (
        <div className="mt-4 rounded-2xl bg-brand-soft/60 p-4 text-sm text-brand-ink">
          {result.lang === "unklar"
            ? "Hmm, die Flagge ist noch nicht eindeutig — probier's mit klareren Streifen und Farben."
            : <>Erkannt: <strong>{result.country}</strong> → Sprache <strong>{result.lang.toUpperCase()}</strong></>}
        </div>
      )}
      {err && <div className="mt-3 rounded-2xl bg-red-500/10 p-3 text-xs text-red-700">{err}</div>}
    </div>
  );
}
