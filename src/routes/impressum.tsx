import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";

export const Route = createFileRoute("/impressum")({
  head: () => ({
    meta: [
      { title: "Impressum — CreaHQ" },
      { name: "description", content: "Anbieterkennzeichnung von CreaHQ nach § 5 DDG." },
      { property: "og:title", content: "Impressum — CreaHQ" },
      { property: "og:description", content: "Anbieterkennzeichnung von CreaHQ nach § 5 DDG." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <PageShell title="Impressum" lead="Angaben gemäß § 5 Digitale-Dienste-Gesetz (DDG).">
      <p><em>Hinweis: Platzhalter – die echten Angaben werden vor dem offiziellen Start eingetragen.</em></p>
      <h2>Anbieter</h2>
      <p>[Vorname Nachname]<br />[Firmenname / Einzelunternehmen]<br />[Musterstraße 123]<br />[12345 Musterstadt]<br />Deutschland</p>
      <h2>Kontakt</h2>
      <p>E-Mail: [kontakt@creahq.de]<br />Telefon: [optional]</p>
      <h2>Umsatzsteuer</h2>
      <p>USt-IdNr. gemäß § 27a UStG: [falls vorhanden] – bzw. Kleinunternehmer nach § 19 UStG.</p>
      <h2>Verantwortlich für den Inhalt (§ 18 Abs. 2 MStV)</h2>
      <p>[Vorname Nachname], Anschrift wie oben.</p>
      <h2>Zentrale Kontaktstelle (Art. 11 & 12 DSA)</h2>
      <p>Für Behörden und Nutzer: [kontakt@creahq.de]. Kommunikation auf Deutsch und Englisch.</p>
      <h2>Rechtsverletzungen melden</h2>
      <p>Rechtswidrige Inhalte können über den Melde-Knopf auf jeder Produkt- und Shopseite gemeldet werden. Wir prüfen unverzüglich und entfernen rechtswidrige Inhalte.</p>
      <h2>Streitschlichtung</h2>
      <p>Wir sind nicht verpflichtet und nicht bereit, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.</p>
      <h2>Rolle von CreaHQ</h2>
      <p>CreaHQ ist eine Vermittlungsplattform. Für Produkte und deren Inhalte sind die jeweiligen Verkäufer verantwortlich.</p>
    </PageShell>
  ),
});
