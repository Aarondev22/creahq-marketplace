import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { Hero } from "@/components/landing/Hero";
import { DiscoverRail } from "@/components/landing/DiscoverRail";
import { SellerInvite } from "@/components/landing/SellerInvite";
import { FaqStickerBoard } from "@/components/landing/FaqStickerBoard";
import { fetchTopWeek, fetchFresh } from "@/lib/listings.functions";

const topQuery = queryOptions({ queryKey: ["top-week"], queryFn: () => fetchTopWeek() });
const freshQuery = queryOptions({ queryKey: ["fresh"], queryFn: () => fetchFresh() });

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CreaHQ — Mach deins. Find ihres." },
      { name: "description", content: "Verspielter Marktplatz für digitale Produkte und Services von Creatorn. Entdecken, kaufen, sofort starten." },
      { property: "og:title", content: "CreaHQ — Mach deins. Find ihres." },
      { property: "og:description", content: "Marktplatz für digitale Produkte und Services. Mit Mini-Games und einem Sticker-FAQ." },
    ],
  }),
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(topQuery),
      context.queryClient.ensureQueryData(freshQuery),
    ]);
  },
  component: Index,
  errorComponent: ({ error }) => <div className="p-10 text-center text-sm text-muted-foreground">{error.message}</div>,
  notFoundComponent: () => <div className="p-10 text-center text-sm">Nicht gefunden.</div>,
});

function Index() {
  const { data: top } = useSuspenseQuery(topQuery);
  const { data: fresh } = useSuspenseQuery(freshQuery);
  return (
    <>
      <Hero />
      <div id="entdecken" className="scroll-mt-24">
        <DiscoverRail title="Top 20 gerade beliebt" subtitle="Was die Community diese Woche feiert." emoji="🔥" emptyMessage="Hier wohnen bald die 20 beliebtesten Sachen. Aktuell ist es noch ganz still." items={top} />
        <DiscoverRail title="Perfekt für daheim" subtitle="Prints, Sounds & Templates, die das Zuhause besser machen." emoji="🏡" emptyMessage="Noch hängt nichts an der Wand. Wir suchen Creator, die das ändern." />
        <DiscoverRail title="Frisch reingekommen" subtitle="Die neuesten Drops aus den Werkstätten." emoji="✨" emptyMessage="Brandneu, sobald die ersten Creator drücken auf 'Veröffentlichen'." items={fresh} />
        <DiscoverRail title="Versteckte Perlen" subtitle="Untern Radar, aber liebenswert." emoji="💎" emptyMessage="Perlen brauchen erst Austern. Bald hier." />
        <DiscoverRail title="Von der Community kuratiert" subtitle="Handverlesen von Leuten wie dir." emoji="🎀" emptyMessage="Kurator:innen gesucht — die Vitrine ist noch leer." />
      </div>
      <SellerInvite />
      <FaqStickerBoard />
    </>
  );
}
