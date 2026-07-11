import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Plus, Trash2, Eye, Store, ShoppingBag, TrendingUp, Package, Wallet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — CreaHQ" }] }),
  component: Dashboard,
});

type MyListing = {
  id: string;
  title: string;
  price_cents: number;
  status: string;
  cover_url: string | null;
  created_at: string;
};

type MyOrder = { id: string; total_cents: number; status: string; created_at: string };

type Tab = "overview" | "listings" | "orders";

function Dashboard() {
  const [listings, setListings] = useState<MyListing[]>([]);
  const [orders, setOrders] = useState<MyOrder[]>([]);
  const [revenueCents, setRevenueCents] = useState(0);
  const [salesCount, setSalesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [tab, setTab] = useState<Tab>("overview");

  async function load() {
    setLoading(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;

    const [{ data: l }, { data: o }, { data: items }] = await Promise.all([
      supabase.from("listings").select("id,title,price_cents,status,cover_url,created_at").eq("seller_id", u.user.id).order("created_at", { ascending: false }),
      // Bugfix: nur eigene Bestellungen als Käufer laden
      supabase.from("orders").select("id,total_cents,status,created_at").eq("buyer_id", u.user.id).order("created_at", { ascending: false }).limit(10),
      // Eigene Verkäufe (als Verkäufer) für Umsatz-Stat
      supabase.from("order_items").select("unit_price_cents,qty").eq("seller_id", u.user.id),
    ]);

    setListings((l ?? []) as MyListing[]);
    setOrders((o ?? []) as MyOrder[]);
    const rev = (items ?? []).reduce((sum, it) => sum + it.unit_price_cents * it.qty, 0);
    setRevenueCents(rev);
    setSalesCount((items ?? []).reduce((sum, it) => sum + it.qty, 0));
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function deleteListing(id: string) {
    if (!confirm("Wirklich löschen?")) return;
    const { error } = await supabase.from("listings").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Gelöscht.");
    setListings((l) => l.filter((x) => x.id !== id));
  }

  const publishedCount = listings.filter((l) => l.status === "published").length;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-1 inline-flex items-center gap-2 rounded-full bg-brand-soft px-3 py-1 text-xs font-bold uppercase tracking-widest text-brand">
            <Store className="h-3.5 w-3.5" /> Dein Headquarter
          </div>
          <h1 className="font-display text-4xl font-black text-brand-ink sm:text-5xl">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">Verwalte deine Listings und siehe deine Käufe.</p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-3 text-sm font-bold text-primary-foreground brand-glow transition-transform hover:scale-105"
        >
          <Plus className="h-4 w-4" /> Neues Listing
        </button>
      </div>

      {/* Stat cards */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <StatCard icon={<Wallet className="h-5 w-5" />} label="Umsatz gesamt" value={`${(revenueCents / 100).toFixed(2)} €`} />
        <StatCard icon={<TrendingUp className="h-5 w-5" />} label="Verkäufe" value={String(salesCount)} />
        <StatCard icon={<Package className="h-5 w-5" />} label="Aktive Listings" value={`${publishedCount} / ${listings.length}`} />
      </div>

      {creating && <NewListingForm onClose={() => setCreating(false)} onCreated={load} />}

      {/* Tabs */}
      <div className="mt-10 flex gap-1 rounded-full border border-border bg-card p-1 w-fit">
        <TabBtn label="Übersicht" active={tab === "overview"} onClick={() => setTab("overview")} />
        <TabBtn label="Meine Listings" active={tab === "listings"} onClick={() => setTab("listings")} />
        <TabBtn label="Meine Bestellungen" active={tab === "orders"} onClick={() => setTab("orders")} />
      </div>

      {tab === "overview" && (
        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-[2rem] border border-border bg-card p-6">
            <h2 className="mb-3 font-display text-xl font-black text-brand-ink">Neueste Listings</h2>
            {loading ? (
              <div className="text-sm text-muted-foreground">Lade …</div>
            ) : listings.length === 0 ? (
              <EmptyListings />
            ) : (
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
            {orders.length === 0 ? (
              <p className="text-sm text-muted-foreground">Noch keine Bestellungen.</p>
            ) : (
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
      )}

      {tab === "listings" && (
        <section className="mt-8">
          {loading ? (
            <div className="text-sm text-muted-foreground">Lade …</div>
          ) : listings.length === 0 ? (
            <EmptyListings />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {listings.map((l) => (
                <motion.div key={l.id} whileHover={{ y: -3 }} className="overflow-hidden rounded-3xl border border-border bg-card">
                  <div className="aspect-[4/3] bg-gradient-to-br from-brand-soft to-amber-100/40">
                    {l.cover_url && <img src={l.cover_url} alt={l.title} className="h-full w-full object-cover" />}
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="line-clamp-2 font-display text-base font-bold text-brand-ink">{l.title}</h3>
                      <span className="shrink-0 rounded-full bg-brand/10 px-2 py-0.5 text-xs font-bold text-brand">
                        {(l.price_cents / 100).toFixed(2)} €
                      </span>
                    </div>
                    <p className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">{l.status}</p>
                    <div className="mt-3 flex gap-2">
                      <Link to="/listing/$id" params={{ id: l.id }} className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-3 py-1.5 text-xs font-semibold text-brand-ink hover:bg-brand hover:text-primary-foreground">
                        <Eye className="h-3 w-3" /> Ansehen
                      </Link>
                      <button onClick={() => deleteListing(l.id)} className="inline-flex items-center gap-1 rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100">
                        <Trash2 className="h-3 w-3" /> Löschen
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
          {orders.length === 0 ? (
            <p className="text-sm text-muted-foreground">Noch keine Bestellungen.</p>
          ) : (
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
    </div>
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

function NewListingForm({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("9.00");
  const [kind, setKind] = useState<"digital" | "service">("digital");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Nicht eingeloggt");

      await supabase.from("user_roles").insert({ user_id: u.user.id, role: "seller" }).then(() => {});

      let coverUrl: string | null = null;
      if (file) {
        const path = `${u.user.id}/${crypto.randomUUID()}-${file.name.replace(/[^\w.-]/g, "_")}`;
        const { error: upErr } = await supabase.storage.from("listing-covers").upload(path, file, { upsert: false });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from("listing-covers").getPublicUrl(path);
        coverUrl = pub.publicUrl;
      }

      const price_cents = Math.round(parseFloat(price.replace(",", ".")) * 100);
      const { error } = await supabase.from("listings").insert({
        seller_id: u.user.id,
        title, description, category, kind, price_cents,
        cover_url: coverUrl, status: "published",
      });
      if (error) throw error;
      toast.success("Veröffentlicht!");
      onCreated(); onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Fehler");
    } finally { setSaving(false); }
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
      onSubmit={submit}
      className="mt-6 space-y-3 rounded-[2rem] border border-border bg-card p-6"
    >
      <h3 className="font-display text-xl font-bold text-brand-ink">Neues Listing</h3>
      <input required placeholder="Titel" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-full border border-border bg-background px-4 py-2.5 text-sm focus:border-brand focus:outline-none" />
      <textarea placeholder="Beschreibung" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full rounded-2xl border border-border bg-background px-4 py-2.5 text-sm focus:border-brand focus:outline-none" />
      <div className="grid gap-3 sm:grid-cols-3">
        <input placeholder="Kategorie (z.B. Prints)" value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-full border border-border bg-background px-4 py-2.5 text-sm focus:border-brand focus:outline-none" />
        <input required type="number" step="0.01" min="0" placeholder="Preis €" value={price} onChange={(e) => setPrice(e.target.value)} className="rounded-full border border-border bg-background px-4 py-2.5 text-sm focus:border-brand focus:outline-none" />
        <select value={kind} onChange={(e) => setKind(e.target.value as "digital" | "service")} className="rounded-full border border-border bg-background px-4 py-2.5 text-sm focus:border-brand focus:outline-none">
          <option value="digital">Digital</option>
          <option value="service">Service</option>
        </select>
      </div>
      <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="block w-full text-sm" />
      <div className="flex gap-2">
        <button type="submit" disabled={saving} className="rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-primary-foreground transition-transform hover:scale-105 disabled:opacity-60">
          {saving ? "Speichere …" : "Veröffentlichen"}
        </button>
        <button type="button" onClick={onClose} className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold">Abbrechen</button>
      </div>
    </motion.form>
  );
}
