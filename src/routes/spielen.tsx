import { LanguageSettings } from "@/components/LanguageSettings";
import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";
import { FlagLangDoodle } from "@/components/FlagLangDoodle";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const LS_LANG = "creahq:lang";
const LANGS = [
  { code: "de", label: "Deutsch" },
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
  { code: "es", label: "Español" },
  { code: "it", label: "Italiano" },
  { code: "nl", label: "Nederlands" },
  { code: "pl", label: "Polski" },
  { code: "tr", label: "Türkçe" },
];

export const Route = createFileRoute("/spielen")({
  head: () => ({
    meta: [
      { title: "Sprache wählen — CreaHQ" },
      { name: "description", content: "Wähle deine Sprache auf CreaHQ aus einer Liste oder male eine Flagge." },
      { property: "og:title", content: "Sprache wählen — CreaHQ" },
      { property: "og:description", content: "Sprache per Liste oder per Flagge malen einstellen." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SprachePage,
});

function SprachePage() {
  return <PageShell eyebrow="Sprache" title="Sprache wählen"><LanguageSettings /></PageShell>;
}
