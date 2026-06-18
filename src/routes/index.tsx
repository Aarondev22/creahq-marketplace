import { createFileRoute } from "@tanstack/react-router";
import { Hero } from "@/components/landing/Hero";
import { DiscoverRail } from "@/components/landing/DiscoverRail";
import { SellerInvite } from "@/components/landing/SellerInvite";
import { FaqStickerBoard } from "@/components/landing/FaqStickerBoard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CreaHQ — Mach deins. Find ihres." },
      { name: "description", content: "Verspielter Marktplatz für digitale Produkte und Services von Creatorn. Entdecken, kaufen, sofort starten." },
      { property: "og:title", content: "CreaHQ — Mach deins. Find ihres." },
      { property: "og:description", content: "Marktplatz für digitale Produkte und Services. Mit Mini-Games und einem Sticker-FAQ." },
    ],
  }),
  component: Index,
});

const rails = [
  { title: "Top 20 gerade beliebt", subtitle: "Was die Community diese Woche feiert.", emoji: "🔥", emptyMessage: "Hier wohnen bald die 20 beliebtesten Sachen. Aktuell ist es noch ganz still." },
  { title: "Perfekt für daheim", subtitle: "Prints, Sounds & Templates, die das Zuhause besser machen.", emoji: "🏡", emptyMessage: "Noch hängt nichts an der Wand. Wir suchen Creator, die das ändern." },
  { title: "Frisch reingekommen", subtitle: "Die neuesten Drops aus den Werkstätten.", emoji: "✨", emptyMessage: "Brandneu, sobald die ersten Creator drücken auf 'Veröffentlichen'." },
  { title: "Versteckte Perlen", subtitle: "Untern Radar, aber liebenswert.", emoji: "💎", emptyMessage: "Perlen brauchen erst Austern. Bald hier." },
  { title: "Von der Community kuratiert", subtitle: "Handverlesen von Leuten wie dir.", emoji: "🎀", emptyMessage: "Kurator:innen gesucht — die Vitrine ist noch leer." },
];

function Index() {
  return (
    <>
      <Hero />
      <div id="entdecken" className="scroll-mt-24">
        {rails.map((r) => (
          <DiscoverRail key={r.title} {...r} />
        ))}
      </div>
      <SellerInvite />
      <FaqStickerBoard />
    </>
  );
}
