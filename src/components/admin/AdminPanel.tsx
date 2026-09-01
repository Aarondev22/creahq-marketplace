import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { X, GripHorizontal, Flag, ShieldCheck, Users } from "lucide-react";
import {
  listReports,
  resolveReport,
  listModerationQueue,
  moderateListing,
  searchUsers,
  banUser,
  toggleUserRole,
  type AdminReport,
  type AdminListing,
  type AdminUser,
} from "@/lib/admin.functions";

type Tab = "reports" | "queue" | "users";
const POS_KEY = "creahq.adminPanel.pos";

export function AdminPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [tab, setTab] = useState<Tab>("reports");
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [queue, setQueue] = useState<AdminListing[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [q, setQ] = useState("");
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
      else setUsers(await findUsers({ data: { q } }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Laden fehlgeschlagen");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, q]);

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

      <div className="flex gap-1.5 border-b border-border px-3 py-2">
        {([
          ["reports", "Meldungen", <Flag key="a" className="h-4 w-4" />],
          ["queue", "Moderation", <ShieldCheck key="b" className="h-4 w-4" />],
          ["users", "Nutzer", <Users key="c" className="h-4 w-4" />],
        ] as [Tab, string, React.ReactNode][]).map(([key, label, icon]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-full px-3 text-xs font-bold transition ${
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
        ) : tab === "reports" ? (
          reports.length === 0 ? (
            <Empty text="Keine Meldungen – alles ruhig. 🎉" />
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
            <Empty text="Keine Produkte in der Warteschlange. ✅" />
          ) : (
            <ul className="space-y-2">
              {queue.map((l) => (
                <li key={l.id} className="flex items-center gap-3 rounded-2xl border border-border p-3">
                  <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-brand-soft">
                    {l.cover_url ? <img src={l.cover_url} alt="" className="h-full w-full object-cover" /> : "📦"}
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
                    <p className="text-sm font-bold text-brand-ink">{u.display_name ?? "Ohne Namen"}</p>
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

function Action({
  label,
  onClick,
  variant = "solid",
}: {
  label: string;
  onClick: () => Promise<void>;
  variant?: "solid" | "ghost";
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
          : "border border-border text-brand-ink hover:border-brand hover:text-brand"
      }`}
    >
      {label}
    </button>
  );
}
