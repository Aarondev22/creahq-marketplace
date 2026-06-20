import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";

export const Route = createFileRoute("/datenschutz")({
  head: () => ({ meta: [{ title: "Datenschutz — CreaHQ" }] }),
  component: () => (
    <PageShell title="Datenschutz" lead="So gehen wir mit deinen Daten um. Platzhalter — finale Datenschutzerklärung folgt.">
      <h2>Verantwortlich</h2>
      <p>CreaHQ (in Gründung), hello@creahq.app</p>
      <h2>Welche Daten wir verarbeiten</h2>
      <ul>
        <li>Kontodaten (E-Mail, Anzeige­name)</li>
        <li>Inhalte, die du hochlädst</li>
        <li>Bestelldaten zur Abwicklung</li>
      </ul>
      <h2>Deine Rechte</h2>
      <p>Auskunft, Berichtigung, Löschung — schreib uns an hello@creahq.app.</p>
    </PageShell>
  ),
});
