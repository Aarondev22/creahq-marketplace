import { createFileRoute } from "@tanstack/react-router";
import { SettingsContent } from "@/components/SettingsContent";
import { SettingsDrawer } from "@/components/SettingsDrawer";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { useState } from "react";
export const Route = createFileRoute("/_authenticated/einstellungen")({
  validateSearch: (s: Record<string, unknown>): { section: "profile" | "shop" | "studio" } => ({ section: s.section === "shop" || s.section === "studio" ? s.section : "profile" }),
  head: () => ({ meta: [
    { title: "Einstellungen & Shop-Studio — CreaHQ" }, { name: "description", content: "Verwalte deinen Shop, dein Profil und deine Kontoeinstellungen auf CreaHQ." },
    { property: "og:title", content: "Einstellungen & Shop-Studio — CreaHQ" }, { property: "og:description", content: "Shop, Profil und Kontoeinstellungen verwalten." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }), component: SettingsPage,
});
function SettingsPage() {
  const { section } = Route.useSearch(); const [open, setOpen] = useState(section === "profile");
  return <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
    <div className="mb-8 flex flex-wrap items-center justify-between gap-4"><h1 className="text-3xl font-semibold">{section === "studio" ? "Shop-Studio" : section === "shop" ? "Dein Shop" : "Profil & Name"}</h1><Button variant="outline" onClick={() => setOpen(true)}><Settings /> Einstellungen</Button></div>
    <SettingsContent section={section} /><SettingsDrawer open={open} onOpenChange={setOpen} />
  </div>;
}
