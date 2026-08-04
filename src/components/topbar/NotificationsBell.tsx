import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Bell, CheckCheck, MessageCircle, Package, ShoppingBag, Truck } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useNotifications, type AppNotification } from "@/hooks/useNotifications";

const ICONS: Record<string, React.ReactNode> = {
  chat: <MessageCircle className="h-4 w-4" />,
  order: <ShoppingBag className="h-4 w-4" />,
  sale: <Package className="h-4 w-4" />,
  shipment: <Truck className="h-4 w-4" />,
};

const FILTERS = [
  ["all", "Alle"],
  ["chat", "Nachrichten"],
  ["order", "Bestellung"],
  ["sale", "Verkauf"],
  ["shipment", "Versand"],
] as const;

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "gerade eben";
  if (m < 60) return `vor ${m} Min.`;
  const h = Math.floor(m / 60);
  if (h < 24) return `vor ${h} Std.`;
  return `vor ${Math.floor(h / 24)} T.`;
}

export function NotificationsBell() {
  const { items, unread, loading, markRead, markAllRead, signedIn } = useNotifications();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<"all" | "chat" | "order" | "sale" | "shipment">("all");

  const filtered =
    filter === "all" ? items : items.filter((n) => n.category === filter);

  function open(n: AppNotification) {
    if (!n.read_at) markRead(n.id);
    if (!n.link) return;

    if (n.link.startsWith("/nachrichten")) {
      try {
        const url = new URL(n.link, window.location.origin);
        const conv = url.searchParams.get("c") ?? undefined;
        navigate({ to: "/nachrichten", search: { c: conv } });
      } catch {
        navigate({ to: n.link });
      }
      return;
    }
    navigate({ to: n.link });
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          aria-label="Benachrichtigungen"
          className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full border border-border bg-card text-brand-ink transition-all hover:scale-105 hover:bg-brand-soft"
        >
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1 text-[10px] font-black text-primary-foreground shadow">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[22rem] overflow-hidden rounded-3xl p-0">
        <div className="flex items-center justify-between gap-2 border-b border-border bg-brand-soft/40 px-4 py-3">
          <div>
            <div className="font-display text-lg font-black text-brand-ink">Benachrichtigungen</div>
            <div className="text-xs text-muted-foreground">
              {unread > 0 ? `${unread} ungelesen` : "Alles gelesen 🎉"}
            </div>
          </div>
          {unread > 0 && (
            <button
              type="button"
              onClick={markAllRead}
              className="inline-flex min-h-9 shrink-0 items-center gap-1 rounded-full bg-card px-3 text-[11px] font-bold text-brand-ink hover:bg-brand hover:text-primary-foreground"
            >
              <CheckCheck className="h-3.5 w-3.5" /> Alle
            </button>
          )}
        </div>

        {signedIn && (
          <div className="flex flex-wrap gap-1.5 border-b border-border px-3 py-2">
            {FILTERS.map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                  filter === key
                    ? "bg-brand text-primary-foreground"
                    : "bg-surface text-brand-ink hover:bg-brand-soft"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {!signedIn ? (
          <div className="px-4 py-10 text-center text-sm text-muted-foreground">
            Melde dich an, um Benachrichtigungen zu sehen.
          </div>
        ) : loading ? (
          <div className="space-y-2 p-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-2xl bg-brand-soft/50" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-brand-soft text-brand">
              <Bell className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold text-brand-ink">Noch nichts los.</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Nachrichten, Bestellungen und Versand landen hier.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-muted-foreground">
            Nichts in dieser Kategorie.
          </div>
        ) : (
          <ul className="max-h-96 divide-y divide-border overflow-y-auto">
            {filtered.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => open(n)}
                  className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-brand-soft/50 ${
                    n.read_at ? "" : "bg-brand-soft/25"
                  }`}
                >
                  <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-soft text-brand">
                    {ICONS[n.category] ?? <Bell className="h-4 w-4" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-sm font-bold text-brand-ink">{n.title}</span>
                      {!n.read_at && <span className="h-2 w-2 shrink-0 rounded-full bg-brand" />}
                    </span>
                    {n.body && (
                      <span className="mt-0.5 line-clamp-2 block text-xs text-muted-foreground">
                        {n.body}
                      </span>
                    )}
                    <span className="mt-1 block text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      {timeAgo(n.created_at)}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}