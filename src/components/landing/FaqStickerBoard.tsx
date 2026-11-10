import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "@tanstack/react-router";

const topics = [
  { id: "buyers", label: "Für Käufer", questions: [
    ["Was finde ich auf CreaHQ?", "Selbst gestaltete Produkte von Creatorn. CreaHQ startet mit digitalen Downloads; physische Artikel kommen hinzu, sobald sie freigeschaltet sind."],
    ["Wo finde ich meinen Download?", "Nach bestätigter Zahlung findest du die Download-Datei bei deiner Bestellung. Lies vor dem Kauf die Angaben zu Inhalt, Format und Nutzungslizenz."],
    ["Die Datei ist leer oder funktioniert nicht – was nun?", "Kontaktiere den Verkäufer über den Chat und beschreibe das Problem. Wenn ihr keine Lösung findet, kannst du zur Bestellung eine Reklamation melden. Eine Rückzahlung hängt vom konkreten Fall und den geltenden Rechten ab."],
    ["Wie funktioniert der Versand?", "Bei freigeschalteten physischen Angeboten stehen Versandkosten, Dienstleister und Bearbeitungszeit auf der Produktseite. Die Bearbeitungszeit ist nicht die Lieferzeit. Die Sendungsnummer ergänzt der Verkäufer erst nach dem Versand zur Bestellung."],
  ]},
  { id: "sellers", label: "Für Verkäufer", questions: [
    ["Was kostet mein Shop?", "Der Standard-Shop hat keine monatliche Grundgebühr. Die Startprovision für digitale Verkäufe beträgt 17 %, mindestens 0,70 € je Verkauf. Staffelungen und weitere Gebühren findest du in der Gebührenübersicht."],
    ["Muss ich meinen Shop programmieren?", "Nein. Dein Shop hat bereits eine Standarddarstellung. Optional kannst du ihn im Shop-Studio mit HTML und CSS gestalten. Suche und Produktseiten bleiben einheitlich."],
    ["Was bietet Pro für 4,99 € im Monat?", "Pro ergänzt den visuellen Baustein-Baukasten, die Code-Option, fünf Designvorlagen, zehn Animationen, bis zu fünf Badges und Pro Spotlight. Der bezahlte Abo-Abschluss ist noch nicht verfügbar."],
    ["Kann ich physische Produkte anbieten?", "Erst nach der Freigabe durch CreaHQ. Dann kannst du im Verkaufsformular Physisch auswählen und Versandkosten, Dienstleister sowie Bearbeitungszeit hinterlegen. Ein Download ist dafür nicht nötig."],
  ]},
  { id: "safety", label: "Sicherheit & Auszahlung", questions: [
    ["Sind alle Dateien und Bilder garantiert sicher?", "Nein. Technische Prüfungen und Meldungen können Risiken reduzieren, aber Schadsoftware oder Fälschungen nicht vollständig ausschließen. Öffne keine verdächtigen Dateien und melde auffällige Angebote."],
    ["Was bedeutet der Echtheitsnachweis?", "Verkäufer können ein Foto ihres Werks mit einem handgeschriebenen Zettel einreichen. Das Team prüft den Nachweis. Ein geprüftes Foto ist keine Garantie für Echtheit oder eine umfassende Produktprüfung."],
    ["Wofür ist die 10-Tage-Haltefrist gedacht?", "Vorgesehen ist, Verkaufserlöse vor der Auszahlung zehn Tage zurückzuhalten; bei offenen Reklamationen kann die Auszahlung pausieren. Die tatsächliche Zahlungsabwicklung muss vor dem Verkaufsstart eingerichtet werden. Das ist keine Garantie eines rechtlichen Treuhandkontos."],
    ["Entscheidet eine KI automatisch über Beschwerden?", "Eine vollständige automatische KI-Fallentscheidung ist derzeit nicht verfügbar. Kontaktiere zuerst den Verkäufer und reiche nachvollziehbare Belege ein. Gesetzliche Ansprüche werden durch eine technische Prüfung nicht ersetzt."],
  ]},
];

export function FaqStickerBoard() {
  return <section aria-labelledby="faq-heading" className="relative overflow-hidden border-y border-brand/20 bg-brand-soft/40 py-14 sm:py-20">
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <span className="inline-flex rounded-full bg-brand px-3 py-1 text-xs font-bold text-primary-foreground">CreaHQ · Gut zu wissen</span>
      <h2 id="faq-heading" className="mt-3 font-display text-3xl font-bold text-brand-ink sm:text-4xl">Fragen & Antworten</h2>
      <Tabs defaultValue="buyers" className="mt-8">
        <TabsList className="no-scrollbar h-auto w-full max-w-full touch-pan-x justify-start gap-1 overflow-x-auto rounded-full border border-brand/20 bg-card p-1 sm:w-auto">
          {topics.map(t => <TabsTrigger key={t.id} value={t.id} className="min-h-11 shrink-0 whitespace-nowrap rounded-full px-4 text-sm font-bold data-[state=active]:bg-brand data-[state=active]:text-primary-foreground">{t.label}</TabsTrigger>)}
        </TabsList>
        {topics.map(t => <TabsContent key={t.id} value={t.id} className="mt-6">
          <div className="grid gap-4 sm:grid-cols-2">{t.questions.map(([q, a]) => <article key={q} className="rounded-3xl border border-brand/20 bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-brand/50">
            <h3 className="font-display text-lg font-bold leading-snug text-brand-ink">{q}</h3>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">{a}</p>
          </article>)}</div>
        </TabsContent>)}
      </Tabs>
      <div className="mt-8 flex flex-wrap gap-6 text-sm"><Link to="/gebuehren" className="font-medium text-foreground underline underline-offset-4">Gebührenübersicht</Link><Link to="/kontakt" className="font-medium text-foreground underline underline-offset-4">Kontakt</Link></div>
    </div>
  </section>;
}
