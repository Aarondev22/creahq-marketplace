import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Loader2 } from "lucide-react";
import { fetchOrderStatus } from "@/lib/checkout.functions";
import { useCart } from "@/lib/cart";

export const Route = createFileRoute("/checkout/erfolg")({
  validateSearch: (search: Record<string, unknown>) => ({
    order: typeof search.order === "string" ? search.order : "",
  }),
  head: () => ({
    meta: [
      { title: "Danke für deine Bestellung — CreaHQ" },
      { name: "description", content: "Deine Zahlung war erfolgreich. Hier siehst du den Status deiner CreaHQ-Bestellung." },
      { property: "og:title", content: "Danke für deine Bestellung — CreaHQ" },
      { property: "og:description", content: "Zahlung erfolgreich abgeschlossen." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SuccessPage,
});

function SuccessPage() {
  const { order } = Route.useSearch();
  const { clear } = useCart();
  const navigate = useNavigate();

  useEffect(() => { clear(); }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["order-status", order],
    queryFn: () => fetchOrderStatus({ data: { orderId: order } }),
    enabled: Boolean(order),
    refetchInterval: (q) => (q.state.data?.status === "paid" ? false : 2500),
  });

  return (
    <div className="mx-auto max-w-lg px-6 py-24 text-center">
      <div className="mx-auto grid h-20 w-20 place-items-center rounded-[1.75rem] bg-emerald-100 text-emerald-600">
        <CheckCircle2 className="h-10 w-10" />
      </div>
      <h1 className="mt-6 font-display text-4xl font-black text-brand-ink">Danke! 🎉</h1>
      <p className="mt-2 text-muted-foreground">
        Deine Zahlung ist durch. Wir haben die Bestellung an den Shop weitergegeben.
      </p>

      <div className="mt-6 rounded-[1.75rem] border border-border bg-card p-5 text-left">
        {isLoading ? (
          <div className="h-5 w-40 animate-pulse rounded-full bg-brand-soft" />
        ) : data ? (
          <>
            <div className="font-mono text-xs text-muted-foreground">Bestellung #{data.id.slice(0, 8)}</div>
            <div className="mt-1 flex items-center justify-between">
              <span className="font-display text-2xl font-black text-brand">{(data.total_cents / 100).toFixed(2)} €</span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-3 py-1 text-xs font-bold text-brand">
                {data.status !== "paid" && <Loader2 className="h-3 w-3 animate-spin" />}
                {data.status === "paid" ? "Bezahlt" : "Zahlung wird bestätigt …"}
              </span>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Bestellung wird geladen …</p>
        )}
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <button
          onClick={() => navigate({ to: "/dashboard", search: { tab: "orders" } })}
          className="min-h-12 rounded-full bg-brand px-6 text-sm font-bold text-primary-foreground brand-glow"
        >
          Zu meinen Bestellungen
        </button>
        <Link to="/browse" search={{ q: "", kind: "", cat: "", min: "", max: "", sort: "new" }} className="min-h-12 rounded-full border border-border bg-card px-6 py-3.5 text-sm font-bold text-brand-ink hover:bg-brand-soft">
          Weiter stöbern
        </Link>
      </div>
    </div>
  );
}
