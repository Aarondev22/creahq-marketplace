import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";

export const Route = createFileRoute("/ueber")({
  head: () => ({ meta: [{ title: "Über CreaHQ" }, { name: "description", content: "Was wir glauben und warum." }] }),
  component: () => (
    <PageShell eyebrow="Über uns" title="Marktplatz mit Charakter." lead="Wir bauen einen Ort, an dem Creator-Sachen nicht in einer endlosen Suchleiste untergehen.">
      <p>CreaHQ ist im Aufbau und nimmt es persönlich. Kein Fee-Dschungel, kein Bewertungs-Theater, keine Pop-ups. Stattdessen: ein hübscher Shop in zwei Minuten, faire Gebühren und Werkzeuge, die Spaß machen.</p>
      <h2>Wofür wir stehen</h2>
      <ul>
        <li>Creator first: du bestimmst Preis, Stil und Versand.</li>
        <li>Fair: keine Monatsgebühr — und Provision sinkt, je mehr du verkaufst.</li>
        <li>Verspielt: ein Marktplatz darf Persönlichkeit haben.</li>
      </ul>
    </PageShell>
  ),
});
