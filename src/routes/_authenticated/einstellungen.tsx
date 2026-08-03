import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Check, Settings as SettingsIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/_authenticated/einstellungen")({
  head: () => ({
    meta: [
      { title: "Einstellungen — CreaHQ" },
      { name: "description", content: "Ändere deinen Anzeigenamen und deinen Shop-Handle auf CreaHQ." },
    ],
  }),
  component: SettingsPage,
});

const HANDLE_RE = /^[a-z0-9_]{3,30}$/;

function SettingsPage() {
  const qc = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [handle, setHandle] = useState("");
  const [originalHandle, setOriginalHandle] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [handleStatus, setHandleStatus] = useState<"idle" | "checking" | "free" | "taken" | "invalid">("idle");
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      setUserId(u.user.id);
      const { data } = await supabase
        .from("profiles")
        .select("display_name,handle")
        .eq("id", u.user.id)
        .maybeSingle();
      setDisplayName(data?.display_name ?? "");
      setHandle(data?.handle ?? "");
      setOriginalHandle(data?.handle ?? "");
      setLoading(false);
    })();
  }, []);

  const checkHandle = useCallback(
    async (value: string) => {
      const clean = value.trim().toLowerCase();
      if (!clean) {
        setHandleStatus("idle");
        return;
      }
      if (!HANDLE_RE.test(clean)) {
        setHandleStatus("invalid");
        return;
      }
      if (clean === originalHandle) {
        setHandleStatus("free");
        return;
      }
      setHandleStatus("checking");
      const { data } = await supabase
        .from("profiles")
        .select("id")
        .eq("handle", clean)
        .maybeSingle();
      setHandleStatus(data ? "taken" : "free");
    },
    [originalHandle]
  );

  useEffect(() => {
    const t = setTimeout(() => {
      void checkHandle(handle);
    }, 350);
    return () => clearTimeout(t);
  }, [handle, checkHandle]);

  async function loadSuggestions(base: string) {
    const root =
      base
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "")
        .slice(0, 12) || "crea";

    const candidates = [
      root,
      `${root}_shop`,
      `${root}_hq`,
      `${root}${Math.floor(10 + Math.random() * 89)}`,
      `crea_${root}`.slice(0, 30),
      `${root}_art`,
    ].filter((h) => HANDLE_RE.test(h));

    const unique = Array.from(new Set(candidates));
    const free: string[] = [];

    for (const h of unique) {
      if (free.length >= 5) break;
      if (h === originalHandle) {
        free.push(h);
        continue;
      }
      const { data } = await supabase.from("profiles").select("id").eq("handle", h).maybeSingle();
      if (!data) free.push(h);
    }
    setSuggestions(free);
  }

  useEffect(() => {
    const t = setTimeout(() => {
      void loadSuggestions(displayName || handle);
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayName]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const cleanHandle = handle.trim().toLowerCase();
    if (!displayName.trim()) return setError("Anzeigename darf nicht leer sein.");
    if (!HANDLE_RE.test(cleanHandle)) return setError("Handle: 3–30 Zeichen, nur a–z, 0–9 und _");
    if (handleStatus === "taken") return setError("Dieser Handle ist schon vergeben.");
    setError("");
    setSaving(true);
    try {
      if (!userId) throw new Error("Nicht eingeloggt");

      if (cleanHandle !== originalHandle) {
        const { data: exists } = await supabase
          .from("profiles")
          .select("id")
          .eq("handle", cleanHandle)
          .maybeSingle();
        if (exists) throw new Error("Dieser Handle ist schon vergeben.");
      }

      const { error: err } = await supabase
        .from("profiles")
        .update({ display_name: displayName.trim(), handle: cleanHandle })
        .eq("id", userId);
      if (err) {
        if (err.code === "23505") throw new Error("Dieser Handle ist schon vergeben.");
        throw err;
      }

      await supabase.auth.updateUser({ data: { display_name: displayName.trim() } });

      setHandle(cleanHandle);
      setOriginalHandle(cleanHandle);

      await qc.invalidateQueries({ queryKey: ["profile"] });
      window.dispatchEvent(
        new CustomEvent("creahq:profile-updated", {
          detail: { display_name: displayName.trim(), handle: cleanHandle },
        })
      );

      toast.success("Gespeichert!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Fehler beim Speichern");
    } finally {
      setSaving(false);
    }
  }

  const statusText =
    handleStatus === "checking"
      ? "Prüfe …"
      : handleStatus === "free"
        ? "Verfügbar"
        : handleStatus === "taken"
          ? "Bereits vergeben"
          : handleStatus === "invalid"
            ? "Ungültig (3–30, nur a–z 0–9 _)"
            : "";

  return (
    <div className="mx-auto max-w-2xl px-4 pb-24 pt-8 sm:px-6">
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-2 rounded-full bg-brand-soft px-4 py-2.5 text-sm font-bold text-brand-ink hover:bg-brand hover:text-primary-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Zum Dashboard
      </Link>

      <h1 className="mt-5 inline-flex items-center gap-2 font-display text-4xl font-black text-brand-ink">
        <SettingsIcon className="h-7 w-7" /> Einstellungen
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">Dein öffentliches Profil auf CreaHQ.</p>

      {loading ? (
        <p className="mt-8 text-sm text-muted-foreground">Lade …</p>
      ) : (
        <form onSubmit={save} className="mt-6 space-y-5 rounded-3xl border border-border bg-card p-6 sm:p-8">
          <div>
            <label htmlFor="display_name" className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Anzeigename
            </label>
            <input
              id="display_name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="min-h-12 w-full rounded-full border border-border bg-background px-4 text-sm focus:border-brand focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="handle" className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Shop-Handle
            </label>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-muted-foreground">/shop/</span>
              <input
                id="handle"
                value={handle}
                onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                className="min-h-12 flex-1 rounded-full border border-border bg-background px-4 font-mono text-sm focus:border-brand focus:outline-none"
              />
            </div>
            {statusText && (
              <p
                className={`mt-1.5 text-xs font-semibold ${
                  handleStatus === "free"
                    ? "text-emerald-600"
                    : handleStatus === "taken" || handleStatus === "invalid"
                      ? "text-red-600"
                      : "text-muted-foreground"
                }`}
              >
                {statusText}
              </p>
            )}
          </div>

          {suggestions.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Noch freie Vorschläge
              </p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setHandle(s)}
                    className="rounded-full border border-border bg-surface px-3 py-1.5 font-mono text-xs font-semibold text-brand-ink hover:border-brand hover:text-brand"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && <p className="text-xs font-semibold text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={saving || handleStatus === "taken" || handleStatus === "invalid"}
            className="inline-flex min-h-12 items-center gap-2 rounded-full bg-brand px-6 text-sm font-bold text-primary-foreground brand-glow disabled:opacity-60"
          >
            <Check className="h-4 w-4" /> {saving ? "Speichere …" : "Speichern"}
          </button>
        </form>
      )}
    </div>
  );
}