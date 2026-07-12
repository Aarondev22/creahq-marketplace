import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Trash2, Minus, Plus, ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/cart";

export const Route = createFileRoute("/warenkorb")({
  head: () => ({ meta: [{ title: "Warenkorb — CreaHQ" }] }),
  component: CartPage,
});

function CartPage() {
  const { items, removeItem, setQty, totalCents } = useCart();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-20 text-center">
        <ShoppingBag className="mx-auto mb-4 h-12 w-12 text-brand/40" />
        <h1 className="font-display text-3xl font-black text-brand-ink">Dein Warenkorb ist leer.</h1>
        <p className="mt-2 text-sm text-muted-foreground">Stöbere durch die Listings und leg was rein.</p>
        <Link to="/browse" className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-bold text-primary-foreground brand-glow">
          Jetzt stöbern
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="font-display text-4xl font-black text-brand-ink">Dein Warenkorb</h1>

      <ul className="mt-8 space-y-3">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-brand-soft to-amber-100/40">
              {item.cover_url && <img src={item.cover_url} alt={item.title} className="h-full w-full object-cover" />}
            </div>
            <div className="min-w-0 flex-1">
              <Link to="/listing/$id" params={{ id: item.id }} className="truncate font-semibold text-brand-ink hover:text-brand">
                {item.title}
              </Link>
              <div className="mt-1 text-sm text-muted-foreground">{(item.price_cents / 100).toFixed(2)} € · Stück</div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button onClick={() => setQty(item.id, item.qty - 1)} className="grid h-8 w-8 place-items-center rounded-full border border-border">
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="w-6 text-center text-sm font-bold">{item.qty}</span>
              <button onClick={() => setQty(item.id, item.qty + 1)} className="grid h-8 w-8 place-items-center rounded-full border border-border">
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="w-20 shrink-0 text-right text-sm font-bold text-brand">
              {((item.price_cents * item.qty) / 100).toFixed(2)} €
            </div>
            <button onClick={() => removeItem(item.id)} className="shrink-0 rounded-full bg-red-50 p-2 text-red-600">
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-8 flex items-center justify-between rounded-2xl border border-border bg-card p-6">
        <div className="font-display text-xl font-bold text-brand-ink">Gesamt</div>
        <div className="font-display text-3xl font-black text-brand">{(totalCents / 100).toFixed(2)} €</div>
      </div>

      <button
        onClick={() => navigate({ to: "/browse" })}
        className="mt-4 w-full rounded-full bg-brand px-6 py-4 text-base font-bold text-primary-foreground brand-glow transition-transform hover:scale-[1.02]"
      >
        Zur Kasse (Stripe-Checkout folgt im nächsten Schritt)
      </button>
    </div>
  );
}
