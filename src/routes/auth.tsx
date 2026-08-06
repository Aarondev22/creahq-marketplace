import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>) => ({
    mode: search.mode === "signup" ? "signup" as const : "signin" as const,
  }),
  head: () => ({
    meta: [
      { title: "Anmelden — CreaHQ" },
      { name: "description", content: "Melde dich an oder erstelle einen CreaHQ-Account." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { mode: initialMode } = Route.useSearch();
  const [mode, setMode] = useState<"signin" | "signup" | "reset">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", search: { tab: "overview" as const } });
    });
  }, [navigate]);

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { display_name: displayName || email.split("@")[0] },
          },
        });
        if (error) throw error;
        toast.success("Willkommen! Du bist eingeloggt.");
        navigate({ to: "/dashboard", search: { tab: "overview" as const } });
      } else if (mode === "reset") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + "/auth",
        });
        if (error) throw error;
        toast.success("E-Mail zum Zurücksetzen wurde verschickt. Bitte Posteingang prüfen.");
        setMode("signin");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Eingeloggt.");
        navigate({ to: "/dashboard", search: { tab: "overview" as const } });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Hat nicht geklappt");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) {
      toast.error("Google Sign-in fehlgeschlagen");
      setLoading(false);
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/dashboard", search: { tab: "overview" as const } });
  }

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-6 py-12">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-[2rem] border border-border bg-card p-8 shadow-xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-brand to-brand-ink text-2xl">✨</div>
          <h1 className="font-display text-3xl font-black text-brand-ink">
            {mode === "signup" ? "Werde Teil von CreaHQ" : mode === "reset" ? "Passwort zurücksetzen" : "Willkommen zurück"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "signup"
              ? "In 30 Sekunden eingerichtet — kaufen und verkaufen mit einem Account."
              : mode === "reset"
              ? "Gib deine E-Mail ein, wir schicken dir einen Link zum Zurücksetzen."
              : "Schön, dass du wieder da bist."}
          </p>
        </div>

        {mode !== "reset" && (
          <>
            <button
              type="button"
              onClick={handleGoogle}
              disabled={loading}
              className="mb-3 flex w-full items-center justify-center gap-2 rounded-full border border-border bg-white px-4 py-3 text-sm font-semibold text-gray-800 transition-transform hover:scale-[1.02] disabled:opacity-60"
            >
              <GoogleIcon /> Mit Google fortfahren
            </button>

            <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" /> oder mit E-Mail <span className="h-px flex-1 bg-border" />
            </div>
          </>
        )}

        <form onSubmit={handleEmail} className="space-y-3">
          {mode === "signup" && (
            <input
              type="text"
              placeholder="Anzeigename"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full rounded-full border border-border bg-background px-4 py-3 text-sm focus:border-brand focus:outline-none"
            />
          )}
          <input
            type="email"
            required
            placeholder="E-Mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-full border border-border bg-background px-4 py-3 text-sm focus:border-brand focus:outline-none"
          />
          {mode !== "reset" && (
            <input
              type="password"
              required
              minLength={8}
              placeholder="Passwort (min. 8 Zeichen)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-full border border-border bg-background px-4 py-3 text-sm focus:border-brand focus:outline-none"
            />
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-brand px-4 py-3 text-sm font-bold text-primary-foreground brand-glow transition-transform hover:scale-[1.02] disabled:opacity-60"
          >
            {loading
              ? "Moment …"
              : mode === "signup"
              ? "Account erstellen"
              : mode === "reset"
              ? "Link zusenden"
              : "Anmelden"}
          </button>
        </form>

        {mode === "signin" && (
          <p className="mt-3 text-center text-sm">
            <button type="button" onClick={() => setMode("reset")} className="font-semibold text-brand hover:underline">
              Passwort vergessen?
            </button>
          </p>
        )}

        <p className="mt-5 text-center text-sm text-muted-foreground">
          {mode === "reset" ? (
            <button type="button" onClick={() => setMode("signin")} className="font-semibold text-brand hover:underline">
              Zurück zum Login
            </button>
          ) : (
            <>
              {mode === "signup" ? "Schon dabei? " : "Neu hier? "}
              <button
                type="button"
                onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
                className="font-semibold text-brand hover:underline"
              >
                {mode === "signup" ? "Anmelden" : "Account erstellen"}
              </button>
            </>
          )}
        </p>
        <p className="mt-3 text-center text-xs text-muted-foreground">
          <Link to="/" className="hover:text-brand">Zurück zur Startseite</Link>
        </p>
      </motion.div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.97 10.97 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
  );
}
