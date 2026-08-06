import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, Ban, MessageCircleWarning, Scale, Gavel, Sparkles } from "lucide-react";

export const Route = createFileRoute("/regeln")({
  head: () => ({
    meta: [
      { title: "Verkaufs- & Nutzungsregeln — CreaHQ" },
      {
        name: "description",
        content:
          "Die Regeln auf CreaHQ: was verkauft werden darf, wie wir mit Fake, Spam und Betrug umgehen und wie ein fairer Chat aussieht.",
      },
      { property: "og:title", content: "Verkaufs- & Nutzungsregeln — CreaHQ" },
      {
        property: "og:description",
        content: "Faire Regeln für Käufer:innen und Shops auf CreaHQ — verbotene Ware, Chat-Verhalten und Sperren.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RulesPage,
});

const SECTIONS = [
  {
    icon: Ban,
    title: "Verbotene Ware",
    items: [
      "Waffen, Drogen, Medikamente, Tabak und Alkohol",
      "Gestohlene, gefälschte oder raubkopierte Artikel und Software",
      "Accounts, Keys, Follower, Bewertungen oder Dienstleistungen zum Täuschen",
      "Inhalte für Erwachsene, Gewaltverherrlichung, Hass oder Diskriminierung",
      "Alles, was in Deutschland oder der EU rechtswidrig ist",
    ],
  },
  {
    icon: Sparkles,
    title: "Ehrliche Listings",
    items: [
      "Titel, Bilder und Beschreibung müssen zum echten Produkt passen",
      "Eigene Bilder verwenden — keine geklauten Fotos aus fremden Shops",
      "Preis, Versandkosten und Lieferzeit klar angeben",
      "Keine Dubletten: maximal 3 neue Listings pro Tag und Account",
      "Ohne Verkauf werden Listings nach 6 Monaten automatisch offline genommen",
    ],
  },
  {
    icon: MessageCircleWarning,
    title: "Chat-Verhalten",
    items: [
      "Freundlich bleiben — keine Beleidigungen, Drohungen oder Spam",
      "Keine Zahlung außerhalb von CreaHQ (kein PayPal-Freunde, keine Krypto-Links)",
      "Keine privaten Daten von anderen weitergeben",
      "Preisvorschläge laufen über die Angebots-Funktion im Produkt-Chat",
    ],
  },
  {
    icon: Scale,
    title: "Recht & Pflichten der Shops",
    items: [
      "Als gewerblicher Shop: Impressum, Widerruf und Steuern selbst einhalten",
      "Versand sicher verpacken und Tracking eintragen",
      "Bestätigte E-Mail-Adresse ist Pflicht, bevor du verkaufst",
      "Digitale Produkte müssen unmittelbar nach Zahlung bereitgestellt werden",
    ],
  },
  {
    icon: Gavel,
    title: "Was passiert bei Verstößen",
    items: [
      "CreaHQ darf Listings jederzeit sperren, pausieren oder entfernen",
      "Accounts können bei Betrug, Fake oder Trolling gesperrt werden",
      "Meldungen werden geprüft — Missbrauch der Melden-Funktion ist selbst ein Verstoß",
      "Bei Straftaten behalten wir uns rechtliche Schritte vor",
    ],
  },
];

function RulesPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 pb-24 pt-10 sm:px-6">
      <span className="inline-flex items-center gap-2 rounded-full bg-brand-soft px-4 py-1.5 text-xs font-black uppercase tracking-widest text-brand">
        <ShieldCheck className="h-4 w-4" /> Community-Regeln
      </span>
      <h1 className="mt-4 font-display text-4xl font-black text-brand-ink sm:text-5xl">
        Verkaufs- & Nutzungsregeln
      </h1>
      <p className="mt-3 text-base text-muted-foreground">
        CreaHQ soll ein sicherer Marktplatz für digitale und physische Produkte, Services und Chatbots sein. Wer hier
        verkauft oder kauft, akzeptiert diese Regeln.
      </p>

      <div className="mt-8 space-y-5">
        {SECTIONS.map((s) => (
          <section key={s.title} className="rounded-3xl border border-border bg-card p-6 sm:p-7">
            <h2 className="flex items-center gap-3 font-display text-2xl font-black text-brand-ink">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-brand-soft text-brand">
                <s.icon className="h-5 w-5" />
              </span>
              {s.title}
            </h2>
            <ul className="mt-4 space-y-2.5">
              {s.items.map((item) => (
                <li key={item} className="flex gap-3 text-sm text-brand-ink">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <div className="mt-8 rounded-3xl border border-border bg-brand-soft/40 p-6">
        <p className="text-sm font-semibold text-brand-ink">
          Etwas entdeckt, das gegen die Regeln verstößt? Nutze den „Melden“-Button auf dem Produkt, im Shop oder im
          Chat.
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-sm font-bold">
          <Link to="/agb" className="rounded-full bg-card px-4 py-2 text-brand-ink hover:text-brand">
            AGB
          </Link>
          <Link to="/datenschutz" className="rounded-full bg-card px-4 py-2 text-brand-ink hover:text-brand">
            Datenschutz
          </Link>
          <Link to="/gebuehren" className="rounded-full bg-card px-4 py-2 text-brand-ink hover:text-brand">
            Gebühren
          </Link>
          <Link to="/hilfe" className="rounded-full bg-card px-4 py-2 text-brand-ink hover:text-brand">
            Hilfe
          </Link>
        </div>
      </div>
    </div>
  );
}
