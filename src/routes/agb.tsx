import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";

export const Route = createFileRoute("/agb")({
  head: () => ({ meta: [{ title: "AGB — CreaHQ" }] }),
  component: () => (
    <PageShell title="Allgemeine Geschäftsbedingungen" lead="Platzhalter — finalisierte AGB folgen vor dem öffentlichen Launch.">
      <h2>1. Geltungsbereich</h2>
      <p>Diese AGB regeln die Nutzung des Marktplatzes CreaHQ zwischen Käufer:innen, Creator:innen und CreaHQ als Plattform.</p>
      <h2>2. Vertragsschluss</h2>
      <p>Verträge über Produkte und Services kommen direkt zwischen Käufer:in und Creator:in zustande. CreaHQ vermittelt nur.</p>
      <h2>3. Gebühren</h2>
      <p>Es fallen keine monatlichen Gebühren an. Pro Verkauf wird eine gestaffelte Provision einbehalten — Details siehe Gebührenseite.</p>
      <h2>4. Widerruf</h2>
      <p>Bei digitalen Produkten erlischt das Widerrufsrecht mit Download. Bei physischen Produkten gilt das gesetzliche Widerrufsrecht.</p>
    </PageShell>
  ),
});
