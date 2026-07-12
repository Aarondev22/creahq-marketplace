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
