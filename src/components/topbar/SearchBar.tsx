import { Link, useNavigate } from "@tanstack/react-router";
import { Search, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DoodleSearch } from "@/components/DoodleSearch";

type Result = { id: string; title: string; price_cents: number; cover_url: string | null };

export function SearchBar() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [open, setOpen] = useState(false);
  const [doodleOpen, setDoodleOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!q.trim()) { setResults([]); return; }
    const t = setTimeout(async () => {
      const like = `%${q.replace(/[%_]/g, "")}%`;
      const { data } = await supabase
        .from("listings")
        .select("id,title,price_cents,cover_url")
        .eq("status", "published")
        .or(`title.ilike.${like},description.ilike.${like},category.ilike.${like}`)
        .limit(6);
      setResults(data ?? []);
    }, 180);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div ref={wrap} className="relative w-full">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setOpen(false);
          navigate({ to: "/browse", search: { q } as never });
        }}
        className="group relative flex h-11 w-full items-center gap-2 rounded-full border border-border bg-card pl-4 pr-1 shadow-sm transition-all focus-within:border-brand focus-within:brand-glow"
      >
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Such nach Mustern, Presets, Sounds, Services …"
          className="min-w-0 flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
        <button
          type="button"
          title="Lieber kritzeln statt tippen"
          className="hidden h-9 shrink-0 items-center gap-1.5 rounded-full bg-brand-soft px-3 text-xs font-semibold text-brand-ink transition-colors hover:bg-brand hover:text-primary-foreground sm:flex"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Doodle
        </button>
      </form>
      {open && q.trim() && (
        <div className="absolute left-0 right-0 top-12 z-50 overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
          {results.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              Noch nichts gefunden — drück Enter, um trotzdem zu stöbern.
            </div>
          ) : (
            <ul className="max-h-96 overflow-y-auto">
              {results.map((r) => (
                <li key={r.id}>
                  <Link
                    to="/listing/$id"
                    params={{ id: r.id }}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-brand-soft"
                  >
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-brand-soft to-amber-100/40">
                      {r.cover_url && <img src={r.cover_url} alt="" className="h-full w-full object-cover" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-brand-ink">{r.title}</div>
                    </div>
                    <span className="text-xs font-bold text-brand">{(r.price_cents/100).toFixed(2)} €</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
