import { createFileRoute } from "@tanstack/react-router";
import { FaqStickerBoard } from "@/components/landing/FaqStickerBoard";
export const Route = createFileRoute("/hilfe")({
  head: () => ({ meta: [
    { title: "Hilfe & Fragen — CreaHQ" },
    { name: "description", content: "Antworten zu Kauf, Verkauf, Shops und Sicherheit bei CreaHQ." },
    { property: "og:title", content: "Hilfe & Fragen — CreaHQ" },
    { property: "og:description", content: "Wichtige Informationen für Käufer und Verkäufer." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }), component: FaqStickerBoard,
});
