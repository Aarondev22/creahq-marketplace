import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Topbar } from "@/components/topbar/Topbar";
import { Footer } from "@/components/footer/Footer";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen flex-col">
      <Topbar />
      <div className="flex flex-1 items-center justify-center px-4 py-20">
        <div className="max-w-md text-center">
          <h1 className="font-display text-8xl font-black text-brand">404</h1>
          <h2 className="mt-4 font-display text-2xl font-bold text-brand-ink">Hier wohnt noch nichts</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Die Seite gibt's nicht — oder noch nicht. Probier's auf der Startseite.
          </p>
          <div className="mt-6">
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-full bg-brand px-6 py-3 text-sm font-bold text-primary-foreground brand-glow transition-transform hover:scale-105"
            >
              Zur Startseite
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-2xl font-bold text-brand-ink">
          Das hat nicht geklappt.
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Bei uns ist was schiefgelaufen. Versuch's nochmal oder zurück zur Startseite.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="inline-flex items-center justify-center rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-primary-foreground transition-transform hover:scale-105"
          >
            Nochmal versuchen
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold text-brand-ink transition-colors hover:bg-brand-soft"
          >
            Zur Startseite
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "CreaHQ — Marktplatz für Creator-Sachen" },
      { name: "description", content: "Verspielter Marktplatz für digitale Produkte und Services von echten Creatorn. Stöbern, kaufen, runterladen — oder selbst Shop eröffnen." },
      { name: "author", content: "CreaHQ" },
      { property: "og:title", content: "CreaHQ — Marktplatz für Creator-Sachen" },
      { property: "og:description", content: "Verspielter Marktplatz für digitale Produkte und Services. Mach deins. Find ihres." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,700;9..144,900&family=Inter:wght@400;500;600;700;800&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="de">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex min-h-screen flex-col bg-surface">
        <Topbar />
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
      </div>
    </QueryClientProvider>
  );
}
