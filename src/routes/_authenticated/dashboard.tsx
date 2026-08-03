import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Plus, Trash2, Eye, Store, ShoppingBag, TrendingUp, Package, Wallet, Truck, Heart, Pause, Play } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { fetchMySales, addShipment, type MySale } from "@/lib/shipments.functions";

const TABS = ["overview", "listings", "favorites", "orders", "sales"] as const;

export const Route = createFileRoute("/_authenticated/dashboard")({
  validateSearch: (search: Record<string, unknown>) => ({
    tab: (TABS as readonly string[]).includes(String(search.tab)) ? (String(search.tab) as Tab) : ("overview" as Tab),
  }),
  head: () => ({
    meta: [
      { title: "Dashboard — CreaHQ" },
      { name: "description", content: "Verwalte deine Listings, Verkäufe und Favoriten auf CreaHQ." },
      { property: "og:title", content: "Dashboard — CreaHQ" },
      { property: "og:description", content: "Verwalte deine Listings, Verkäufe und Favoriten auf CreaHQ." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Dashboard,
});


type MyListing = { id: string; title: string; price_cents: number; status: string; cover_url: string | null; created_at: string };
type MyOrder = { id: string; total_cents: number; status: string; created_at: string };
type FavRow = { id: string; listing: { id: string; title: string; price_cents: number; cover_url: string | null } | null };
type Tab = "overview" | "listings" | "favorites" | "orders" | "sales";

const ROLE_LABELS: Record<string, string> = { buyer: "Käufer", seller: "Verkäufer", admin: "Admin", founder: "Founder" };

function Dashboard() {
  const { roles } = useAuth();
  const [listings, setListings] = useState<MyListing[]>([]);
  const [orders, setOrders] = useState<MyOrder[]>([]);
  const [favorites, setFavorites] = useState<FavRow[]>([]);
  const [sales, setSales] = useState<MySale[]>([]);
  const [revenueCents, setRevenueCents] = useState(0);
  const [salesCount, setSalesCount] = useState(0);
  const [chartData, setChartData] = useState<{ date: string; revenue: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const { tab } = Route.useSearch();
  const navigate = useNavigate();
  const setTab = (t: Tab) => navigate({ to: "/dashboard", search: { tab: t }, resetScroll: false });


  async function load() {
    setLoading(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;

    const [{ data: l }, { data: o }, { data: items }, { data: favs }, mySales] = await Promise.all([
      supabase.from("listings").select("id,title,price_cents,status,cover_url,created_at").eq("seller_id", u.user.id).order("created_at", { ascending: false }),
      supabase.from("orders").select("id,total_cents,status,created_at").eq("buyer_id", u.user.id).order("created_at", { ascending: false }).limit(10),
      supabase.from("order_items").select("unit_price_cents,qty,created_at").eq("seller_id", u.user.id),
      supabase.from("favorites").select("id, listing:listings(id,title,price_cents,cover_url)").eq("user_id", u.user.id).not("listing_id", "is", null).order("created_at", { ascending: false }),
      fetchMySales().catch(() => []),
    ]);

    setListings((l ?? []) as MyListing[]);
    setOrders((o ?? []) as MyOrder[]);
    setFavorites((favs ?? []) as unknown as FavRow[]);
    setSales(mySales);
    const rev = (items ?? []).reduce((sum, it) => sum + it.unit_price_cents * it.qty, 0);
    setRevenueCents(rev);
    setSalesCount((items ?? []).reduce((sum, it) => sum + it.qty, 0));

    const days: { date: string; revenue: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const dayRevenue = (items ?? [])
        .filter((it: any) => it.created_at?.slice(0, 10) === key)
        .reduce((sum: number, it: any) => sum + it.unit_price_cents * it.qty, 0);
      days.push({ date: key.slice(5), revenue: dayRevenue / 100 });
    }
    setChartData(days);

    setLoading(false);
  }

  useEffect(() => { load(); }, []);
  useEffect(() => { window.scrollTo(0, 0); }, []);

  async function deleteListing(id: string) {
    if (!confirm("Wirklich löschen?")) return;
    const { error } = await supabase.from("listings").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Gelöscht.");
    setListings((l) => l.filter((x) => x.id !== id));
  }

  async function toggleListingStatus(id: string, status: string) {
    const next = status === "published" ? "draft" : "published";
    const { error } = await supabase.from("listings").update({ status: next }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(next === "published" ? "Listing ist wieder aktiv." : "Listing pausiert.");
    setListings((l) => l.map((x) => (x.id === id ? { ...x, status: next } : x)));
  }


  async function removeFavorite(favId: string) {
    const { error } = await supabase.from("favorites").delete().eq("id", favId);
    if (error) return toast.error(error.message);
    setFavorites((f) => f.filter((x) => x.id !== favId));
    toast.success("Aus Favoriten entfernt.");
  }


  const publishedCount = listings.filter((l) => l.status === "published").length;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-brand-soft px-3 py-1 text-xs font-bold uppercase tracking-widest text-brand">
              <Store className="h-3.5 w-3.5" /> Dein Headquarter
            </div>
            {roles.map((r) => (
              <span key={r} className="rounded-full border border-border bg-card px-2.5 py-0.5 text-[11px] font-bold text-brand-ink">
                {ROLE_LABELS[r] ?? r}
              </span>
            ))}
          </div>
          <h1 className="font-display text-4xl font-black text-brand-ink sm:text-5xl">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">Verwalte deine Listings und siehe deine Käufe.</p>
        </div>
        <Link
          to="/verkaufen/neu"
          className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-3 text-sm font-bold text-primary-foreground brand-glow transition-transform hover:scale-105"
        >
          <Plus className="h-4 w-4" /> Neues Listing
        </Link>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <StatCard icon={<Wallet className="h-5 w-5" />} label="Umsatz gesamt" value={`${(revenueCents / 100).toFixed(2)} €`} />
        <StatCard icon={<TrendingUp className="h-5 w-5" />} label="Verkäufe" value={String(salesCount)} />
        <StatCard icon={<Package className="h-5 w-5" />} label="Aktive Listings" value={`${publishedCount} / ${listings.length}`} />
      </div>


      <div className="mt-10 flex flex-wrap gap-1 rounded-full border border-border bg-card p-1 w-fit">
        <TabBtn label="Übersicht" active={tab === "overview"} onClick={() => setTab("overview")} />
        <TabBtn label="Meine Listings" active={tab === "listings"} onClick={() => setTab("listings")} />
        <TabBtn label={`Favoriten (${favorites.length})`} active={tab === "favorites"} onClick={() => setTab("favorites")} />
        <TabBtn label="Meine Bestellungen" active={tab === "orders"} onClick={() => setTab("orders")} />
        <TabBtn label="Meine Verkäufe" active={tab === "sales"} onClick={() => setTab("sales")} />
      </div>


      {tab === "overview" && (
        <>
          <div className="mt-8 rounded-[2rem] border border-border bg-card p-6">
            <h2 className="mb-3 font-display text-xl font-black text-brand-ink">Umsatz — letzte 14 Tage</h2>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData}>
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => `${v.toFixed(2)} €`} />
                <Line type="monotone" dataKey="revenue" stroke="var(--brand)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <section className="mt-8 grid gap-6 lg:grid-cols-2">
            <div className="rounded-[2rem] border border-border bg-card p-6">
              <h2 className="mb-3 font-display text-xl font-black text-brand-ink">Neueste Listings</h2>
              {loading ? <div className="text-sm text-muted-foreground">Lade …</div> : listings.length === 0 ? <EmptyListings /> : (
                <ul className="space-y-2">
                  {listings.slice(0, 4).map((l) => (
                    <li key={l.id} className="flex items-center justify-between rounded-xl bg-surface px-3 py-2 text-sm">
                      <span className="truncate font-medium text-brand-ink">{l.title}</span>
                      <span className="shrink-0 text-xs font-bold text-brand">{(l.price_cents / 100).toFixed(2)} €</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="rounded-[2rem] border border-border bg-card p-6">
              <h2 className="mb-3 font-display text-xl font-black text-brand-ink">Letzte Bestellungen</h2>
              {orders.length === 0 ? <p className="text-sm text-muted-foreground">Noch keine Bestellungen.</p> : (
                <ul className="space-y-2">
                  {orders.slice(0, 4).map((o) => (
                    <li key={o.id} className="flex items-center justify-between rounded-xl bg-surface px-3 py-2 text-sm">
                      <span className="font-mono text-xs text-muted-foreground">#{o.id.slice(0, 8)}</span>
                      <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-bold text-brand">{o.status}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </>
      )}

      {tab === "listings" && (
        <section className="mt-8">
          {loading ? <div className="text-sm text-muted-foreground">Lade …</div> : listings.length === 0 ? <EmptyListings /> : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {listings.map((l) => (
                <motion.div key={l.id} whileHover={{ y: -3 }} className="overflow-hidden rounded-3xl border border-border bg-card">
                  <div className="aspect-[4/3] bg-gradient-to-br from-brand-soft to-amber-100/40">
                    {l.cover_url && <img src={l.cover_url} alt={l.title} className="h-full w-full object-cover" />}
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="line-clamp-2 font-display text-base font-bold text-brand-ink">{l.title}</h3>
                      <span className="shrink-0 rounded-full bg-brand/10 px-2 py-0.5 text-xs font-bold text-brand">{(l.price_cents / 100).toFixed(2)} €</span>
                    </div>
                    <p className="mt-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      {l.status === "published" ? "Aktiv" : l.status === "draft" ? "Pausiert" : l.status}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Link to="/listing/$id" params={{ id: l.id }} className="inline-flex min-h-11 items-center gap-1 rounded-full bg-brand-soft px-4 py-2 text-xs font-semibold text-brand-ink hover:bg-brand hover:text-primary-foreground">
                        <Eye className="h-4 w-4" /> Ansehen
                      </Link>
                      <button onClick={() => toggleListingStatus(l.id, l.status)} className="inline-flex min-h-11 items-center gap-1 rounded-full border border-border px-4 py-2 text-xs font-semibold text-brand-ink hover:border-brand hover:text-brand">
                        {l.status === "published" ? <><Pause className="h-4 w-4" /> Pausieren</> : <><Play className="h-4 w-4" /> Aktivieren</>}
                      </button>
                      <button onClick={() => deleteListing(l.id)} className="inline-flex min-h-11 items-center gap-1 rounded-full bg-red-50 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-100">
                        <Trash2 className="h-4 w-4" /> Löschen
                      </button>
                    </div>

                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>
      )}

      {tab === "favorites" && (
        <section className="mt-8">
          <h2 className="mb-4 inline-flex items-center gap-2 font-display text-2xl font-black text-brand-ink">
            <Heart className="h-5 w-5" /> Deine Favoriten
          </h2>
          {favorites.filter((f) => f.listing).length === 0 ? (
            <div className="rounded-[2rem] border-2 border-dashed border-brand/30 bg-card/40 p-10 text-center">
              <div className="text-5xl">💜</div>
              <p className="mt-3 font-display text-lg font-bold text-brand-ink">Noch nichts favorisiert.</p>
              <p className="mt-1 text-sm text-muted-foreground">Klick auf das Herz bei einem Produkt, dann landet es hier.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {favorites.filter((f) => f.listing).map((f) => (
                <motion.div key={f.id} whileHover={{ y: -3 }} className="overflow-hidden rounded-3xl border border-border bg-card">
                  <div className="aspect-[4/3] bg-gradient-to-br from-brand-soft to-amber-100/40">
                    {f.listing!.cover_url && <img src={f.listing!.cover_url} alt={f.listing!.title} className="h-full w-full object-cover" />}
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="line-clamp-2 font-display text-base font-bold text-brand-ink">{f.listing!.title}</h3>
                      <span className="shrink-0 rounded-full bg-brand/10 px-2 py-0.5 text-xs font-bold text-brand">{(f.listing!.price_cents / 100).toFixed(2)} €</span>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Link to="/listing/$id" params={{ id: f.listing!.id }} className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-3 py-1.5 text-xs font-semibold text-brand-ink hover:bg-brand hover:text-primary-foreground">
                        <Eye className="h-3 w-3" /> Ansehen
                      </Link>
                      <button onClick={() => removeFavorite(f.id)} className="inline-flex items-center gap-1 rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100">
                        <Trash2 className="h-3 w-3" /> Entfernen
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>
      )}

      {tab === "orders" && (
        <section className="mt-8">
          <h2 className="mb-4 inline-flex items-center gap-2 font-display text-2xl font-black text-brand-ink">
            <ShoppingBag className="h-5 w-5" /> Deine Bestellungen
          </h2>
          {orders.length === 0 ? <p className="text-sm text-muted-foreground">Noch keine Bestellungen.</p> : (
            <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
              {orders.map((o) => (
                <li key={o.id} className="flex items-center justify-between p-4 text-sm">
                  <span className="font-mono text-xs text-muted-foreground">#{o.id.slice(0, 8)}</span>
                  <span className="font-semibold">{(o.total_cents / 100).toFixed(2)} €</span>
                  <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-bold text-brand">{o.status}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {tab === "sales" && <SalesTab sales={sales} onUpdated={load} />}
    </div>
  );
}

function SalesTab({ sales, onUpdated }: { sales: MySale[]; onUpdated: () => void }) {
  const [openFor, setOpenFor] = useState<string | null>(null);
  const [carrier, setCarrier] = useState("DHL");
  const [tracking, setTracking] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(orderId: string) {
    setSaving(true);
    try {
      await addShipment(orderId, carrier, tracking);
      toast.success("Versandnummer gespeichert");
      setOpenFor(null); setTracking("");
      onUpdated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Fehler");
    } finally { setSaving(false); }
  }

  if (sales.length === 0) return <p className="mt-8 text-sm text-muted-foreground">Noch nichts verkauft.</p>;

  return (
    <section className="mt-8">
      <h2 className="mb-4 inline-flex items-center gap-2 font-display text-2xl font-black text-brand-ink">
        <Truck className="h-5 w-5" /> Deine Verkäufe
      </h2>
      <ul className="space-y-3">
        {sales.map((s) => (
          <li key={s.order_item_id} className="rounded-3xl border border-border bg-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate font-display text-base font-bold text-brand-ink">{s.listing_title}</div>
                <div className="text-xs text-muted-foreground">{s.qty}× · {(s.unit_price_cents / 100).toFixed(2)} €</div>
              </div>
              {s.shipment ? (
                <div className="rounded-2xl bg-emerald-50 px-4 py-2.5 text-sm">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">Versendet mit {s.shipment.carrier}</div>
                  <div className="font-mono text-sm font-bold text-emerald-800">{s.shipment.tracking_number}</div>
                </div>
              ) : (
                <button
                  onClick={() => setOpenFor(openFor === s.order_id ? null : s.order_id)}
                  className="inline-flex min-h-12 items-center gap-2 rounded-full bg-brand px-5 py-3 text-sm font-bold text-primary-foreground brand-glow"
                >
                  <Truck className="h-4 w-4" /> Versandnummer eintragen
                </button>
              )}
            </div>
            {openFor === s.order_id && !s.shipment && (
              <div className="mt-4 grid gap-3 border-t border-border pt-4 sm:grid-cols-[160px_1fr_auto]">
                <select value={carrier} onChange={(e) => setCarrier(e.target.value)} className="min-h-12 rounded-2xl border border-border bg-surface px-4 text-sm">
                  <option>DHL</option><option>Hermes</option><option>DPD</option><option>UPS</option><option>Deutsche Post</option>
                </select>
                <input value={tracking} onChange={(e) => setTracking(e.target.value)} placeholder="Tracking-Nummer eingeben" className="min-h-12 rounded-2xl border border-border bg-surface px-4 text-sm" />
                <button onClick={() => submit(s.order_id)} disabled={saving || !tracking} className="min-h-12 rounded-2xl bg-brand px-6 text-sm font-bold text-primary-foreground disabled:opacity-50">
                  {saving ? "…" : "Speichern"}
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>

    </section>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 text-brand">{icon}<span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{label}</span></div>
      <div className="mt-2 font-display text-3xl font-black text-brand-ink">{value}</div>
    </div>
  );
}

function TabBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`rounded-full px-4 py-2 text-sm font-bold transition-colors ${active ? "bg-brand text-primary-foreground" : "text-brand-ink hover:bg-brand-soft"}`}>
      {label}
    </button>
  );
}

function EmptyListings() {
  return (
    <div className="rounded-[2rem] border-2 border-dashed border-brand/30 bg-card/40 p-10 text-center">
      <div className="text-5xl">📭</div>
      <p className="mt-3 font-display text-lg font-bold text-brand-ink">Noch nix online.</p>
      <p className="mt-1 text-sm text-muted-foreground">Klick "Neues Listing" und leg los.</p>
    </div>
  );
}


