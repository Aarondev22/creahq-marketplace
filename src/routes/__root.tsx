import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useLocation,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Topbar } from "@/components/topbar/Topbar";
import { Footer } from "@/components/footer/Footer";
import { Toaster } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import { SiteTranslator } from "@/components/SiteTranslator";
import { CartProvider } from "@/lib/cart";

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

function ErrorComponent({ error, reset }: { error: unknown; reset: () => void }) {
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
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

const THEME_BOOT = `(function(){try{var r=document.documentElement;
var themes={candy:['oklch(0.62 0.24 340)','oklch(0.74 0.2 340)','oklch(0.93 0.06 340)','oklch(0.3 0.1 340)'],
sun:['oklch(0.7 0.18 55)','oklch(0.78 0.16 60)','oklch(0.94 0.07 70)','oklch(0.32 0.09 55)'],
forest:['oklch(0.55 0.16 150)','oklch(0.72 0.16 150)','oklch(0.93 0.06 150)','oklch(0.3 0.09 150)'],
ocean:['oklch(0.58 0.16 230)','oklch(0.72 0.16 230)','oklch(0.93 0.06 230)','oklch(0.3 0.1 230)'],
violet:['oklch(0.52 0.22 295)','oklch(0.7 0.2 295)','oklch(0.92 0.06 295)','oklch(0.3 0.1 295)']};
var t=localStorage.getItem('creahq:hero-theme')||'violet';if(!themes[t])t='violet';
var m=localStorage.getItem('creahq:mode')==='dark'?'dark':'light';
var b=localStorage.getItem('creahq:theme-backgrounds');
r.classList.toggle('dark',m==='dark');
r.dataset.creahqTheme=t;
r.dataset.themeBackgrounds=b==='off'?'off':'on';
var c=themes[t];
r.style.setProperty('--brand',m==='dark'?c[1]:c[0]);
r.style.setProperty('--brand-soft',m==='dark'?c[3]:c[2]);
}catch(e){}})();`;

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="de" suppressHydrationWarning>
      <head>
        <HeadContent />
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT }} />
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
  const router = useRouter();
  const location = useLocation();
  const isHome = location.pathname === "/";

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      router.invalidate();
      if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
    });
    return () => sub.subscription.unsubscribe();
  }, [router, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <CartProvider>
        <div className={`app-canvas flex min-h-screen flex-col ${isHome ? "is-home" : "is-inner-page"}`}>
          <Topbar />
          <main className="relative z-0 flex-1">
            {!isHome && (
              <div className="theme-scenery" aria-hidden="true">
                <span className="theme-motif motif-one" />
                <span className="theme-motif motif-two" />
                <span className="theme-motif motif-three" />
                <span className="theme-motif motif-four" />
                <span className="paint-splash splash-one" />
                <span className="paint-splash splash-two" />
                <span className="paint-splash splash-three" />
              </div>
            )}
            <Outlet />
          </main>
          <Footer />
          <Toaster />
          <SiteTranslator />
        </div>
      </CartProvider>
    </QueryClientProvider>
  );
}
