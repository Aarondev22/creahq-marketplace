import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { X, GripHorizontal, Flag, ShieldCheck, Users, Package, Power, Crown } from "lucide-react";
import {
  listReports,
  resolveReport,
  listModerationQueue,
  moderateListing,
  searchUsers,
  banUser,
  toggleUserRole,
  setUserPro,
  listAllListings,
  setListingStatus,
  type AdminListingFull,
  type AdminReport,
  type AdminListing,
  type AdminUser,
  listVerifications,
  reviewVerification,
  type VerificationItem,
  getPlatformSettings,
  setPhysicalEnabled,
} from "@/lib/admin.functions";

// ... keep the rest of the file as-is

export function AdminPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [tab, setTab] = useState<Tab>("reports");
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [queue, setQueue] = useState<AdminListing[]>([]);
  const [verifs, setVerifs] = useState<VerificationItem[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [products, setProducts] = useState<AdminListingFull[]>([]);
  const [loading, setLoading] = useState(false);
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: 24, y: 80 });
  const drag = useRef<{ dx: number; dy: number } | null>(null);

  const proCount = users.filter((user) => user.is_pro).length;
  const getVerifs = useServerFn(listVerifications);
  const doVerify = useServerFn(reviewVerification);

  // ... existing logic remains unchanged

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
        <div className="inline-flex items-center gap-1 rounded-full bg-gold px-2.5 py-1 text-[10px] font-bold text-gold-foreground shadow-sm">
          <Crown className="h-3 w-3" /> {proCount} Pro
        </div>
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
          ["verify", "Echtheit", <ShieldCheck key="e" className="h-4 w-4" />],
          ["products", "Produkte", <Package key="d" className="h-4 w-4" />],
          ["users", "Nutzer", <Users key="c" className="h-4 w-4" />],
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
        ) : tab === "reports" ? (
          // existing reports list unchanged
          <></>
        ) : (
          <></>
        )}
      </div>
    </div>
  );
}

