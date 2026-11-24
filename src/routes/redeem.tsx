import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { PageShell } from "@/components/PageShell";

export const Route = createFileRoute("/redeem")({
  head: () => ({
    meta: [
      { title: "Gutschein- oder Aktionscode einlösen — CreaHQ" },
      { name: "description", content: "Gib deinen Aktions-, Partner- oder Einlöse-Code ein" },
    ],
  }),
  component: RedeemPage,
});

function RedeemPage() {
  const { user } = useAuth();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      toast.error("Bitte zuerst anmelden.");
      navigate({ to: "/auth", search: { mode: "signin" as const } });
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.rpc("redeem_founder_code", { _code: code.trim() });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    const row = Array.isArray(data) ? data[0] : data;
    if (row?.success) {
      toast.success(row.message ?? "Eingelöst!");
      setTimeout(() => window.location.reload(), 800);
    } else {
      toast.error(row?.message ?? "Konnte nicht eingelöst werden.");
    }
  }

  return (
    <PageShell title="Gutschein- oder Aktionscode einlösen" lead="Gib deinen Aktions-, Partner- oder Einlöse-Code ein">
      <div className="mx-auto max-w-lg">
        <form onSubmit={submit} className="rounded-3xl border border-border bg-card p-8 shadow-sm">
          <Sparkles className="h-6 w-6 text-brand" />
          <h2 className="mt-3 font-display text-2xl font-black text-brand-ink">Hast du einen Code?</h2>
          <p className="mt-1 text-sm text-muted-foreground">Gib deinen Aktions-, Partner- oder Einlöse-Code ein.</p>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Code eingeben"
            className="mt-5 w-full rounded-xl border border-border bg-surface px-4 py-3 font-mono text-sm uppercase tracking-wider text-brand-ink focus:border-brand focus:outline-none"
            autoFocus
          />
          <button
            type="submit"
            disabled={loading || !code.trim()}
            className="mt-4 w-full rounded-full bg-brand py-3 text-sm font-bold text-primary-foreground transition-transform hover:scale-[1.02] disabled:opacity-50"
          >
            {loading ? "Prüfe…" : "Einlösen"}
          </button>
          {!user && (
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Du musst <Link to="/auth" search={{ mode: "signin" as const }} className="font-semibold text-brand hover:underline">angemeldet</Link> sein.
            </p>
          )}
        </form>
      </div>
    </PageShell>
  );
}
