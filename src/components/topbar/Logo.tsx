import { Link } from "@tanstack/react-router";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      to="/"
      className="group flex shrink-0 items-center gap-2"
      aria-label="CreaHQ home"
    >
      <span className="relative grid h-9 w-9 place-items-center rounded-2xl bg-brand text-primary-foreground brand-glow transition-transform group-hover:[animation:wiggle_0.6s_ease-in-out]">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 4c-3 2-4 5-4 8s1 6 4 8" />
          <path d="M17 4c3 2 4 5 4 8s-1 6-4 8" />
          <circle cx="12" cy="12" r="2.5" fill="currentColor" />
        </svg>
      </span>
      {!compact && (
        <span className="font-display text-xl font-black tracking-tight text-brand-ink">
          Crea<span className="text-brand">HQ</span>
        </span>
      )}
    </Link>
  );
}
