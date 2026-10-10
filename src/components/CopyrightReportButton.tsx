import { useState } from "react";
import { Copyright } from "lucide-react";
import { toast } from "sonner";
import { createReport } from "@/lib/reports";

export function CopyrightReportButton({ listingId }: { listingId: string }) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [note, setNote] = useState("");
  const [ok, setOk] = useState(false);
  const [sending, setSending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^https?:\/\//i.test(url.trim())) return toast.error("Bitte gib einen Link zu deinem Original an.");
    setSending(true);
    try {
      await createReport({ targetType: "listing", targetId: listingId, reason: "copyright", note, evidenceUrl: url.trim() });
      toast.success("Danke! Wir prüfen die Urheberrechts-Meldung.");
      setOpen(false); setUrl(""); setNote(""); setOk(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Melden fehlgeschlagen");
    } finally { setSending(false); }
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}
        className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-4 text-sm font-bold text-muted-foreground hover:border-destructive hover:text-destructive">
        <Copyright className="h-4 w-4" /> Urheberrecht melden
      </button>
      {open && (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-foreground/40 p-4" role="dialog" aria-modal="true">
          <form onSubmit={submit} className="w-full max-w-md space-y-4 rounded-3xl border border-border bg-card p-6 shadow-2xl">
            <h2 className="font-display text-2xl font-black text-brand-ink">Das ist mein Werk ©</h2>
            <p className="text-sm text-muted-foreground">Für Künstler & Designer: Zeig uns, wo dein Original zu finden ist. Bei mehreren Meldungen wird das Produkt sofort pausiert.</p>
            <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Link zu deinem Original (https://…)" className="min-h-12 w-full rounded-2xl border border-border bg-surface px-4 text-sm" />
            <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Was wurde kopiert? (optional)" className="min-h-20 w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm" />
            <label className="flex items-start gap-2 text-xs text-brand-ink">
              <input type="checkbox" checked={ok} onChange={(e) => setOk(e.target.checked)} className="mt-0.5 h-4 w-4" />
              Ich versichere, dass ich die Rechte an diesem Werk besitze. Falsche Meldungen können zur Sperre führen.
            </label>
            <div className="flex gap-2">
              <button disabled={!ok || sending} className="min-h-12 flex-1 rounded-2xl bg-brand text-sm font-bold text-primary-foreground disabled:opacity-50">{sending ? "…" : "Meldung senden"}</button>
              <button type="button" onClick={() => setOpen(false)} className="min-h-12 rounded-2xl border border-border px-5 text-sm font-bold">Abbrechen</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
