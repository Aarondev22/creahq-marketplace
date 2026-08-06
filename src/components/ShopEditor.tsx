import { useEffect, useMemo, useRef, useState } from "react";
import { ImagePlus, Check, Store, ArrowUp, ArrowDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const SIGNED_TTL = 60 * 60 * 24 * 365;

type SectionKey = "highlight" | "listings";
const SECTION_LABEL: Record<SectionKey, string> = {
  highlight: "⭐ Highlight-Produkt",
  listings: "🪟 Schaufenster (alle Produkte)",
};

type MyListing = { id: string; title: string };

export function ShopEditor({ userId }: { userId: string }) {
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [sections, setSections] = useState<SectionKey[]>(["highlight", "listings"]);
  const [highlight, setHighlight] = useState<string>("");
  const [listings, setListings] = useState<MyListing[]>([]);
  const [handle, setHandle] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<"avatar" | "banner" | null>(null);
  const avatarInput = useRef<HTMLInputElement>(null);
  const bannerInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      const { data: p } = await supabase
        .from("profiles")
        .select("bio,avatar_url,banner_url,shop_sections,highlight_listing_id,handle,display_name")
        .eq("id", userId)
        .maybeSingle();
      if (p) {
        setBio(p.bio ?? "");
        setAvatarUrl(p.avatar_url ?? null);
        setBannerUrl(p.banner_url ?? null);
        setHandle(p.handle ?? null);
        setDisplayName(p.display_name ?? "");
        const s = (p.shop_sections as string[] | null) ?? [];
        if (s.length > 0) setSections(s.filter((x): x is SectionKey => x === "highlight" || x === "listings"));
        setHighlight(p.highlight_listing_id ?? "");
      }
      const { data: ls } = await supabase
        .from("listings")
        .select("id,title")
        .eq("seller_id", userId)
        .order("created_at", { ascending: false })
        .limit(50);
      setListings((ls ?? []) as MyListing[]);
      setLoading(false);
    })();
  }, [userId]);

  async function upload(kind: "avatar" | "banner", file: File) {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Bitte ein Bild unter 5 MB wählen.");
      return;
    }
    setUploading(kind);
    try {
      const bucket = kind === "avatar" ? "avatars" : "shop-banners";
      const path = `${userId}/${crypto.randomUUID()}-${file.name.replace(/[^\w.-]/g, "_")}`;
      const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: false });
      if (error) throw error;
      const { data: signed } = await supabase.storage.from(bucket).createSignedUrl(path, SIGNED_TTL);
      if (!signed?.signedUrl) throw new Error("Bild-URL konnte nicht erstellt werden.");
      if (kind === "avatar") setAvatarUrl(signed.signedUrl);
      else setBannerUrl(signed.signedUrl);
      toast.success(kind === "avatar" ? "Profilbild geladen 🎉" : "Banner geladen 🎉");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload fehlgeschlagen");
    } finally {
      setUploading(null);
    }
  }

  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= sections.length) return;
    const arr = [...sections];
    [arr[i], arr[j]] = [arr[j], arr[i]];
    setSections(arr);
  }

  async function save() {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          bio: bio.trim() || null,
          avatar_url: avatarUrl,
          banner_url: bannerUrl,
          shop_sections: sections,
          highlight_listing_id: highlight || null,
        })
        .eq("id", userId);
      if (error) throw error;
      window.dispatchEvent(new CustomEvent("creahq:profile-updated", { detail: { avatar_url: avatarUrl } }));
      toast.success("Shop gespeichert! 🛍️");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Speichern fehlgeschlagen");
    } finally {
      setSaving(false);
    }
  }

  const initial = useMemo(() => (displayName || handle || "?").slice(0, 1).toUpperCase(), [displayName, handle]);

  if (loading) {
    return <div className="mt-6 h-56 animate-pulse rounded-3xl bg-brand-soft/50" />;
  }

  return (
    <section className="mt-6 space-y-5 rounded-3xl border border-border bg-card p-6 sm:p-8">
      <h2 className="inline-flex items-center gap-2 font-display text-2xl font-black text-brand-ink">
        <Store className="h-6 w-6" /> Shop gestalten
      </h2>
      <p className="-mt-2 text-sm text-muted-foreground">Banner, Profilbild, Bio und Reihenfolge deiner Abschnitte.</p>

      {/* Vorschau */}
      <div className="overflow-hidden rounded-3xl border border-border">
        <div className="relative h-28 bg-gradient-to-br from-brand-soft via-brand/20 to-amber-100/60 sm:h-36">
          {bannerUrl && <img src={bannerUrl} alt="" className="h-full w-full object-cover" />}
        </div>
        <div className="flex items-end gap-4 bg-card p-4">
          <div className="-mt-12 grid h-20 w-20 place-items-center overflow-hidden rounded-3xl border-4 border-card bg-gradient-to-br from-brand to-brand-ink text-2xl font-black text-primary-foreground">
            {avatarUrl ? <img src={avatarUrl} alt="" className="h-full w-full object-cover" /> : initial}
          </div>
          <div className="min-w-0">
            <p className="font-display text-lg font-black text-brand-ink">{displayName || "Dein Shop"}</p>
            <p className="text-xs text-muted-foreground">@{handle ?? "handle"}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => avatarInput.current?.click()}
          disabled={uploading !== null}
          className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-brand/40 bg-brand-soft/40 px-4 text-sm font-bold text-brand-ink hover:border-brand"
        >
          {uploading === "avatar" ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5 text-brand" />}
          Profilbild wählen
        </button>
        <input
          ref={avatarInput}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void upload("avatar", f);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          onClick={() => bannerInput.current?.click()}
          disabled={uploading !== null}
          className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-brand/40 bg-brand-soft/40 px-4 text-sm font-bold text-brand-ink hover:border-brand"
        >
          {uploading === "banner" ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5 text-brand" />}
          Banner wählen
        </button>
        <input
          ref={bannerInput}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void upload("banner", f);
            e.target.value = "";
          }}
        />
      </div>

      <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground">
        Bio
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={4}
          maxLength={600}
          placeholder="Erzähl kurz, was dein Shop macht …"
          className="mt-1.5 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-brand-ink focus:border-brand focus:outline-none"
        />
      </label>

      <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground">
        Highlight-Produkt
        <select
          value={highlight}
          onChange={(e) => setHighlight(e.target.value)}
          className="mt-1.5 min-h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm font-semibold text-brand-ink focus:border-brand focus:outline-none"
        >
          <option value="">— kein Highlight —</option>
          {listings.map((l) => (
            <option key={l.id} value={l.id}>
              {l.title}
            </option>
          ))}
        </select>
      </label>

      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">Reihenfolge der Abschnitte</p>
        <ul className="space-y-2">
          {sections.map((s, i) => (
            <li key={s} className="flex items-center justify-between gap-2 rounded-2xl border border-border bg-surface px-4 py-3">
              <span className="text-sm font-bold text-brand-ink">{SECTION_LABEL[s]}</span>
              <span className="flex gap-1">
                <button
                  type="button"
                  aria-label="nach oben"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  className="grid h-11 w-11 place-items-center rounded-xl bg-card disabled:opacity-30"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label="nach unten"
                  onClick={() => move(i, 1)}
                  disabled={i === sections.length - 1}
                  className="grid h-11 w-11 place-items-center rounded-xl bg-card disabled:opacity-30"
                >
                  <ArrowDown className="h-4 w-4" />
                </button>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="inline-flex min-h-12 items-center gap-2 rounded-full bg-brand px-6 text-sm font-bold text-primary-foreground brand-glow disabled:opacity-60"
        >
          <Check className="h-4 w-4" /> {saving ? "Speichere …" : "Shop speichern"}
        </button>
        {handle && (
          <a
            href={`/shop/${handle}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-12 items-center rounded-full border border-border px-6 text-sm font-bold text-brand-ink hover:bg-brand-soft/60"
          >
            So sieht mein Shop aus ↗
          </a>
        )}
      </div>
    </section>
  );
}
