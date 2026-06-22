import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";
import { Instagram, Music2, Camera, Package, Truck, Banknote, ShieldCheck, MessageSquare, Sparkles } from "lucide-react";
import { feeForSale } from "@/lib/fees";

export const Route = createFileRoute("/verkaufen/guide")({
  head: () => ({
    meta: [
      { title: "Verkäufer-Guide — CreaHQ" },
      { name: "description", content: "Alles, was du als Verkäufer auf CreaHQ wissen musst: Marketing, Versand, Payouts, Tracking, Streitfälle." },
      { property: "og:title", content: "Verkäufer-Guide — CreaHQ" },
      { property: "og:description", content: "Marketing, Versand, Payouts und Tracking auf einen Blick." },
    ],
  }),
  component: GuidePage,
});

function GuidePage() {
  return (
    <PageShell
      eyebrow="Verkäufer-Guide"
      title="So holst du das Beste aus deinem Shop."
      lead="Marketing, Versand, Payouts, Tracking, Streitfälle. Lies einmal durch — und du bist startklar."
    >
      <div className="space-y-12">
        <Block icon={<Sparkles className="h-6 w-6" />} title="1. Marketing — Social Media bringt Käufer">
          <p className="text-muted-foreground">CreaHQ pusht dich auf der Startseite, aber der größte Hebel bleibt dein eigenes Publikum. Pro Plattform unsere Best Practices:</p>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <Card icon={<Instagram className="h-5 w-5" />} title="Instagram & TikTok">
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                <li>• 3–5 Reels/Woche, Behind-the-Scenes deines Werks</li>
                <li>• Hashtags: <code className="text-brand">#creahq</code>, <code className="text-brand">#handmade</code>, dein Genre</li>
                <li>• Verlinke dein Shop-Profil: <code className="text-brand">creahq.app/shop/dein-handle</code></li>
                <li>• Beste Zeit: 18–21 Uhr werktags</li>
              </ul>
            </Card>
            <Card icon={<Camera className="h-5 w-5" />} title="Pinterest">
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                <li>• Pin pro Listing mit hoher Auflösung (1000×1500)</li>
                <li>• Beschreibung mit Suchbegriffen, nicht Hashtags</li>
                <li>• Boards thematisch: "Wohnzimmer-Prints", "Geschenkideen"</li>
                <li>• Langer Tail — Pins bringen 6–12 Monate Traffic</li>
              </ul>
            </Card>
            <Card icon={<Music2 className="h-5 w-5" />} title="YouTube Shorts">
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                <li>• Speed-Up vom Produktionsprozess (30–60 Sek.)</li>
                <li>• Beschreibung mit Shop-Link & 3 Keywords</li>
                <li>• Kommentare beantworten = Reichweite</li>
                <li>• 1–2 Shorts/Woche reichen für Sichtbarkeit</li>
              </ul>
            </Card>
          </div>
          <div className="mt-5 rounded-2xl border border-dashed border-brand/40 bg-brand-soft/30 p-4 text-sm">
            <strong className="text-brand-ink">UTM-Tipp:</strong> Hänge an deine Shop-URL <code className="text-brand">?utm_source=instagram</code> — du siehst dann im Dashboard, woher Besucher kommen.
          </div>
        </Block>

        <Block icon={<Truck className="h-6 w-6" />} title="2. Versand — du wählst pro Listing">
          <p className="text-muted-foreground">Bei jedem physischen Produkt entscheidest du:</p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Card icon={<Package className="h-5 w-5" />} title='"Versand inklusive"'>
              <p className="text-sm text-muted-foreground">Versandkosten sind im Listing-Preis drin. Käufer sieht einen Preis, du kümmerst dich um alles.</p>
              <p className="mt-2 text-xs font-semibold text-brand">Gut für: günstige, planbare Artikel.</p>
            </Card>
            <Card icon={<Truck className="h-5 w-5" />} title='"Versand extra"'>
              <p className="text-sm text-muted-foreground">Käufer sieht Produktpreis + Versandkosten getrennt. Du setzt die Versandpauschale.</p>
              <p className="mt-2 text-xs font-semibold text-brand">Gut für: schwere oder internationale Artikel.</p>
            </Card>
          </div>
          <div className="mt-5 space-y-2 text-sm text-muted-foreground">
            <p><strong className="text-brand-ink">Pflicht nach Verkauf:</strong> Trag innerhalb von 5 Werktagen die <em>Sendungsnummer und den Versanddienst</em> (DHL, Hermes, DPD, UPS, Post) im Dashboard ein. Ohne Tracking kein Schutz im Streitfall.</p>
            <p><strong className="text-brand-ink">Verpackung:</strong> Stabile Mailerbags für flache Sachen, doppelwandige Kartons für zerbrechliches. Polster mit Papier, kein Plastik.</p>
          </div>
        </Block>

        <Block icon={<Banknote className="h-6 w-6" />} title="3. Payouts — alle 2 Wochen automatisch">
          <p className="text-muted-foreground">
            Auszahlungen laufen alle 14 Tage automatisch auf dein bei Stripe hinterlegtes Konto. Erste Auszahlung kommt ca. 7–10 Tage nach deinem ersten Verkauf (Stripe-Verifizierung).
          </p>
          <div className="mt-5 rounded-2xl border border-border bg-card p-5">
            <h4 className="font-display text-lg font-black text-brand-ink">Gebühren-Beispiel</h4>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {[
                { type: "Digital", units: 5, price: 20 },
                { type: "Digital", units: 30, price: 20 },
                { type: "Physisch", units: 5, price: 25 },
                { type: "Physisch", units: 30, price: 25 },
              ].map((c, i) => {
                const isDigital = c.type === "Digital";
                const fee = feeForSale({ kind: isDigital ? "digital" : "physical", priceCents: c.price * 100, salesThisMonth: c.units });
                return (
                  <div key={i} className="rounded-xl border border-border bg-surface p-3 text-sm">
                    <div className="font-semibold text-brand-ink">{c.type}, Verkauf #{c.units + 1} @ {c.price}€</div>
                    <div className="mt-1 text-muted-foreground">Gebühr: <strong className="text-brand">{fee.feeRate.toFixed(1)}%</strong> = {(fee.feeCents / 100).toFixed(2)}€</div>
                    <div className="text-muted-foreground">Du bekommst: <strong className="text-brand-ink">{(fee.payoutCents / 100).toFixed(2)}€</strong></div>
                  </div>
                );
              })}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">Pro 25 Verkäufe im Monat sinkt deine Gebühr um 1% (bis min. 5%). Reset am 1. jedes Monats.</p>
          </div>
        </Block>

        <Block icon={<ShieldCheck className="h-6 w-6" />} title="4. Streitfälle & Schaden — wer haftet?">
          <p className="text-muted-foreground">
            Die Regel ist einfach: <strong className="text-brand-ink">Mit Tracking-Nummer haftet der Versanddienstleister</strong> (DHL, Hermes, DPD, UPS, Post). <strong className="text-brand-ink">Ohne Tracking-Nummer haftet der Verkäufer.</strong>
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border-2 border-emerald-300 bg-emerald-50 p-4 text-sm">
              <strong className="text-emerald-900">✅ Mit Tracking + Schaden</strong>
              <p className="mt-1 text-emerald-900/80">Käufer und Verkäufer wenden sich gemeinsam an den Carrier. CreaHQ moderiert. Versicherung des Carriers greift.</p>
            </div>
            <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-4 text-sm">
              <strong className="text-amber-900">⚠️ Tracking offen / verloren</strong>
              <p className="mt-1 text-amber-900/80">Käufer bekommt Rückerstattung. Verkäufer zieht Geld beim Carrier ein.</p>
            </div>
            <div className="rounded-2xl border-2 border-rose-300 bg-rose-50 p-4 text-sm">
              <strong className="text-rose-900">❌ Ohne Tracking + Problem</strong>
              <p className="mt-1 text-rose-900/80">Verkäufer haftet voll. Käufer bekommt volle Rückerstattung. Deshalb: <em>immer</em> Sendungsnummer eintragen.</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Reklamationsfrist: 14 Tage ab Zustellung (oder erwartetem Liefertermin bei verlorenen Paketen). Beweismittel: Fotos, Chatverlauf, Tracking-Status.
          </p>
        </Block>

        <Block icon={<MessageSquare className="h-6 w-6" />} title="5. Chat — direkt mit Käufern reden">
          <p className="text-muted-foreground">
            Käufer können dich über jeden Shop und jedes Listing anschreiben. Im Chat kannst du <strong className="text-brand-ink">private Preisangebote</strong> schicken — nur für diesen einen Käufer gültig, mit Ablaufdatum. Perfekt für Sonderpreise, Custom-Aufträge oder Stammkunden-Rabatte.
          </p>
        </Block>

        <div className="rounded-3xl border-2 border-brand bg-brand-soft p-8 text-center">
          <h3 className="font-display text-2xl font-black text-brand-ink">Fragen offen?</h3>
          <p className="mt-2 text-sm text-muted-foreground">Schreib uns über <a href="/kontakt" className="font-semibold text-brand hover:underline">Kontakt</a>. Wir antworten in 24h.</p>
        </div>
      </div>
    </PageShell>
  );
}

function Block({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand text-primary-foreground">{icon}</span>
        <h2 className="font-display text-2xl font-black text-brand-ink sm:text-3xl">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Card({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-2 flex items-center gap-2 text-brand">{icon}<strong className="text-brand-ink">{title}</strong></div>
      {children}
    </div>
  );
}
