import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageShell } from "@/components/PageShell";
import { toast } from "sonner";

export const Route = createFileRoute("/kontakt")({
  head: () => ({ meta: [{ title: "Kontakt — CreaHQ" }, { name: "description", content: "Schreib uns." }] }),
  component: ContactPage,
});

function ContactPage() {
  const [sent, setSent] = useState(false);
  return (
    <PageShell eyebrow="Kontakt" title="Sag Hallo." lead="Bug, Idee, Kooperation oder einfach hi sagen — wir antworten.">
      {sent ? (
        <div className="rounded-3xl border border-brand/30 bg-brand-soft/50 p-6 text-center">
          <div className="text-5xl">💌</div>
          <p className="mt-3 font-display text-xl font-black text-brand-ink">Danke, ist angekommen!</p>
          <p className="mt-1 text-sm text-muted-foreground">Wir melden uns in den nächsten Tagen.</p>
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSent(true);
            toast.success("Nachricht gespeichert — wir lesen alles.");
          }}
          className="not-prose space-y-4"
        >
          <Field label="Dein Name" name="name" required />
          <Field label="E-Mail" name="email" type="email" required />
          <div>
            <label className="mb-1 block text-sm font-semibold text-brand-ink">Nachricht</label>
            <textarea required rows={6} className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm focus:border-brand focus:outline-none" />
          </div>
          <button className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-bold text-primary-foreground brand-glow hover:scale-105 transition-transform">
            Schicken
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
      <input id={name} name={name} type={type} required={required} className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm focus:border-brand focus:outline-none" />
    </div>
  );
}
