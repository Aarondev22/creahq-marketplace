import { Logo } from "@/components/topbar/Logo";
import { Instagram, Twitter, Youtube, Github } from "lucide-react";
import { Link } from "@tanstack/react-router";

type Item = { label: string; to: string; search?: Record<string, string> };

const columns: { title: string; items: Item[] }[] = [
  { title: "Entdecken", items: [
    { label: "Stöbern", to: "/browse" },
    { label: "Top 20", to: "/browse", search: { q: "" } },
    { label: "Frisch da", to: "/browse", search: { q: "" } },
    { label: "Kategorien", to: "/kategorien" },
  ]},
  { title: "Verkaufen", items: [
    { label: "Shop eröffnen", to: "/auth" },
    { label: "Gebühren", to: "/gebuehren" },
    { label: "Dashboard", to: "/dashboard" },
  ]},
  { title: "Hilfe", items: [
    { label: "FAQ", to: "/hilfe" },
    { label: "Kontakt", to: "/kontakt" },
  ]},
  { title: "Über", items: [
    { label: "Über CreaHQ", to: "/ueber" },
  ]},
];

const legal: Item[] = [
  { label: "Impressum", to: "/impressum" },
  { label: "AGB", to: "/agb" },
  { label: "Datenschutz", to: "/datenschutz" },
  { label: "Cookies", to: "/cookies" },
];

const socials = [
  { Icon: Instagram, href: "https://instagram.com", label: "Instagram" },
  { Icon: Twitter, href: "https://twitter.com", label: "Twitter" },
  { Icon: Youtube, href: "https://youtube.com", label: "YouTube" },
  { Icon: Github, href: "https://github.com", label: "GitHub" },
];

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border bg-surface-warm">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 md:grid-cols-[1.2fr_2.5fr_1fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
            CreaHQ ist der Marktplatz für Sachen, die Creator selbst gemacht haben — digital, sofort, mit Charakter.
          </p>
          <div className="mt-5 flex gap-2">
            {socials.map(({ Icon, href, label }) => (
              <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label} className="grid h-9 w-9 place-items-center rounded-full border border-border bg-card text-brand-ink transition-colors hover:bg-brand hover:text-primary-foreground">
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {columns.map((col) => (
            <div key={col.title}>
              <div className="mb-3 text-xs font-bold uppercase tracking-widest text-brand">{col.title}</div>
              <ul className="space-y-2">
                {col.items.map((l) => (
                  <li key={l.label}>
                    <Link to={l.to} search={l.search as never} className="text-sm text-muted-foreground transition-colors hover:text-brand-ink">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div>
          <div className="mb-3 text-xs font-bold uppercase tracking-widest text-brand">Rechtliches</div>
          <ul className="space-y-2">
            {legal.map((l) => (
              <li key={l.label}>
                <Link to={l.to} className="text-sm text-muted-foreground transition-colors hover:text-brand-ink">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-2 px-6 py-5 text-xs text-muted-foreground sm:flex-row sm:items-center">
          <div>© {new Date().getFullYear()} CreaHQ. Mit ♥ in der Werkstatt zusammengebaut.</div>
          <div>Made for Creators. Powered by Coffee.</div>
        </div>
      </div>
    </footer>
  );
}
