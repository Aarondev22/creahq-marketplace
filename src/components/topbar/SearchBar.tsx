import { useNavigate } from "@tanstack/react-router";
import { Search, Sparkles } from "lucide-react";
import { useState } from "react";

export function SearchBar() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        navigate({ to: "/browse", search: { q } as never });
      }}
      className="group relative flex h-11 w-full items-center gap-2 rounded-full border border-border bg-card pl-4 pr-1 shadow-sm transition-all focus-within:border-brand focus-within:brand-glow"
    >
      <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
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
  );
}
