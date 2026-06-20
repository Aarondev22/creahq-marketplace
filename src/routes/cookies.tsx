import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";

export const Route = createFileRoute("/cookies")({
  head: () => ({ meta: [{ title: "Cookies — CreaHQ" }] }),
  component: () => (
    <PageShell title="Cookies" lead="Was wir setzen — und warum.">
      <h2>Notwendig</h2>
      <p>Login-Session, CSRF-Schutz, Spracheinstellung.</p>
      <h2>Funktional</h2>
      <p>Hero-Theme & UI-Präferenzen (lokal im Browser).</p>
      <h2>Tracking</h2>
      <p>Aktuell keins. Sobald sich das ändert, fragen wir explizit.</p>
    </PageShell>
  ),
});
