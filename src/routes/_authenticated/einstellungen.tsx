import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Check, Settings as SettingsIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/einstellungen")({
  head: () => ({
    meta: [
      { title: "Einstellungen — CreaHQ" },
      { name: "description", content: "Ändere deinen Anzeigenamen und deinen Shop-Handle auf CreaHQ." },
      { property: "og:title", content: "Einstellungen — CreaHQ" },
      { property: "og:description", content: "Ändere deinen Anzeigenamen und deinen Shop-Handle auf CreaHQ." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SettingsPage,
});

const HANDLE_RE = /^[a-z0-9_]{3,30}$/;

function SettingsPage() {
  const [displayName, setDisplayName] = useState("");
  const [handle, setHandle] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { window.scrollTo(0, 0); }, []);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data } = await supabase.from("profiles").select("display_name,handle").eq("id", u.user.id).maybeSingle();
      setDisplayName(data?.display_name ?? "");
      setHandle(data?.handle ?? "");
      setLoading(false);
    })();
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const cleanHandle = handle.trim().toLowerCase();
    if (!displayName.trim()) return setError("Anzeigename darf nicht leer sein.");
    if (!HANDLE_RE.test(cleanHandle)) return setError("Handle: 3–30 Zeichen, nur a–z, 0–9 und _");
    setError("");
    setSaving(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Nicht eingeloggt");
      const { error: err } = await supabase
        .from("profiles")
        .update({ display_name: displayName.trim(), handle: cleanHandle })
        .eq("id", u.user.id);
      if (err) {
        if (err.code === "23505") throw new Error("Dieser Handle ist schon vergeben.");
        throw err;
      }
      await supabase.auth.updateUser({ data: { display_name: displayName.trim() } });
      setHandle(cleanHandle);
      toast.success("Gespeichert!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Fehler beim Speichern");
    } finally { setSaving(false); }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 pb-24 pt-8 sm:px-6">
      <Link to="/dashboard" search={{ tab: "overview" as const }} className="inline-flex items-center gap-2 rounded-full bg-brand-soft px-4 py-2.5 text-sm font-bold text-brand-ink hover:bg-brand hover:text-primary-foreground">
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
            <label htmlFor="display_name" className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-muted-foreground">Anzeigename</label>
            <input
              id="display_name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="min-h-12 w-full rounded-full border border-border bg-background px-4 text-sm focus:border-brand focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="handle" className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-muted-foreground">Shop-Handle</label>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-muted-foreground">creahq.de/shop/</span>
              <input
                id="handle"
                value={handle}
                onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                className="min-h-12 flex-1 rounded-full border border-border bg-background px-4 font-mono text-sm focus:border-brand focus:outline-none"
              />
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">Nur Kleinbuchstaben, Zahlen und _ · muss einzigartig sein.</p>
          </div>

          {error && <p className="text-xs font-semibold text-red-600">{error}</p>}

          <button type="submit" disabled={saving} className="inline-flex min-h-12 items-center gap-2 rounded-full bg-brand px-6 text-sm font-bold text-primary-foreground brand-glow disabled:opacity-60">
            <Check className="h-4 w-4" /> {saving ? "Speichere …" : "Speichern"}
          </button>
        </form>
      )}
    </div>
  );
}
