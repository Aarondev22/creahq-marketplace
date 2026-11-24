import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { X, GripHorizontal, Flag, ShieldCheck, Users, Package, Power, TicketCheck, Bot, BadgeCheck } from "lucide-react";
import {
  listReports,
  resolveReport,
  listModerationQueue,
  moderateListing,
  searchUsers,
  banUser,
  toggleUserRole,
  setUserPro,
  setUserVerified,
  listAllListings,
  setListingStatus,
  type AdminListingFull,
  type AdminReport,
  type AdminListing,
  type AdminUser,
  listRedeemCodes,
  createRedeemCode,
  deleteRedeemCode,
  type AdminRedeemCode,
  getPlatformSettings,
  setPhysicalEnabled,
} from "@/lib/admin.functions";

type Tab = "reports" | "queue" | "products" | "users" | "codes" | "ai" | "system";
const POS_KEY = "creahq.adminPanel.pos";

export function AdminPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [tab, setTab] = useState<Tab>("reports");
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [queue, setQueue] = useState<AdminListing[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [q, setQ] = useState("");
  const [products, setProducts] = useState<AdminListingFull[]>([]);
  const [pq, setPq] = useState("");
  const [pf, setPf] = useState("all");
  const [loading, setLoading] = useState(false);
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: 24, y: 80 });
  const drag = useRef<{ dx: number; dy: number } | null>(null);

  const getReports = useServerFn(listReports);
  const getQueue = useServerFn(listModerationQueue);
  const findUsers = useServerFn(searchUsers);
  const doResolve = useServerFn(resolveReport);
  const doModerate = useServerFn(moderateListing);
  const doBan = useServerFn(banUser);
  const doRole = useServerFn(toggleUserRole);
  const doPro = useServerFn(setUserPro);
  const doSetVerified = useServerFn(setUserVerified);
  const getAll = useServerFn(listAllListings);
  const doStatus = useServerFn(setListingStatus);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(POS_KEY);
      if (raw) setPos(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === "reports") setReports(await getReports());
      else if (tab === "queue") setQueue(await getQueue());
      else if (tab === "products") setProducts(await getAll({ data: { q: pq, filter: pf } }));
      else if (tab === "users") setUsers(await findUsers({ data: { q } }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Laden fehlgeschlagen");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, q, pf]);

  useEffect(() => {
    if (open) void load();
  }, [open, load]);

  function startDrag(clientX: number, clientY: number) {
    drag.current = { dx: clientX - pos.x, dy: clientY - pos.y };
  }
  function moveDrag(clientX: number, clientY: number) {
    if (!drag.current) return;
    const next = {
      x: Math.max(4, Math.min(clientX - drag.current.dx, window.innerWidth - 80)),
      y: Math.max(4, Math.min(clientY - drag.current.dy, window.innerHeight - 80)),
    };
    setPos(next);
  }
  function endDrag() {
    if (!drag.current) return;
    drag.current = null;
    try {
      localStorage.setItem(POS_KEY, JSON.stringify(pos));
    } catch {
      /* ignore */
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed z-[90] w-[min(94vw,32rem)] overflow-hidden rounded-3xl border border-border bg-card shadow-2xl"
      style={{ left: pos.x, top: pos.y }}
      onMouseMove={(e) => moveDrag(e.clientX, e.clientY)}
      onMouseUp={endDrag}
      onMouseLeave={endDrag}
      onTouchMove={(e) => moveDrag(e.touches[0].clientX, e.touches[0].clientY)}
      onTouchEnd={endDrag}
    >
      <header
        className="flex cursor-grab items-center gap-2 border-b border-border bg-brand-soft/50 px-4 py-3 active:cursor-grabbing"
        onMouseDown={(e) => startDrag(e.clientX, e.clientY)}
        onTouchStart={(e) => startDrag(e.touches[0].clientX, e.touches[0].clientY)}
      >
        <GripHorizontal className="h-4 w-4 text-muted-foreground" />
        <h2 className="flex-1 font-display text-lg font-black text-brand-ink">Admin-Panel</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Schließen"
          className="grid h-10 w-10 place-items-center rounded-full hover:bg-card"
        >
          <X className="h-4 w-4" />
        </button>
      </header>

      <div className="no-scrollbar flex touch-pan-x gap-1.5 overflow-x-auto border-b border-border px-3 py-2">
        {([
          ["reports", "Meldungen", <Flag key="a" className="h-4 w-4" />],
          ["queue", "Moderation", <ShieldCheck key="b" className="h-4 w-4" />],
          ["products", "Produkte", <Package key="d" className="h-4 w-4" />],
          ["users", "Nutzer", <Users key="c" className="h-4 w-4" />],
          ["codes", "Codes", <TicketCheck key="t" className="h-4 w-4" />],
          ["ai", "KI-Konsole", <Bot key="i" className="h-4 w-4" />],
          ["system", "System", <Power key="s" className="h-4 w-4" />],
        ] as [Tab, string, React.ReactNode][]).map(([key, label, icon]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`flex min-h-11 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-3 text-[11px] font-bold transition ${
              tab === key ? "bg-brand text-primary-foreground" : "border border-border text-muted-foreground"
            }`}
          >
            {icon} {label}
          </button>
        ))}
      </div>

      <div className="max-h-[60vh] overflow-y-auto p-3">
        {loading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl bg-brand-soft/50" />
            ))}
          </div>
        ) : tab === "system" ? (
          <SystemTab />
        ) : tab === "codes" ? (
          <CodesTab />
        ) : tab === "ai" ? (
          <AiConsoleTab />
        ) : tab === "reports" ? (
          reports.length === 0 ? (
            <Empty text="Keine Meldungen – alles ruhig." />
          ) : (
            <ul className="space-y-2">
              {reports.map((r) => (
                <li key={r.id} className="rounded-2xl border border-border p-3">
                  <div className="text-sm font-bold text-brand-ink">
                    {r.reason} · <span className="text-muted-foreground">{r.target_type}</span>
                  </div>
                  {r.note && <p className="mt-1 text-xs text-muted-foreground">{r.note}</p>}
                  <p className="mt-1 text-[10px] text-muted-foreground">Status: {r.status}</p>
                  {r.status === "open" && (
                    <div className="mt-2 flex gap-2">
                      <Action
                        label="Erledigt"
                        onClick={async () => {
                          await doResolve({ data: { id: r.id, status: "resolved" } });
                          toast.success("Meldung erledigt");
                          void load();
                        }}
                      />
                      <Action
                        variant="ghost"
                        label="Verwerfen"
                        onClick={async () => {
                          await doResolve({ data: { id: r.id, status: "dismissed" } });
                          toast.success("Meldung verworfen");
                          void load();
                        }}
                      />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )
        ) : tab === "queue" ? (
          queue.length === 0 ? (
            <Empty text="Keine Produkte in der Warteschlange." />
          ) : (
            <ul className="space-y-2">
              {queue.map((l) => (
                <li key={l.id} className="flex items-center gap-3 rounded-2xl border border-border p-3">
                  <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-brand-soft">
                    {l.cover_url ? <img src={l.cover_url} alt="" className="h-full w-full object-cover" /> : <Package className="h-5 w-5 text-brand" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-brand-ink">{l.title}</p>
                    <p className="text-[10px] text-muted-foreground">{l.moderation_status}</p>
                  </div>
                  <div className="flex gap-2">
                    <Action
                      label="Freigeben"
                      onClick={async () => {
                        await doModerate({ data: { id: l.id, moderation_status: "approved" } });
                        toast.success("Freigegeben");
                        void load();
                      }}
                    />
                    <Action
                      variant="ghost"
                      label="Sperren"
                      onClick={async () => {
                        await doModerate({ data: { id: l.id, moderation_status: "rejected" } });
                        toast.success("Gesperrt");
                        void load();
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )
        ) : tab === "products" ? (
          <div className="space-y-3">
            <form onSubmit={(e) => { e.preventDefault(); void load(); }} className="flex gap-2">
              <input value={pq} onChange={(e) => setPq(e.target.value)} placeholder="Produkt suchen …" className="min-h-11 flex-1 rounded-full border border-border bg-background px-4 text-sm focus:border-brand focus:outline-none" />
              <button type="submit" className="min-h-11 rounded-full bg-brand px-4 text-sm font-bold text-primary-foreground">Suchen</button>
            </form>
            <div className="flex flex-wrap gap-1.5">
              {([["all","Alle"],["approved","Freigegeben"],["pending","Prüfen"],["rejected","Gesperrt"],["paused","Pausiert"]] as const).map(([k,l]) => (
                <button key={k} type="button" onClick={() => setPf(k)} className={`min-h-9 rounded-full px-3 text-xs font-bold ${pf === k ? "bg-brand text-primary-foreground" : "border border-border text-muted-foreground"}`}>{l}</button>
              ))}
            </div>
            {products.length === 0 ? <Empty text="Keine Produkte gefunden." /> : (
              <ul className="space-y-2">
                {products.map((l) => (
                  <li key={l.id} className="rounded-2xl border border-border p-3">
                    <div className="flex items-center gap-3">
                      <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-brand-soft">
                        {l.cover_url ? <img src={l.cover_url} alt="" className="h-full w-full object-cover" /> : <Package className="h-5 w-5 text-brand" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <a href={`/listing/${l.id}`} target="_blank" rel="noreferrer" className="block truncate text-sm font-bold text-brand-ink hover:text-brand">{l.title}</a>
                        <p className="text-[11px] text-muted-foreground">{(l.price_cents / 100).toFixed(2)} {l.currency?.toUpperCase()} · {l.moderation_status} · {l.status === "published" ? "online" : "pausiert"}</p>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {l.moderation_status !== "approved" && <Action label="Freigeben" onClick={async () => { await doModerate({ data: { id: l.id, moderation_status: "approved" } }); toast.success("Freigegeben"); void load(); }} />}
                      {l.moderation_status !== "rejected" && <Action variant="ghost" label="Sperren" onClick={async () => { await doModerate({ data: { id: l.id, moderation_status: "rejected" } }); toast.success("Gesperrt"); void load(); }} />}
                      <Action variant="ghost" label={l.status === "published" ? "Pausieren" : "Online stellen"} onClick={async () => { await doStatus({ data: { id: l.id, status: l.status === "published" ? "draft" : "published" } }); toast.success("Gespeichert"); void load(); }} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void load();
              }}
              className="flex gap-2"
            >
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Name oder Handle suchen …"
                className="min-h-11 flex-1 rounded-full border border-border bg-background px-4 text-sm focus:border-brand focus:outline-none"
              />
              <button type="submit" className="min-h-11 rounded-full bg-brand px-4 text-sm font-bold text-primary-foreground">
                Suchen
              </button>
            </form>
            {users.length === 0 ? (
              <Empty text="Keine Nutzer:innen gefunden." />
            ) : (
              <ul className="space-y-2">
                {users.map((u) => (
                  <li key={u.id} className="rounded-2xl border border-border p-3">
                    <p className="flex items-center gap-2 text-sm font-bold text-brand-ink">
                      {u.display_name ?? "Ohne Namen"}
                      {u.is_pro && <span className="rounded-full bg-gold px-2 py-0.5 text-[10px] font-black text-gold-foreground shadow-sm">PRO</span>}
                      {u.is_verified && <span className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-bold text-brand"><BadgeCheck className="h-3 w-3" /> Verifiziert</span>}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      @{u.handle ?? "—"} · {u.roles.join(", ") || "buyer"} {u.banned ? "· gesperrt" : ""}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Action
                        label={u.banned ? "Entsperren" : "Sperren"}
                        variant="ghost"
                        onClick={async () => {
                          await doBan({ data: { userId: u.id, ban: !u.banned } });
                          toast.success("Gespeichert");
                          void load();
                        }}
                      />
                      <Action
                        label={u.is_pro ? "Pro entziehen" : "Pro vergeben"}
                        variant={u.is_pro ? "gold" : "ghost"}
                        onClick={async () => {
                          await doPro({ data: { userId: u.id, pro: !u.is_pro } });
                          toast.success(u.is_pro ? "Jetzt Standard" : "Jetzt Pro");
                          void load();
                        }}
                      />
                      <Action
                        label={u.is_verified ? "Verifizierung entziehen" : "Geprüfter Creator"}
                        variant="ghost"
                        onClick={async () => {
                          await doSetVerified({ data: { userId: u.id, verified: !u.is_verified } });
                          toast.success(u.is_verified ? "Verifizierung entzogen" : "Creator verifiziert");
                          void load();
                        }}
                      />
                      {(["seller", "admin"] as const).map((role) => {
                        const has = u.roles.includes(role);
                        return (
                          <Action
                            key={role}
                            variant="ghost"
                            label={`${has ? "− " : "+ "}${role}`}
                            onClick={async () => {
                              await doRole({
                                data: { targetUserId: u.id, role, action: has ? "remove" : "add" },
                              });
                              toast.success("Rolle aktualisiert");
                              void load();
                            }}
                          />
                        );
                      })}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="px-4 py-10 text-center text-sm text-muted-foreground">{text}</p>;
}

function CodesTab() {
  const getCodes = useServerFn(listRedeemCodes);
  const createCode = useServerFn(createRedeemCode);
  const removeCode = useServerFn(deleteRedeemCode);
  const [codes, setCodes] = useState<AdminRedeemCode[]>([]);
  const [code, setCode] = useState("");
  const [codeType, setCodeType] = useState<AdminRedeemCode["code_type"]>("pro");
  const [maxUses, setMaxUses] = useState("1");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setCodes(await getCodes());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Codes konnten nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  }, [getCodes]);

  useEffect(() => { void load(); }, [load]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      const created = await createCode({
        data: { code, codeType, maxUses: maxUses === "unlimited" ? null : Number(maxUses) },
      });
      setCode("");
      toast.success(`Code ${created.code} erstellt.`);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Code konnte nicht erstellt werden.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={submit} className="space-y-3 rounded-2xl border border-border p-3">
        <h3 className="font-bold text-brand-ink">Einlöse-Code erstellen</h3>
        <label className="block text-xs font-semibold text-muted-foreground">
          Code-Name <span className="font-normal">(leer lassen für Zufallscode)</span>
          <input
            value={code}
            onChange={(event) => setCode(event.target.value.toUpperCase())}
            maxLength={40}
            pattern="[A-Z0-9-]{3,40}"
            placeholder="CREAHQ-ABC123"
            className="mt-1 min-h-11 w-full rounded-xl border border-border bg-background px-3 font-mono text-sm text-brand-ink"
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-semibold text-muted-foreground">
            Typ
            <select value={codeType} onChange={(event) => setCodeType(event.target.value as AdminRedeemCode["code_type"])} className="mt-1 min-h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-brand-ink">
              <option value="founder">Founder</option>
              <option value="pro">Pro</option>
              <option value="beta_tester">Beta-Tester</option>
            </select>
          </label>
          <label className="text-xs font-semibold text-muted-foreground">
            Maximale Einlösungen
            <select value={maxUses} onChange={(event) => setMaxUses(event.target.value)} className="mt-1 min-h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-brand-ink">
              <option value="1">1 Einlösung</option>
              <option value="5">5 Einlösungen</option>
              <option value="10">10 Einlösungen</option>
              <option value="unlimited">Unbegrenzt</option>
            </select>
          </label>
        </div>
        <button type="submit" disabled={saving} className="min-h-11 rounded-full bg-brand px-5 text-sm font-bold text-primary-foreground disabled:opacity-60">
          {saving ? "Wird erstellt …" : "Code erstellen"}
        </button>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="w-full min-w-[35rem] text-left text-xs">
          <thead className="bg-brand-soft/50 text-muted-foreground">
            <tr><th className="p-3">Code</th><th className="p-3">Typ</th><th className="p-3">Einlösungen</th><th className="p-3">Status</th><th className="p-3">Aktion</th></tr>
          </thead>
          <tbody>
            {codes.map((item) => {
              const exhausted = item.max_uses !== null && item.used_count >= item.max_uses;
              return (
                <tr key={item.id} className="border-t border-border">
                  <td className="p-3 font-mono font-bold text-brand-ink">{item.code}</td>
                  <td className="p-3">{item.code_type === "beta_tester" ? "Beta-Tester" : item.code_type === "founder" ? "Founder" : "Pro"}</td>
                  <td className="p-3">{item.used_count} / {item.max_uses ?? "∞"}</td>
                  <td className="p-3"><span className={exhausted ? "font-bold text-muted-foreground" : "font-bold text-emerald-700"}>{exhausted ? "Eingelöst" : "Aktiv"}</span></td>
                  <td className="p-3"><Action variant="ghost" label="Löschen" onClick={async () => { await removeCode({ data: { id: item.id } }); toast.success("Code gelöscht."); await load(); }} /></td>
                </tr>
              );
            })}
            {!loading && codes.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Noch keine Codes vorhanden.</td></tr>}
            {loading && <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Codes werden geladen …</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AiConsoleTab() {
  const [command, setCommand] = useState("");
  const [logs, setLogs] = useState<string[]>([
    "KI-Konsole bereit.",
    "Die spätere eigene KI-Anbindung ist noch nicht verbunden. Befehle werden hier nicht ausgeführt.",
  ]);

  function run(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = command.trim();
    if (!trimmed) return;
    setLogs((current) => [
      ...current,
      `> ${trimmed}`,
      "Platzhalter: Für diese Konsole ist noch keine KI- oder Datenintegration konfiguriert.",
    ]);
    setCommand("");
  }

  return (
    <section className="space-y-3 rounded-2xl border border-border p-3">
      <div>
        <h3 className="font-bold text-brand-ink">Administrative KI-Konsole</h3>
        <p className="mt-1 text-xs text-muted-foreground">Nur die Oberfläche ist vorbereitet. Es werden keine externen KI-Schlüssel oder Datenquellen verwendet.</p>
      </div>
      <form onSubmit={run} className="flex flex-col gap-2 sm:flex-row">
        <input value={command} onChange={(event) => setCommand(event.target.value)} placeholder="z. B. Alle inaktiven Produkte auflisten" className="min-h-11 min-w-0 flex-1 rounded-xl border border-border bg-background px-3 text-sm" />
        <button type="submit" disabled={!command.trim()} className="min-h-11 rounded-full bg-brand px-5 text-sm font-bold text-primary-foreground disabled:opacity-50">Ausführen</button>
      </form>
      <pre aria-live="polite" className="min-h-36 whitespace-pre-wrap rounded-xl bg-slate-950 p-3 font-mono text-xs leading-relaxed text-emerald-300">{logs.join("\n\n")}</pre>
    </section>
  );
}

function Action({
  label,
  onClick,
  variant = "solid",
}: {
  label: string;
  onClick: () => Promise<void>;
  variant?: "solid" | "ghost" | "gold";
}) {
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await onClick();
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Aktion fehlgeschlagen");
        } finally {
          setBusy(false);
        }
      }}
      className={`min-h-11 rounded-full px-4 text-xs font-bold transition disabled:opacity-60 ${
        variant === "solid"
          ? "bg-brand text-primary-foreground"
          : variant === "gold"
          ? "bg-gold text-gold-foreground shadow-md"
          : "border border-border text-brand-ink hover:border-brand hover:text-brand"
      }`}
    >
      {label}
    </button>
  );
}

function SystemTab() {
  const getFn = useServerFn(getPlatformSettings);
  const setFn = useServerFn(setPhysicalEnabled);
  const [on, setOn] = useState<boolean | null>(null);
  const [notify, setNotify] = useState(true);
  const [busy, setBusy] = useState(false);
  useEffect(() => { getFn().then((r) => setOn(r.physicalEnabled)).catch(() => setOn(false)); }, [getFn]);
  if (on === null) return <div className="h-24 animate-pulse rounded-2xl bg-muted" />;
  async function toggle() {
    const next = !on;
    if (!confirm(next ? "Physische Produkte für alle freischalten?" : "Zurück auf nur digital?")) return;
    setBusy(true);
    try {
      const r = await setFn({ data: { enabled: next, notify } });
      setOn(next);
      toast.success(notify ? `Umgestellt – Patch-Note an ${r.sent} Nutzer gesendet.` : "Umgestellt.");
    } catch (e) { toast.error((e as Error).message); } finally { setBusy(false); }
  }
  return (
    <div className="space-y-3 rounded-3xl border border-border p-4">
      <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Plattform-Modus</div>
      <span className={`inline-flex rounded-full px-3 py-1 text-sm font-bold ${on ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground"}`}>{on ? "● Digital & Physisch aktiv" : "○ Nur digital"}</span>
      <label className="flex min-h-11 items-center gap-2 text-sm text-foreground">
        <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} />
        Patch-Note an alle Nutzer senden
      </label>
      <button type="button" disabled={busy} onClick={toggle} className="min-h-11 w-full rounded-full bg-brand px-4 text-sm font-bold text-primary-foreground disabled:opacity-60">
        {busy ? "Wird umgestellt …" : on ? "Auf nur digital zurückschalten" : "Physische Produkte freischalten"}
      </button>
    </div>
  );
}
