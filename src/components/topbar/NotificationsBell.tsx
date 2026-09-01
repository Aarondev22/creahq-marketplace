import { useState } from "react";
import { Bell, MessageCircle, ShoppingBag, Package, Truck } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useNotifications } from "@/hooks/useNotifications";

const ICONS: Record<string, React.ReactNode> = {
  message: <MessageCircle className="h-4 w-4" />,
  order: <ShoppingBag className="h-4 w-4" />,
  sale: <Package className="h-4 w-4" />,
  shipment: <Truck className="h-4 w-4" />,
};

const FILTERS = [
  { key: "all", label: "Alle" },
  { key: "message", label: "Nachrichten" },
  { key: "order", label: "Bestellung" },
  { key: "sale", label: "Verkauf" },
  { key: "shipment", label: "Versand" },
] as const;

function timeShort(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const { items, unread, loading, markRead, markAllRead, signedIn } = useNotifications();
  const navigate = useNavigate();

  if (!signedIn) return null;

  const shown = filter === "all" ? items : items.filter((n) => n.category === filter);

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Benachrichtigungen"
        onClick={() => setOpen((v) => !v)}
        className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full border border-border bg-card text-brand-ink transition-colors hover:bg-brand-soft"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1 text-[10px] font-black text-primary-foreground">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Schließen"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 cursor-default"
          />
          <div className="absolute right-0 z-50 mt-2 w-[min(92vw,22rem)] overflow-hidden rounded-3xl border border-border bg-card shadow-2xl">
            <div className="flex items-center justify-between gap-2 border-b border-border bg-brand-soft/40 px-4 py-3">
              <span className="font-display text-lg font-black text-brand-ink">Benachrichtigungen</span>
              <button
                type="button"
                onClick={markAllRead}
                className="rounded-full px-2 py-1 text-xs font-bold text-brand hover:underline"
              >
                Alle gelesen
              </button>
            </div>

            <div className="flex gap-1.5 overflow-x-auto border-b border-border px-3 py-2">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFilter(f.key)}
                  className={`min-h-9 shrink-0 rounded-full px-3 text-xs font-bold transition ${
                    filter === f.key
                      ? "bg-brand text-primary-foreground"
                      : "border border-border text-muted-foreground hover:text-brand-ink"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <ul className="max-h-[60vh] divide-y divide-border overflow-y-auto">
              {loading ? (
                <li className="space-y-2 p-4">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="h-12 animate-pulse rounded-2xl bg-brand-soft/50" />
                  ))}
                </li>
              ) : shown.length === 0 ? (
                <li className="px-4 py-10 text-center text-sm text-muted-foreground">
                  Hier ist noch nichts los. ✨
                </li>
              ) : (
                shown.map((n) => (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => {
                        void markRead(n.id);
                        setOpen(false);
                        if (n.link) navigate({ to: n.link as never });
                      }}
                      className={`flex w-full min-h-14 items-start gap-3 px-4 py-3 text-left transition hover:bg-brand-soft/50 ${
                        n.read_at ? "" : "bg-brand-soft/25"
                      }`}
                    >
                      <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-soft text-brand">
                        {ICONS[n.category] ?? <Bell className="h-4 w-4" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold text-brand-ink">{n.title}</span>
                        {n.body && <span className="block truncate text-xs text-muted-foreground">{n.body}</span>}
                        <span className="mt-0.5 block text-[10px] text-muted-foreground">{timeShort(n.created_at)}</span>
                      </span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
