import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { Hero } from "@/components/landing/Hero";
import { DiscoverRail } from "@/components/landing/DiscoverRail";
import { SellerInvite } from "@/components/landing/SellerInvite";
import { FaqStickerBoard } from "@/components/landing/FaqStickerBoard";
import { StarField } from "@/components/StarField";
import { fetchTopWeek, fetchFresh } from "@/lib/listings.functions";

const topQuery = queryOptions({ queryKey: ["top-week"], queryFn: () => fetchTopWeek() });
const freshQuery = queryOptions({ queryKey: ["fresh"], queryFn: () => fetchFresh() });

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CreaHQ — Mach deins. Find ihres." },
      { name: "description", content: "Marktplatz für digitale & physische Produkte, Services und Chatbots von echten Creatorn. Entdecken, kaufen, sofort starten." },
      { property: "og:title", content: "CreaHQ — Mach deins. Find ihres." },
      { property: "og:description", content: "Digitale & physische Produkte, Services und Chatbots — mit Mini-Games und Sticker-FAQ." },
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
    <div className="relative">
      {/* Stars are scattered across the whole homepage container (absolute inset-0).
          The floating toggle pill lives inside <StarField /> too. */}
      <StarField count={7} />
      <Hero />
      <div id="entdecken" className="scroll-mt-24">
        <DiscoverRail slug="top-10"         title="Top 10 gerade beliebt"         subtitle="Was die Community diese Woche feiert." emoji="🔥" emptyMessage="Hier wohnen die 10 beliebtesten Sachen. Aktuell ist es noch ganz still." items={top?.slice(0, 10)} />
        <DiscoverRail slug="perfekt-daheim" title="Perfekt für daheim"            subtitle="Prints, Sounds & Templates, die das Zuhause besser machen." emoji="🏡" emptyMessage="Noch hängt nichts an der Wand. Wir suchen Creator, die das ändern." />
        <DiscoverRail slug="frisch"         title="Frisch reingekommen"           subtitle="Die neuesten Drops aus den Werkstätten." emoji="✨" emptyMessage="Brandneu, sobald die ersten Creator drücken auf 'Veröffentlichen'." items={fresh} />
        <DiscoverRail slug="perlen"         title="Versteckte Perlen"             subtitle="Untern Radar, aber liebenswert." emoji="💎" emptyMessage="Perlen brauchen erst Austern." />
        <DiscoverRail slug="kuratiert"      title="Von der Community kuratiert"   subtitle="Handverlesen von Leuten wie dir." emoji="🎀" emptyMessage="Kurator:innen gesucht — die Vitrine ist noch leer." />
      </div>
      <SellerInvite />
      <FaqStickerBoard />
    </div>
  );
}
