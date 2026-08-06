import { useState } from "react";
import { Flag } from "lucide-react";
import { toast } from "sonner";
import { createReport, REPORT_REASONS, type ReportTarget } from "@/lib/reports";

export function ReportButton({
  targetType,
  targetId,
  label = "Melden",
  className = "",
}: {
  targetType: ReportTarget;
  targetId: string;
  label?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>(REPORT_REASONS[0].value);
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    try {
      await createReport({ targetType, targetId, reason, note });
      toast.success("Danke! Unser Team schaut sich das an. 🙏");
      setOpen(false);
      setNote("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Melden fehlgeschlagen");
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-4 text-sm font-bold text-muted-foreground transition hover:border-red-400 hover:text-red-500 ${className}`}
      >
        <Flag className="h-4 w-4" /> {label}
      </button>

      {open && (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-black/40 p-4" role="dialog" aria-modal="true">
          <form
            onSubmit={submit}
            className="w-full max-w-md space-y-4 rounded-3xl border border-border bg-card p-6 shadow-2xl"
          >
            <h2 className="font-display text-2xl font-black text-brand-ink">Inhalt melden 🚩</h2>
            <p className="text-sm text-muted-foreground">
              Sag uns kurz, was hier nicht stimmt. Missbrauch von Meldungen kann zur Sperre führen.
            </p>
            <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Grund
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="mt-1.5 min-h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm font-semibold text-brand-ink focus:border-brand focus:outline-none"
              >
                {REPORT_REASONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Notiz (optional)
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                maxLength={600}
                className="mt-1.5 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm focus:border-brand focus:outline-none"
                placeholder="Was ist passiert?"
              />
            </label>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={sending}
                className="min-h-12 flex-1 rounded-full bg-brand px-5 text-sm font-bold text-primary-foreground disabled:opacity-60"
              >
                {sending ? "Sende …" : "Meldung senden"}
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="min-h-12 rounded-full border border-border px-5 text-sm font-bold text-brand-ink"
              >
                Abbrechen
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
