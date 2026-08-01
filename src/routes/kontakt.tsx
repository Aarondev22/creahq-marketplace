import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageShell } from "@/components/PageShell";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/kontakt")({
  head: () => ({ meta: [{ title: "Kontakt — CreaHQ" }, { name: "description", content: "Schreib uns." }] }),
  component: ContactPage,
});

function ContactPage() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      name: String(fd.get("name") ?? "").trim(),
      email: String(fd.get("email") ?? "").trim(),
      message: String(fd.get("message") ?? "").trim(),
    };
    if (!payload.name || !payload.email || !payload.message) return;
    setLoading(true);
    const { error } = await supabase.from("contact_messages").insert(payload);
    setLoading(false);
    if (error) {
      toast.error("Konnte nicht speichern — versuch's per E-Mail.");
      return;
    }
    setSent(true);
    toast.success("Nachricht angekommen!");
  }

  return (
    <PageShell eyebrow="Kontakt" title="Sag Hallo." lead="Bug, Idee, Kooperation oder einfach hi sagen — wir antworten.">
      {sent ? (
        <div className="rounded-3xl border border-brand/30 bg-brand-soft/50 p-6 text-center">
          <div className="text-5xl">💌</div>
          <p className="mt-3 font-display text-xl font-black text-brand-ink">Danke, ist angekommen!</p>
          <p className="mt-1 text-sm text-muted-foreground">Wir lesen alle Nachrichten im Admin-Panel und melden uns per E-Mail.</p>
        </div>
      ) : (
        <form onSubmit={submit} className="not-prose space-y-4">
          <Field label="Dein Name" name="name" required />
          <Field label="E-Mail" name="email" type="email" required />
          <div>
            <label className="mb-1 block text-sm font-semibold text-brand-ink">Nachricht</label>
            <textarea name="message" required rows={6} maxLength={4000} className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm focus:border-brand focus:outline-none" />
          </div>
          <button disabled={loading} className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-bold text-primary-foreground brand-glow hover:scale-105 transition-transform disabled:opacity-60">
            {loading ? "Schicke …" : "Schicken"}
          </button>
        </form>
      )}
      <p className="mt-8 text-sm text-muted-foreground">
        Oder direkt per E-Mail: <a href="mailto:hello@creahq.app">hello@creahq.app</a>
      </p>
    </PageShell>
  );
}

function Field({ label, name, type = "text", required }: { label: string; name: string; type?: string; required?: boolean }) {
  return (
    <div>
      <label htmlFor={name} className="mb-1 block text-sm font-semibold text-brand-ink">{label}</label>
      <input id={name} name={name} type={type} required={required} maxLength={type === "email" ? 255 : 100} className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm focus:border-brand focus:outline-none" />
    </div>
  );
}
