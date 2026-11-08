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
  return <section aria-labelledby="faq-heading" className="border-y border-border bg-card py-14 sm:py-20">
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <p className="text-sm font-medium text-muted-foreground">CreaHQ · Gut zu wissen</p>
      <h2 id="faq-heading" className="mt-3 text-3xl font-semibold text-foreground sm:text-4xl">Fragen & Antworten</h2>
      <Tabs defaultValue="buyers" className="mt-8">
        <TabsList className="h-auto w-full flex-wrap justify-start gap-1 rounded-lg bg-muted p-1 sm:w-auto">
          {topics.map(t => <TabsTrigger key={t.id} value={t.id} className="min-h-11 whitespace-normal rounded-md px-4 text-sm">{t.label}</TabsTrigger>)}
        </TabsList>
        {topics.map(t => <TabsContent key={t.id} value={t.id} className="mt-6">
          <div className="grid gap-x-12 sm:grid-cols-2">{t.questions.map(([q, a]) => <article key={q} className="border-b border-border py-6">
            <h3 className="text-lg font-semibold leading-relaxed text-foreground">{q}</h3>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">{a}</p>
          </article>)}</div>
        </TabsContent>)}
      </Tabs>
      <div className="mt-8 flex flex-wrap gap-6 text-sm"><Link to="/gebuehren" className="font-medium text-foreground underline underline-offset-4">Gebührenübersicht</Link><Link to="/kontakt" className="font-medium text-foreground underline underline-offset-4">Kontakt</Link></div>
    </div>
  </section>;
}
