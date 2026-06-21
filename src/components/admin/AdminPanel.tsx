import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { X, Minus, GripHorizontal, Users, Store, Tag, Star, Megaphone, BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Tab = "overview" | "users" | "shops" | "codes" | "featured" | "broadcast";

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
          <TabBtn icon={<Tag className="h-4 w-4" />} label="Rabatt-Codes" active={tab === "codes"} onClick={() => setTab("codes")} />
          <TabBtn icon={<Star className="h-4 w-4" />} label="Featured" active={tab === "featured"} onClick={() => setTab("featured")} />
          <TabBtn icon={<Megaphone className="h-4 w-4" />} label="Broadcast" active={tab === "broadcast"} onClick={() => setTab("broadcast")} />
        </div>
        <div className="flex-1 overflow-auto p-4">
          {tab === "overview" && <OverviewTab />}
          {tab === "users" && <UsersTab />}
          {tab === "shops" && <ShopsTab />}
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
  const [stats, setStats] = useState<{ users?: number; listings?: number; orders?: number }>({});
  useEffect(() => {
    (async () => {
      const [u, l, o] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("listings").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("id", { count: "exact", head: true }),
      ]);
      setStats({ users: u.count ?? 0, listings: l.count ?? 0, orders: o.count ?? 0 });
    })();
  }, []);
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <Stat label="Profile" value={stats.users} />
      <Stat label="Listings" value={stats.listings} />
      <Stat label="Orders gesamt" value={stats.orders} />
      <div className="rounded-xl border border-dashed border-brand/40 bg-brand-soft/30 p-4 text-xs text-muted-foreground sm:col-span-3">
        Live-GMV, Top-Verkäufer und Streitfälle-Übersicht folgen mit Stripe (Welle 2).
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

function UsersTab() {
  return <div className="text-sm text-muted-foreground">Nutzersuche & Rollenverwaltung kommt mit den ersten echten Anmeldungen.</div>;
}
function ShopsTab() {
  return <div className="text-sm text-muted-foreground">Shop-Übersicht und Featuring folgt — Featured-Tab ist schon nutzbar.</div>;
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
function FeaturedTab() {
  return <div className="text-sm text-muted-foreground">Drag-and-Drop für Startseiten-Shops folgt, sobald Shops registriert sind.</div>;
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
