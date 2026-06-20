import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";

export const Route = createFileRoute("/impressum")({
  head: () => ({ meta: [{ title: "Impressum — CreaHQ" }] }),
  component: () => (
    <PageShell title="Impressum" lead="Angaben gemäß § 5 TMG.">
      <p><em>Platzhalter — wird vor Launch ergänzt.</em></p>
      <h2>Anbieter</h2>
      <p>CreaHQ (in Gründung)<br/>Anschrift folgt</p>
      <h2>Kontakt</h2>
      <p>E-Mail: hello@creahq.app</p>
      <h2>Verantwortlich für den Inhalt</h2>
      <p>Wird ergänzt.</p>
    </PageShell>
  ),
});
