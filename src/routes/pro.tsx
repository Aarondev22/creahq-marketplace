import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Crown, Sparkles, Store } from "lucide-react";

export const Route = createFileRoute("/pro")({
  head: () => ({
    meta: [
      { title: "CreaHQ Pro — Mehr Möglichkeiten für deinen Shop" },
      { name: "description", content: "Vergleiche CreaHQ Standard und Pro für Creator-Shops." },
    ],
  }),
  component: ProPage,
});

const plans = [
  {
    name: "CreaHQ Standard",
    price: "Kostenlos",
    description: "Alles, um deinen Shop aufzubauen und Produkte zu verkaufen.",
    icon: Store,
    features: [
      "17 % Startprovision (mindestens 0,70 €)",
      "Bis zu 8 Produktbilder",
      "Basis-Shop-Design",
      "HTML/CSS-Editor",
    ],
    pro: false,
  },
  {
    name: "CreaHQ Pro",
    price: "4,99 €",
    period: "pro Monat",
    description: "Mehr Sichtbarkeit und erweiterte Gestaltungsmöglichkeiten.",
    icon: Crown,
    features: [
      "16 % Provision (1 Prozentpunkt günstiger, mindestens 0,70 €)",
      "Pro-Spotlight für bessere Sichtbarkeit in der Suche",
      "Bis zu 15 Produktbilder",
      "Visueller Baukasten und Code-Option",
      "10 Animationen",
      "Bis zu 5 exklusive Shop-Badges",
      "Goldenes Pro-Badge am Shop",
    ],
    pro: true,
  },
];

function ProPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <header className="mx-auto max-w-2xl text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-soft text-brand">
          <Sparkles className="h-7 w-7" />
        </div>
        <h1 className="mt-5 font-display text-4xl font-black text-brand-ink sm:text-5xl">Der passende Plan für deinen Shop</h1>
        <p className="mt-3 text-base text-muted-foreground">Starte kostenlos und erweitere deinen Shop, wenn du mehr Gestaltung und Sichtbarkeit brauchst.</p>
      </header>

      <section aria-label="Tarife vergleichen" className="mt-10 grid gap-5 md:grid-cols-2">
        {plans.map((plan) => {
          const Icon = plan.icon;
          return (
            <article key={plan.name} className={`rounded-3xl border bg-card p-6 shadow-sm sm:p-8 ${plan.pro ? "border-brand ring-2 ring-brand/20" : "border-border"}`}>
              <div className="flex items-center gap-3">
                <span className={`grid h-12 w-12 place-items-center rounded-2xl ${plan.pro ? "bg-gold/20 text-gold-foreground" : "bg-brand-soft text-brand"}`}>
                  <Icon className="h-6 w-6" />
                </span>
                <div>
                  <h2 className="font-display text-xl font-black text-brand-ink">{plan.name}</h2>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                </div>
              </div>
              <p className="mt-7 font-display text-3xl font-black text-brand-ink">
                {plan.price}
                {plan.period && <span className="ml-2 text-sm font-medium text-muted-foreground">{plan.period}</span>}
              </p>
              <ul className="mt-6 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-2 text-sm text-brand-ink">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                    {feature}
                  </li>
                ))}
              </ul>
              {plan.pro && (
                <div className="mt-8">
                  <Link to="/redeem" className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-brand px-6 text-sm font-bold text-primary-foreground transition hover:opacity-90">
                    Jetzt Pro aktivieren
                  </Link>
                  <p className="mt-3 text-center text-xs text-muted-foreground">Zahlungsanbindung im Beta-Modus. Tester können Pro über einen Aktionscode aktivieren.</p>
                </div>
              )}
            </article>
          );
        })}
      </section>
    </main>
  );
}
