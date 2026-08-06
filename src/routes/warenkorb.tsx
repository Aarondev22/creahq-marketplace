import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Trash2, Minus, Plus, ShoppingBag, CreditCard, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/hooks/useAuth";
import { createCheckoutSession } from "@/lib/checkout.functions";

export const Route = createFileRoute("/warenkorb")({
  head: () => ({
    meta: [
      { title: "Warenkorb — CreaHQ" },
      { name: "description", content: "Dein CreaHQ-Warenkorb: Produkte prüfen, Menge anpassen und sicher über Stripe bezahlen." },
      { property: "og:title", content: "Warenkorb — CreaHQ" },
      { property: "og:description", content: "Produkte prüfen und sicher bezahlen." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { items, removeItem, setQty, totalCents } = useCart();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  async function checkout() {
    if (!user) {
      toast.error("Bitte melde dich zuerst an.");
      navigate({ to: "/auth", search: { mode: "signin" as const } });
      return;
    }
    setBusy(true);
    try {
      const res = await createCheckoutSession({
        data: {
          items: items.map((i) => ({ listing_id: i.id, qty: i.qty })),
          origin: window.location.origin,
        },
      });
      if ("url" in res) {
        window.location.href = res.url;
      } else {
        toast.error(res.error);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Checkout fehlgeschlagen.");
    } finally {
      setBusy(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-[1.75rem] bg-brand-soft text-brand">
          <ShoppingBag className="h-9 w-9" />
        </div>
        <h1 className="mt-6 font-display text-3xl font-black text-brand-ink">Dein Warenkorb ist leer. 🛒</h1>
        <p className="mt-2 text-sm text-muted-foreground">Stöbere durch die Listings und leg was rein.</p>
        <Link
          to="/browse"
          search={{ q: "", kind: "", cat: "", min: "", max: "", sort: "new" }}
          className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-full bg-brand px-6 text-sm font-bold text-primary-foreground brand-glow transition-transform hover:scale-105"
        >
          Jetzt stöbern
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-4xl font-black text-brand-ink">Dein Warenkorb 🛍️</h1>

      <ul className="mt-8 space-y-3">
        {items.map((item) => (
          <li key={item.id} className="flex flex-wrap items-center gap-4 rounded-[1.75rem] border border-border bg-card p-4 transition-colors hover:border-brand/40">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-brand-soft to-amber-100/40">
              {item.cover_url && <img src={item.cover_url} alt={item.title} className="h-full w-full object-cover" />}
            </div>
            <div className="min-w-0 flex-1">
              <Link to="/listing/$id" params={{ id: item.id }} className="truncate font-semibold text-brand-ink hover:text-brand">
                {item.title}
              </Link>
              <div className="mt-1 text-sm text-muted-foreground">{(item.price_cents / 100).toFixed(2)} € · Stück</div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button aria-label="Weniger" onClick={() => setQty(item.id, item.qty - 1)} className="grid h-11 w-11 place-items-center rounded-full border border-border hover:bg-brand-soft">
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-6 text-center text-sm font-black">{item.qty}</span>
              <button aria-label="Mehr" onClick={() => setQty(item.id, item.qty + 1)} className="grid h-11 w-11 place-items-center rounded-full border border-border hover:bg-brand-soft">
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <div className="w-20 shrink-0 text-right text-sm font-black text-brand">
              {((item.price_cents * item.qty) / 100).toFixed(2)} €
            </div>
            <button aria-label="Entfernen" onClick={() => removeItem(item.id)} className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-red-50 text-red-600 hover:bg-red-100">
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-8 flex items-center justify-between rounded-[1.75rem] border border-border bg-gradient-to-br from-brand-soft/50 to-card p-6">
        <div className="font-display text-xl font-bold text-brand-ink">Gesamt</div>
        <div className="font-display text-3xl font-black text-brand">{(totalCents / 100).toFixed(2)} €</div>
      </div>

      <button
        onClick={checkout}
        disabled={busy || authLoading}
        className="mt-4 inline-flex w-full min-h-14 items-center justify-center gap-2 rounded-full bg-brand px-6 text-base font-bold text-primary-foreground brand-glow transition-transform hover:scale-[1.02] disabled:opacity-60"
      >
        {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <CreditCard className="h-5 w-5" />}
        {busy ? "Checkout wird geöffnet …" : "Sicher bezahlen"}
      </button>
      <p className="mt-2 text-center text-xs text-muted-foreground">Zahlung läuft verschlüsselt über Stripe.</p>
    </div>
  );
}
