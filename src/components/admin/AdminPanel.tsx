import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { X, Minus, GripHorizontal, Users, Store, Tag, Star, Megaphone, BarChart3, Search, Ban, ShieldCheck, ArrowUp, ArrowDown, Trash2, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Tab = "overview" | "users" | "shops" | "codes" | "featured" | "broadcast" | "disputes";

export function AdminPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [minimized, setMinimized] = useState(false);
  const [tab, setTab] = useState<Tab>("overview");
  const [pos, setPos] = useState({ x: 80, y: 80 });
  const [size, setSize] = useState({ w: 720, h: 520 });
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);
  const resizeRef = useRef<{ startX: number; startY: number; origW: number; origH: number } | null>(null);

  useEffect(() => {
    function onMove(e: MouseEvent) {
      if (dragRef.current) {
        setPos({
          x: Math.max(0, dragRef.current.origX + e.clientX - dragRef.current.startX),
          y: Math.max(0, dragRef.current.origY + e.clientY - dragRef.current.startY),
        });
      } else if (resizeRef.current) {
        setSize({
          w: Math.max(360, resizeRef.current.origW + e.clientX - resizeRef.current.startX),
          h: Math.max(300, resizeRef.current.origH + e.clientY - resizeRef.current.startY),
        });
      }
    }
    function onUp() { dragRef.current = null; resizeRef.current = null; }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, []);

  if (!open) return null;

  if (minimized) {
    return (
      <button
        onClick={() => setMinimized(false)}
        className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full bg-brand px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-xl"
      >
        <BarChart3 className="h-4 w-4" /> Admin-Panel
      </button>
    );
  }

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      style={{ left: pos.x, top: pos.y, width: size.w, height: size.h }}
      className="fixed z-50 flex flex-col overflow-hidden rounded-2xl border-2 border-brand bg-card shadow-2xl"
    >
      <div
        onMouseDown={(e) => { dragRef.current = { startX: e.clientX, startY: e.clientY, origX: pos.x, origY: pos.y }; }}
        className="flex cursor-move items-center justify-between border-b border-border bg-gradient-to-r from-brand to-fuchsia-600 px-4 py-2 text-white"
      >
        <div className="flex items-center gap-2 text-sm font-bold"><GripHorizontal className="h-4 w-4" /> CreaHQ Admin</div>
        <div className="flex items-center gap-1">
          <button onClick={() => setMinimized(true)} className="rounded p-1 hover:bg-white/20"><Minus className="h-4 w-4" /></button>
          <button onClick={onClose} className="rounded p-1 hover:bg-white/20"><X className="h-4 w-4" /></button>
        </div>
      </div>
      <div className="flex flex-1 overflow-hidden">
        <div className="flex w-44 shrink-0 flex-col gap-0.5 border-r border-border bg-surface p-2">
          <TabBtn icon={<BarChart3 className="h-4 w-4" />} label="Übersicht" active={tab === "overview"} onClick={() => setTab("overview")} />
          <TabBtn icon={<Users className="h-4 w-4" />} label="Nutzer" active={tab === "users"} onClick={() => setTab("users")} />
          <TabBtn icon={<Store className="h-4 w-4" />} label="Shops" active={tab === "shops"} onClick={() => setTab("shops")} />
          <TabBtn icon={<AlertTriangle className="h-4 w-4" />} label="Streitfälle" active={tab === "disputes"} onClick={() => setTab("disputes")} />
          <TabBtn icon={<Tag className="h-4 w-4" />} label="Rabatt-Codes" active={tab === "codes"} onClick={() => setTab("codes")} />
          <TabBtn icon={<Star className="h-4 w-4" />} label="Featured" active={tab === "featured"} onClick={() => setTab("featured")} />
          <TabBtn icon={<Megaphone className="h-4 w-4" />} label="Broadcast" active={tab === "broadcast"} onClick={() => setTab("broadcast")} />
        </div>
        <div className="flex-1 overflow-auto p-4">
          {tab === "overview" && <OverviewTab />}
          {tab === "users" && <UsersTab />}
          {tab === "shops" && <ShopsTab />}
          {tab === "disputes" && <DisputesTab />}
          {tab === "codes" && <CodesTab />}
          {tab === "featured" && <FeaturedTab />}
          {tab === "broadcast" && <BroadcastTab />}
        </div>
      </div>
      <div
        onMouseDown={(e) => { resizeRef.current = { startX: e.clientX, startY: e.clientY, origW: size.w, origH: size.h }; }}
        className="absolute bottom-0 right-0 h-4 w-4 cursor-nwse-resize bg-gradient-to-br from-transparent to-brand/40"
      />
    </motion.div>
  );
}

