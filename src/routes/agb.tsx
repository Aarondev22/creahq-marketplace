import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";

export const Route = createFileRoute("/agb")({
  head: () => ({
    meta: [
      { title: "AGB — CreaHQ" },
      { name: "description", content: "Allgemeine Geschäftsbedingungen des Kreativmarktplatzes CreaHQ." },
      { property: "og:title", content: "AGB — CreaHQ" },
      { property: "og:description", content: "Vermittlerrolle, Treuhand, Streitfälle und Gebühren auf CreaHQ." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <PageShell title="Allgemeine Geschäftsbedingungen" lead="Stand: [Datum]. Vor dem Start rechtlich prüfen lassen.">
      <h2>§ 1 Geltungsbereich & Rolle von CreaHQ</h2>
      <p>CreaHQ betreibt einen Online-Marktplatz und ist ausschließlich Vermittler (Hosting-Anbieter im Sinne des DSA). Kaufverträge kommen ausschließlich zwischen Käufer und Verkäufer zustande. CreaHQ ist weder Hersteller noch Verkäufer der angebotenen Produkte.</p>
      <h2>§ 2 Pflichten und Haftung der Verkäufer</h2>
      <p>Verkäufer versichern, alle Urheber-, Marken- und Nutzungsrechte an ihren Angeboten zu besitzen. Sie haften allein für ihre Produkte, Beschreibungen und Gewährleistung. Verkäufer stellen CreaHQ und den Betreiber von sämtlichen Ansprüchen Dritter einschließlich angemessener Rechtsverteidigungs- und Abmahnkosten frei.</p>
      <h2>§ 3 Zahlungsabwicklung & Treuhand</h2>
      <p>Zahlungen werden über einen lizenzierten Zahlungsdienstleister abgewickelt. Der Verkaufserlös wird zum Schutz beider Seiten 10 Tage nach dem Verkauf einbehalten und erst danach ausgezahlt, sofern kein Streitfall offen ist.</p>
      <h2>§ 4 Gebühren</h2>
      <p>Pro Verkauf wird eine Provision einbehalten (siehe Gebührenseite). Pro kostet 4,99 € pro Monat und ist monatlich kündbar.</p>
      <h2>§ 5 Digitale Produkte & Widerruf</h2>
      <p>Bei digitalen Inhalten erlischt das Widerrufsrecht, wenn der Käufer vor dem Kauf ausdrücklich zustimmt, dass die Ausführung sofort beginnt, und bestätigt, dass er dadurch sein Widerrufsrecht verliert (§ 356 Abs. 5 BGB).</p>
      <h2>§ 6 Streitfälle & automatisierte Prüfung</h2>
      <p>Bei Problemen klären Käufer und Verkäufer den Fall zunächst 48 Stunden im Chat. Danach prüft ein automatisiertes System anhand objektiver Daten (z. B. Download-Protokoll, Dateigröße, Sendungsstatus). Beide Seiten stimmen dieser automatisierten Vorprüfung zu. Gegen jede Entscheidung kann über das interne Beschwerdesystem eine Überprüfung durch einen Menschen verlangt werden (Art. 20 DSA).</p>
      <h2>§ 7 Bearbeitungsgebühr bei berechtigter Reklamation</h2>
      <p>Muss ein Fall zugunsten des Käufers entschieden werden, weil der Verkäufer ihn verschuldet hat, wird eine Bearbeitungsgebühr vom Guthaben des Verkäufers einbehalten: 0,20 € bei digitalen Produkten, 2,50–5,00 € bei physischen Produkten. Einigungen im Chat und abgewiesene Fälle sind gebührenfrei.</p>
      <h2>§ 8 Verbotene Inhalte</h2>
      <p>Verboten sind insbesondere Fälschungen, Spam, Schadcode, Hassrede, rechtswidrige und jugendgefährdende Inhalte sowie das Umgehen der Plattform (z. B. Zahlungen außerhalb von CreaHQ). Verstöße führen zur Sperrung des Kontos; durch Verstöße erlangte Auszahlungen können einbehalten werden.</p>
      <h2>§ 9 Haftung von CreaHQ</h2>
      <p>CreaHQ haftet nur für Vorsatz und grobe Fahrlässigkeit sowie bei Verletzung von Leben, Körper oder Gesundheit. Für Inhalte der Nutzer haftet CreaHQ erst ab Kenntnis und nur bei unterlassener Entfernung.</p>
      <h2>§ 10 Schlussbestimmungen</h2>
      <p>Es gilt deutsches Recht. Zwingende Verbraucherschutzvorschriften des Wohnsitzstaates bleiben unberührt.</p>
    </PageShell>
  ),
});
