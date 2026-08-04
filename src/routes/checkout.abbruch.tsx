import { createFileRoute, Link } from "@tanstack/react-router";
import { XCircle } from "lucide-react";

export const Route = createFileRoute("/checkout/abbruch")({
  validateSearch: (search: Record<string, unknown>) => ({
    order: typeof search.order === "string" ? search.order : "",
  }),
  head: () => ({
    meta: [
      { title: "Zahlung abgebrochen — CreaHQ" },
      { name: "description", content: "Die Zahlung wurde abgebrochen. Dein Warenkorb bleibt gespeichert — du kannst jederzeit weitermachen." },
      { property: "og:title", content: "Zahlung abgebrochen — CreaHQ" },
      { property: "og:description", content: "Kein Problem — dein Warenkorb ist noch da." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CancelPage,
});

function CancelPage() {
  return (
    <div className="mx-auto max-w-lg px-6 py-24 text-center">
      <div className="mx-auto grid h-20 w-20 place-items-center rounded-[1.75rem] bg-amber-100 text-amber-600">
        <XCircle className="h-10 w-10" />
      </div>
      <h1 className="mt-6 font-display text-4xl font-black text-brand-ink">Abgebrochen — alles gut.</h1>
      <p className="mt-2 text-muted-foreground">
        Es wurde nichts abgebucht. Dein Warenkorb liegt noch genau so da, wie du ihn verlassen hast.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link to="/warenkorb" className="min-h-12 rounded-full bg-brand px-6 py-3.5 text-sm font-bold text-primary-foreground brand-glow">
          Zurück zum Warenkorb
        </Link>
        <Link to="/browse" search={{ q: "", kind: "", cat: "", min: "", max: "", sort: "new" }} className="min-h-12 rounded-full border border-border bg-card px-6 py-3.5 text-sm font-bold text-brand-ink hover:bg-brand-soft">
          Weiter stöbern
        </Link>
      </div>
    </div>
  );
}
