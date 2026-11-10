import { Logo } from "@/components/topbar/Logo";
import { Github, Instagram, MessageCircle, Music2, Twitter, Youtube } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { siteConfig } from "@/lib/site-config";

type Item = { label: string; to: string; search?: Record<string, string> };

type SocialKey = keyof typeof siteConfig.socials;
type Social = { key: SocialKey; label: string; Icon: typeof Instagram };

const columns: { title: string; items: Item[] }[] = [
  {
    title: "Entdecken",
    items: [
      { label: "Stöbern", to: "/browse" },
      { label: "Kategorien", to: "/kategorien" },
    ],
  },
  {
    title: "Verkaufen",
    items: [
      { label: "Shop eröffnen", to: "/auth" },
      { label: "Gebühren", to: "/gebuehren" },
      { label: "Dashboard", to: "/dashboard" },
      { label: "Verkaufs-Guide", to: "/verkaufen/guide" },
    ],
  },
  {
    title: "Hilfe & Über",
    items: [
      { label: "Häufige Fragen", to: "/hilfe" },
      { label: "Kontakt", to: "/kontakt" },
      { label: "Über CreaHQ", to: "/ueber" },
    ],
  },
];

const legal: Item[] = [
  { label: "Impressum", to: "/impressum" },
  { label: "AGB", to: "/agb" },
  { label: "Datenschutz", to: "/datenschutz" },
  { label: "Cookies", to: "/cookies" },
  { label: "Regeln", to: "/regeln" },
];

const socialOptions: Social[] = [
  { key: "instagram", label: "Instagram", Icon: Instagram },
  { key: "tiktok", label: "TikTok", Icon: Music2 },
  { key: "youtube", label: "YouTube", Icon: Youtube },
  { key: "x", label: "X", Icon: Twitter },
  { key: "discord", label: "Discord", Icon: MessageCircle },
  { key: "github", label: "GitHub", Icon: Github },
];

export function Footer() {
  const socials = socialOptions
    .map(({ key, ...social }) => ({ ...social, href: siteConfig.socials[key].trim() }))
    .filter((social) => social.href.length > 0);

  return (
    <footer className="relative mt-20 overflow-hidden border-t border-border/70 bg-surface-warm/85 backdrop-blur">
      <span className="paint-splash -right-16 top-8 rotate-[22deg] bg-paint-cyan/15" aria-hidden="true" />
      <div className="relative mx-auto grid max-w-7xl gap-10 px-6 py-12 md:grid-cols-[1.1fr_2fr_1fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
            CreaHQ ist der Marktplatz für Sachen, die Creator selbst gemacht haben — digital, sofort, mit Charakter.
          </p>
          {socials.length > 0 && (
            <nav aria-label="CreaHQ auf Social Media" className="mt-5 flex flex-wrap gap-2">
              {socials.map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  title={label}
                  className="grid h-11 w-11 place-items-center rounded-full border border-border bg-card text-brand-ink transition hover:-translate-y-0.5 hover:border-brand hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
                >
                  <Icon aria-hidden="true" className="h-4 w-4" />
                </a>
              ))}
            </nav>
          )}
        </div>

        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          {columns.map((col) => (
            <div key={col.title}>
              <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-brand">{col.title}</h2>
              <ul className="space-y-2">
                {col.items.map((item) => (
                  <li key={item.label}>
                    <Link
                      to={item.to}
                      search={item.search as never}
                      className="inline-flex min-h-8 items-center text-sm text-muted-foreground transition-colors hover:text-brand-ink focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div>
          <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-brand">Rechtliches</h2>
          <ul className="space-y-2">
            {legal.map((item) => (
              <li key={item.label}>
                <Link
                  to={item.to}
                  className="inline-flex min-h-8 items-center text-sm text-muted-foreground transition-colors hover:text-brand-ink focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-2 px-6 py-5 text-xs text-muted-foreground sm:flex-row sm:items-center">
          <div>© {new Date().getFullYear()} {siteConfig.brand.name}. {siteConfig.brand.tagline}</div>
          <div>{siteConfig.brand.footerNote}</div>
        </div>
      </div>
    </footer>
  );
}
