import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";

export const Route = createFileRoute("/hilfe")({
  head: () => ({ meta: [{ title: "Hilfe & FAQ — CreaHQ" }, { name: "description", content: "Antworten auf häufige Fragen." }] }),
  component: () => (
    <PageShell eyebrow="Hilfe" title="Wir helfen gern." lead="Die häufigsten Fragen — sortiert. Wenn deine nicht dabei ist, schreib uns über Kontakt.">
      <h2>Allgemein</h2>
      <h3>Was ist CreaHQ?</h3>
      <p>Ein verspielter Marktplatz für Sachen, die Creator selbst gemacht haben — digital und physisch.</p>
      <h3>Brauche ich ein Konto zum Stöbern?</h3>
      <p>Nein. Zum Kaufen oder Verkaufen schon.</p>

      <h2>Kaufen</h2>
      <h3>Wie kriege ich digitale Produkte?</h3>
      <p>Direkt nach Zahlung als signierter Download in deinem Dashboard und per E-Mail.</p>
      <h3>Wie läuft Versand bei physischen Produkten?</h3>
      <p>Versand & Rückgabe regelt die Creator:in. Details stehen auf jeder Produktseite.</p>

      <h2>Verkaufen</h2>
      <h3>Was kostet Verkaufen?</h3>
      <p>Keine monatliche Gebühr. Pro Verkauf <strong>17 %</strong> bei digitalen, <strong>12 %</strong> bei physischen Produkten — alle 25 Verkäufe im Monat 1 % weniger. <Link to="/gebuehren">Details ansehen →</Link></p>
      <h3>Wann werde ich ausgezahlt?</h3>
      <p>Stripe zahlt automatisch nach der üblichen Frist auf dein hinterlegtes Konto aus.</p>

      <h2>Konto</h2>
      <h3>Wie ändere ich mein Passwort?</h3>
      <p>Auf der <Link to="/auth" search={{ mode: "signin" as const }}>Anmeldeseite</Link> über „Passwort vergessen".</p>
    </PageShell>
  ),
});