function TabBtn({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${active ? "bg-brand text-primary-foreground" : "text-brand-ink hover:bg-card"}`}>
      {icon}{label}
    </button>
  );
}

function OverviewTab() {
  const [stats, setStats] = useState<{ users?: number; listings?: number; orders?: number; disputes?: number }>({});
  useEffect(() => {
    (async () => {
      const [u, l, o, d] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("listings").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("id", { count: "exact", head: true }),
        supabase.from("disputes").select("id", { count: "exact", head: true }).eq("status", "open"),
      ]);
      setStats({ users: u.count ?? 0, listings: l.count ?? 0, orders: o.count ?? 0, disputes: d.count ?? 0 });
    })();
  }, []);
  return (
    <div className="grid gap-3 sm:grid-cols-4">
      <Stat label="Profile" value={stats.users} />
      <Stat label="Listings" value={stats.listings} />
      <Stat label="Orders gesamt" value={stats.orders} />
      <Stat label="Offene Streitfälle" value={stats.disputes} />
      <div className="rounded-xl border border-dashed border-brand/40 bg-brand-soft/30 p-4 text-xs text-muted-foreground sm:col-span-4">
        Live-GMV folgt mit Stripe (Welle 2).
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | undefined }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-2xl font-black text-brand-ink">{value ?? "…"}</div>
    </div>
  );
}

type UserRow = { id: string; display_name: string | null; handle: string | null; banned: boolean; roles: string[] };

function UsersTab() {
  const [q, setQ] = useState("");
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(false);

  async function search() {
    setLoading(true);
    let query = supabase.from("profiles").select("id,display_name,handle,banned").limit(20);
    if (q.trim()) query = query.or(`display_name.ilike.%${q}%,handle.ilike.%${q}%`);
    const { data: profiles, error } = await query;
    if (error) { toast.error(error.message); setLoading(false); return; }

    const ids = (profiles ?? []).map((p) => p.id);
    const { data: roles } = await supabase.from("user_roles").select("user_id,role").in("user_id", ids.length ? ids : ["-"]);

    const rows: UserRow[] = (profiles ?? []).map((p) => ({
      ...p,
      roles: (roles ?? []).filter((r) => r.user_id === p.id).map((r) => r.role),
    }));
    setUsers(rows);
    setLoading(false);
  }

  useEffect(() => { search(); }, []);

  async function toggleBan(u: UserRow) {
    const { error } = await supabase.from("profiles").update({ banned: !u.banned }).eq("id", u.id);
    if (error) return toast.error(error.message);
    toast.success(u.banned ? "Entsperrt" : "Gesperrt");
    setUsers((arr) => arr.map((x) => (x.id === u.id ? { ...x, banned: !x.banned } : x)));
  }

  async function toggleRole(u: UserRow, role: string) {
    const has = u.roles.includes(role);
    if (has) {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", u.id).eq("role", role);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("user_roles").insert({ user_id: u.id, role });
      if (error) return toast.error(error.message);
    }
    setUsers((arr) => arr.map((x) => (x.id === u.id ? { ...x, roles: has ? x.roles.filter((r) => r !== role) : [...x.roles, role] } : x)));
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && search()}
          placeholder="Name oder Handle suchen…"
          className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm"
        />
        <button onClick={search} className="inline-flex items-center gap-1 rounded-lg bg-brand px-3 py-2 text-sm font-bold text-primary-foreground">
          <Search className="h-3.5 w-3.5" /> Suchen
        </button>
      </div>
      {loading ? (
        <div className="text-sm text-muted-foreground">Lade …</div>
      ) : users.length === 0 ? (
        <div className="text-sm text-muted-foreground">Keine Nutzer gefunden.</div>
      ) : (
        <ul className="space-y-2">
          {users.map((u) => (
            <li key={u.id} className="rounded-xl border border-border bg-surface p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-brand-ink">{u.display_name ?? "Unbenannt"}</div>
                  <div className="truncate text-xs text-muted-foreground">@{u.handle ?? "—"}</div>
                </div>
                <button
                  onClick={() => toggleBan(u)}
                  className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${u.banned ? "bg-red-100 text-red-700" : "bg-brand-soft text-brand-ink"}`}
                >
                  <Ban className="h-3 w-3" /> {u.banned ? "Entsperren" : "Sperren"}
                </button>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {["seller", "admin", "founder"].map((role) => (
                  <button
                    key={role}
                    onClick={() => toggleRole(u, role)}
                    className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                      u.roles.includes(role) ? "border-brand bg-brand text-primary-foreground" : "border-border text-muted-foreground hover:border-brand hover:text-brand"
                    }`}
                  >
                    <ShieldCheck className="h-2.5 w-2.5" /> {role}
                  </button>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

type ShopRow = { seller_id: string; display_name: string | null; handle: string | null; listingCount: number; featured: boolean };
type ShopListingRow = { id: string; title: string; status: string; price_cents: number };

function ShopsTab() {
  const [shops, setShops] = useState<ShopRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [shopListings, setShopListings] = useState<Record<string, ShopListingRow[]>>({});

  async function load() {
    setLoading(true);
    const { data: listings } = await supabase.from("listings").select("seller_id");
    const sellerIds = Array.from(new Set((listings ?? []).map((l) => l.seller_id)));
    if (sellerIds.length === 0) { setShops([]); setLoading(false); return; }

    const [{ data: profiles }, { data: featured }] = await Promise.all([
      supabase.from("profiles").select("id,display_name,handle").in("id", sellerIds),
      supabase.from("featured_shops").select("shop_id"),
    ]);
    const featuredIds = new Set((featured ?? []).map((f) => f.shop_id));

    const rows: ShopRow[] = sellerIds.map((id) => {
      const p = (profiles ?? []).find((x) => x.id === id);
      const count = (listings ?? []).filter((l) => l.seller_id === id).length;
      return { seller_id: id, display_name: p?.display_name ?? null, handle: p?.handle ?? null, listingCount: count, featured: featuredIds.has(id) };
    });
    setShops(rows);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function toggleExpand(sellerId: string) {
    if (expanded === sellerId) { setExpanded(null); return; }
    setExpanded(sellerId);
    if (!shopListings[sellerId]) {
      const { data } = await supabase.from("listings").select("id,title,status,price_cents").eq("seller_id", sellerId).order("created_at", { ascending: false });
      setShopListings((prev) => ({ ...prev, [sellerId]: (data ?? []) as ShopListingRow[] }));
    }
  }

  async function toggleListingStatus(sellerId: string, listing: ShopListingRow) {
    const newStatus = listing.status === "archived" ? "published" : "archived";
    const { error } = await supabase.from("listings").update({ status: newStatus }).eq("id", listing.id);
    if (error) return toast.error(error.message);
    toast.success(newStatus === "archived" ? "Deaktiviert" : "Wieder aktiviert");
    setShopListings((prev) => ({
      ...prev,
      [sellerId]: prev[sellerId].map((l) => (l.id === listing.id ? { ...l, status: newStatus } : l)),
    }));
  }

  async function toggleFeature(shop: ShopRow) {
    if (shop.featured) {
      const { error } = await supabase.from("featured_shops").delete().eq("shop_id", shop.seller_id);
      if (error) return toast.error(error.message);
      toast.success("Nicht mehr featured");
    } else {
      const { error } = await supabase.from("featured_shops").insert({ shop_id: shop.seller_id, position: 0 });
      if (error) return toast.error(error.message);
      toast.success("Jetzt featured");
    }
    setShops((arr) => arr.map((x) => (x.seller_id === shop.seller_id ? { ...x, featured: !x.featured } : x)));
  }

  if (loading) return <div className="text-sm text-muted-foreground">Lade …</div>;
  if (shops.length === 0) return <div className="text-sm text-muted-foreground">Noch keine Shops mit Listings.</div>;

  return (
    <ul className="space-y-2">
      {shops.map((s) => (
        <li key={s.seller_id} className="rounded-xl border border-border bg-surface p-3">
          <div className="flex items-center justify-between gap-2">
            <button onClick={() => toggleExpand(s.seller_id)} className="min-w-0 flex-1 text-left">
              <div className="truncate text-sm font-semibold text-brand-ink">{s.display_name ?? "Unbenannt"}</div>
              <div className="truncate text-xs text-muted-foreground">@{s.handle ?? "—"} · {s.listingCount} Listing{s.listingCount !== 1 ? "s" : ""}</div>
            </button>
            <button
              onClick={() => toggleFeature(s)}
              className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${s.featured ? "bg-amber-100 text-amber-800" : "bg-brand-soft text-brand-ink"}`}
            >
              <Star className="h-3 w-3" /> {s.featured ? "Featured" : "Featuren"}
            </button>
          </div>
          {expanded === s.seller_id && (
            <ul className="mt-3 space-y-1.5 border-t border-border pt-3">
              {(shopListings[s.seller_id] ?? []).map((l) => (
                <li key={l.id} className="flex items-center justify-between gap-2 rounded-lg bg-card px-3 py-2">
                  <div className="min-w-0">
                    <div className="truncate text-xs font-semibold text-brand-ink">{l.title}</div>
                    <div className="text-[10px] text-muted-foreground">{(l.price_cents / 100).toFixed(2)} € · {l.status}</div>
                  </div>
                  <button
                    onClick={() => toggleListingStatus(s.seller_id, l)}
                    className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold ${l.status === "archived" ? "bg-emerald-100 text-emerald-700" : "bg-red-50 text-red-600"}`}
                  >
                    {l.status === "archived" ? "Aktivieren" : "Deaktivieren"}
                  </button>
                </li>
              ))}
              {!shopListings[s.seller_id]?.length && <li className="text-xs text-muted-foreground">Lade Listings …</li>}
            </ul>
          )}
        </li>
      ))}
    </ul>
  );
}

type DisputeRow = { id: string; order_id: string; reason: string; status: string; created_at: string; resolution_note: string | null };

function DisputesTab() {
  const [disputes, setDisputes] = useState<DisputeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [noteFor, setNoteFor] = useState<string | null>(null);
  const [note, setNote] = useState("");

  async function load() {
    setLoading(true);
    const { data, error } = await supabase.from("disputes").select("id,order_id,reason,status,created_at,resolution_note").order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setDisputes(data ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function resolve(id: string, status: string) {
    const { error } = await supabase.from("disputes").update({ status, resolution_note: note || null, resolved_at: new Date().toISOString() }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Aktualisiert");
    setNoteFor(null); setNote("");
    load();
  }

  const statusColor: Record<string, string> = {
    open: "bg-red-100 text-red-700",
    investigating: "bg-amber-100 text-amber-800",
    resolved_buyer: "bg-emerald-100 text-emerald-700",
    resolved_seller: "bg-emerald-100 text-emerald-700",
    closed: "bg-gray-100 text-gray-600",
  };

  if (loading) return <div className="text-sm text-muted-foreground">Lade …</div>;
  if (disputes.length === 0) return <div className="text-sm text-muted-foreground">Keine Streitfälle. 🎉</div>;

  return (
    <ul className="space-y-3">
      {disputes.map((d) => (
        <li key={d.id} className="rounded-xl border border-border bg-surface p-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="font-mono text-xs text-muted-foreground">Order #{d.order_id.slice(0, 8)}</div>
              <div className="mt-1 text-sm text-brand-ink">{d.reason}</div>
              {d.resolution_note && <div className="mt-1 text-xs italic text-muted-foreground">Notiz: {d.resolution_note}</div>}
            </div>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${statusColor[d.status] ?? ""}`}>{d.status}</span>
          </div>
          {d.status === "open" || d.status === "investigating" ? (
            <div className="mt-2 space-y-2">
              {noteFor === d.id ? (
                <>
                  <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Notiz zur Lösung…" rows={2} className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm" />
                  <div className="flex flex-wrap gap-1.5">
                    <button onClick={() => resolve(d.id, "investigating")} className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">In Prüfung</button>
                    <button onClick={() => resolve(d.id, "resolved_buyer")} className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">Zugunsten Käufer</button>
                    <button onClick={() => resolve(d.id, "resolved_seller")} className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">Zugunsten Verkäufer</button>
                    <button onClick={() => resolve(d.id, "closed")} className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-600">Schließen</button>
                  </div>
                </>
              ) : (
                <button onClick={() => setNoteFor(d.id)} className="rounded-full bg-brand px-3 py-1 text-xs font-bold text-primary-foreground">Bearbeiten</button>
              )}
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function CodesTab() {
  const [code, setCode] = useState(""); const [amount, setAmount] = useState(10); const [kind, setKind] = useState<"percent" | "fixed">("percent");
  async function create(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from("discount_codes").insert({ code: code.toUpperCase(), amount, kind, scope: "global" });
    if (error) toast.error(error.message); else { toast.success("Code angelegt"); setCode(""); }
  }
  return (
    <form onSubmit={create} className="space-y-3">
      <div className="text-sm font-semibold text-brand-ink">Neuen globalen Rabatt-Code anlegen</div>
      <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="SUMMER10" className="w-full rounded-lg border border-border bg-surface px-3 py-2 font-mono text-sm" required />
      <div className="flex gap-2">
        <select value={kind} onChange={(e) => setKind(e.target.value as never)} className="rounded-lg border border-border bg-surface px-3 py-2 text-sm">
          <option value="percent">Prozent</option>
          <option value="fixed">Festbetrag (Cent)</option>
        </select>
        <input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm" min={1} />
      </div>
      <button type="submit" className="rounded-full bg-brand px-4 py-2 text-sm font-bold text-primary-foreground">Anlegen</button>
    </form>
  );
}

type FeaturedRow = { id: string; shop_id: string; position: number; display_name: string | null; handle: string | null };

function FeaturedTab() {
  const [rows, setRows] = useState<FeaturedRow[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data: featured } = await supabase.from("featured_shops").select("id,shop_id,position").order("position", { ascending: true });
    const ids = (featured ?? []).map((f) => f.shop_id);
    const { data: profiles } = await supabase.from("profiles").select("id,display_name,handle").in("id", ids.length ? ids : ["-"]);
    const merged: FeaturedRow[] = (featured ?? []).map((f) => {
      const p = (profiles ?? []).find((x) => x.id === f.shop_id);
      return { id: f.id, shop_id: f.shop_id, position: f.position, display_name: p?.display_name ?? null, handle: p?.handle ?? null };
    });
    setRows(merged);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= rows.length) return;
    const a = rows[index], b = rows[target];
    const { error: e1 } = await supabase.from("featured_shops").update({ position: b.position }).eq("id", a.id);
    const { error: e2 } = await supabase.from("featured_shops").update({ position: a.position }).eq("id", b.id);
    if (e1 || e2) return toast.error("Konnte Reihenfolge nicht ändern");
    load();
  }

  async function remove(id: string) {
    const { error } = await supabase.from("featured_shops").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Entfernt");
    setRows((arr) => arr.filter((r) => r.id !== id));
  }

  if (loading) return <div className="text-sm text-muted-foreground">Lade …</div>;
  if (rows.length === 0) return <div className="text-sm text-muted-foreground">Noch keine Shops featured. Im Shops-Tab "Featuren" klicken.</div>;

  return (
    <ul className="space-y-2">
      {rows.map((r, i) => (
        <li key={r.id} className="flex items-center justify-between gap-2 rounded-xl border border-border bg-surface p-3">
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-brand-ink">{r.display_name ?? "Unbenannt"}</div>
            <div className="truncate text-xs text-muted-foreground">@{r.handle ?? "—"}</div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button onClick={() => move(i, -1)} disabled={i === 0} className="grid h-7 w-7 place-items-center rounded-full border border-border disabled:opacity-30"><ArrowUp className="h-3.5 w-3.5" /></button>
            <button onClick={() => move(i, 1)} disabled={i === rows.length - 1} className="grid h-7 w-7 place-items-center rounded-full border border-border disabled:opacity-30"><ArrowDown className="h-3.5 w-3.5" /></button>
            <button onClick={() => remove(r.id)} className="grid h-7 w-7 place-items-center rounded-full bg-red-50 text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
          </div>
        </li>
      ))}
    </ul>
  );
}

function BroadcastTab() {
  const [title, setTitle] = useState(""); const [body, setBody] = useState(""); const [segment, setSegment] = useState<"all" | "sellers" | "buyers">("all");
  async function send(e: React.FormEvent) {
    e.preventDefault();
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { error } = await supabase.from("founder_broadcasts").insert({ title, body, segment, founder_id: u.user.id });
    if (error) toast.error(error.message); else { toast.success("Broadcast gespeichert (Versand folgt mit Notifications-Wave)"); setTitle(""); setBody(""); }
  }
  return (
    <form onSubmit={send} className="space-y-3">
      <div className="text-sm font-semibold text-brand-ink">Founder-Nachricht senden</div>
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titel" className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm" required />
      <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Nachricht…" rows={4} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm" required />
      <select value={segment} onChange={(e) => setSegment(e.target.value as never)} className="rounded-lg border border-border bg-surface px-3 py-2 text-sm">
        <option value="all">Alle</option>
        <option value="sellers">Verkäufer</option>
        <option value="buyers">Käufer</option>
      </select>
      <button type="submit" className="block rounded-full bg-brand px-4 py-2 text-sm font-bold text-primary-foreground">Speichern</button>
    </form>
  );
}
