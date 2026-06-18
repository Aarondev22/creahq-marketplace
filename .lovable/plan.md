
# CreaHQ — Lean MVP mit verspielter Interaktion

Multi-Vendor-Marktplatz für digitale Produkte & Services. Helles Off-White mit **Lila als Markenfarbe**, stark interaktive Oberfläche mit Mini-Games und KI-Spielereien. Verkäufer regeln Versand/Erfüllung selbst.

## Topbar (global, sticky)

```text
[☰ Burger]  [🟣 CreaHQ]   [────── Suchleiste ──────]   [🔔]  [👤]
```

- **Burger links**: Slide-in Panel mit Kategorien, Themenwelten, Sprache (öffnet Flag-Draw), Light/Dark, Legal-Links.
- **CreaHQ-Logo**: lila Wortmarke + Symbol; Klick → Startseite, leichtes Hover-Wiggle.
- **Suche mittig**: Volltext, Live-Vorschläge, Icon-Button öffnet **Doodle-Search**. Mobile: Icon, das ein Vollbild-Overlay öffnet.
- **Glocke**: Notifications (neue Bestellung / Download bereit), ungelesen-Badge.
- **Profil**: Avatar-Dropdown — eingeloggt: Dashboard, Käufe, Verkaufen, Profil, Logout. Ausgeloggt: Anmelden / Registrieren.

## Landing Page (`/`)

Tonfall: **~70 % „Werde Käufer / entdecke Sachen", ~30 % „Mach deinen eigenen Shop auf"**. Reihenfolge von oben nach unten:

### 1. Hero mit Kurz-Erklärer + Theme-Shuffle

- Große verspielte Headline, daneben/dadurch verlaufende Theme-Plättchen (Drag-and-Drop, Farben/Schrift ändern sich live).
- 2–3 Zeilen Subtext, der erklärt, **was CreaHQ ist**: „Marktplatz von Creatorn für digitale Produkte und Services — entdecken, sammeln, weitermachen."
- **Primary CTA: „Jetzt entdecken"** → springt zu den Sektionen / Browse.
- **Sekundär klein: „Eigenen Shop eröffnen"** → führt zu Sign-up mit Seller-Flag.

### 2. Entdecker-Sektionen (Etsy-Style)

Mehrere horizontal scrollbare Schienen, jede mit eigener Stimmung. **Im aktuellen leeren Zustand** zeigt jede Schiene einen freundlichen, leicht augenzwinkernden Empty-State an der Stelle, wo später Produkte stehen — z. B. „Hier wohnen bald die 20 beliebtesten Sachen. Aktuell ist es noch ganz still." mit einem kleinen animierten Platzhalter (z. B. wackelnde leere Kiste, oder gestrichelte Produktkarten mit „bald hier").

Geplante Schienen (alle vorbereitet, Empty-State aktiv):

- **Top 20 gerade beliebt**
- **Perfekt für daheim**
- **Frisch reingekommen**
- **Versteckte Perlen**
- **Von der Community kuratiert**

Jede Sektion hat eine Überschrift, einen Untertitel und einen „Alle ansehen"-Link nach `/browse?section=...`.

### 3. Verkäufer-Einladung (~30 % Block)

Schmaleres Band weiter unten: „Du machst selbst Sachen? Öffne in 2 Minuten deinen Shop." Mit Mini-Illustration und CTA → Sign-up (Seller). Bewusst kleiner und weiter unten als die Käufer-Reise.

### 4. FAQ — verstreut, nicht gestapelt

5 Fragen, die als **gestreute, leicht rotierte Karten** auf einer Fläche schweben (Sticker-Board-Look): unterschiedliche Größen, Drehwinkel, Lila-Schattierungen. Hover hebt die Karte an. Beim Klick fährt sie groß in die Mitte und zeigt die Antwort.

Beispielfragen (final-redigieren wir später, hier als Platzhalter):

1. Was ist CreaHQ überhaupt?
2. Wer verkauft hier?
3. Wie bekomme ich meine gekauften Sachen?
4. Was kostet das Verkaufen?
5. Wie sicher ist der Kauf?

### 5. Footer

- Linke Seite: kleine lila Wortmarke + ein-Satz-Claim.
- Mittig: Link-Spalten **Entdecken / Verkaufen / Hilfe / Über uns** — Links sind **Platzhalter (`href="#"`) ohne Ziel**, wie gewünscht.
- Rechts: **Rechtliches** (Impressum, AGB, Datenschutz, Cookies) — ebenfalls Platzhalter, vorerst ohne echte Zielseiten.
- Untere Linie: Copyright + Social-Icons (auch Platzhalter).

## Was den Marktplatz besonders macht

Statt langweiliger Settings hat CreaHQ einen „Playful Layer": kleine Spiele und Gesten ersetzen Standard-Interaktionen. Klassischer Fallback ist immer einen Klick entfernt.

### Mini-Game-Katalog

1. **Flag-Draw Sprachwahl** — Canvas-Modal aus dem Burger. Gemini Vision erkennt die gemalte Flagge → schlägt Sprache vor → User bestätigt. Fallback: Dropdown im selben Modal.
2. **Theme-Shuffle Hero** — Drag-and-Drop von Theme-Plättchen verändert Hero live; State in localStorage.
3. **Kategorie-Karussell als Regal** — Karten zum Wegschnipsen (Spring-Animation), Auswahl springt in Browse.
4. **Doodle-Search** — Icon in der Suche öffnet Sketch-Pad, KI extrahiert Keywords.
5. **Profil-Avatar-Stempel** — Avatar aus Formen/Farben stempeln (Foto-Upload bleibt parallel).

(1)–(3) MVP-Pflicht, (4)–(5) „if time".

### Animations-Layer

Framer Motion: Page-Transitions, hover-scale, parallax-Cursor-Trails auf Landing, Spring-Easing, Scroll-Reveals. `prefers-reduced-motion` respektieren; alle Mini-Games haben Button-Fallback.

## Scope (drin)

- Auth (Email/Passwort + Google), Rollen `buyer`/`seller` kombinierbar.
- Creator-Profile mit Branding-Anpassung (Akzentfarbe, Cover, Banner, Hero-Theme).
- Listings: digital (Download nach Kauf) und Services (Erfüllung außerhalb, Email-Kontakt).
- Browsing: Landing wie oben, Browse/Suche, Listing-Detail, Creator-Shop.
- Checkout via Lovable Stripe Payments + Webhook. Single-Account, manuelle Auszahlung.
- Dashboard: Listings-CRUD, eingegangene Bestellungen mit Fulfill-Status, eigene Käufe + signierte Downloads, Profil/Branding, Notifications.
- KI-Endpunkte server-side: `recognizeFlag`, `classifyDoodle`.
- Footer-Platzhalterlinks ohne Ziel, **keine** echten Rechtsseiten im ersten Wurf.

## Out of Scope

- Physische Produkte, Versand, Shopify
- Stripe Connect, Auto-Payouts, Provisionsabrechnung
- Reviews, Käufer↔Verkäufer-Chat, Admin-Moderation, Analytics
- Voll ausgebaute Mehrsprachigkeit (MVP: DE/EN umschaltbar)
- Tatsächliche Rechtstexte (nur Platzhalter-Links)

## Technische Architektur

Stack: TanStack Start, Lovable Cloud (Supabase), Lovable Stripe Payments, Lovable AI Gateway (Gemini Flash), Framer Motion.

### Routes

```text
src/routes/
  __root.tsx                       Topbar + Footer + Outlet
  index.tsx                        Landing (Hero, Sektionen, Seller-Block, FAQ)
  browse.tsx                       Suche/Filter (?section=, ?q=, ?cat=)
  listing.$id.tsx
  shop.$handle.tsx
  auth.tsx
  checkout.success.tsx
  _authenticated/
    route.tsx                      (integration-managed)
    dashboard.tsx
    dashboard.listings.tsx
    dashboard.listings.new.tsx
    dashboard.listings.$id.edit.tsx
    dashboard.orders.tsx
    dashboard.purchases.tsx
    dashboard.profile.tsx
    notifications.tsx
  api/public/webhooks/stripe.ts
```

### Komponenten

```text
src/components/
  topbar/  Topbar, BurgerMenu, SearchBar, NotificationsBell, ProfileMenu, Logo
  landing/ Hero, ExplainerCopy, DiscoverRail (mit EmptyState), SellerInvite, FaqStickerBoard, FaqCard
  footer/  Footer, FooterLinks (Platzhalter)
  playful/ FlagDrawModal, ThemeShuffle, CategoryShelf, DoodleSearch?, AvatarStamp?
```

### Design-Tokens (`src/styles.css`, Tailwind v4 `@theme`)

- `--brand-purple`, `--brand-purple-soft`, `--brand-ink`, `--surface` (Off-White), `--surface-warm`.
- Custom Display-Font für Headlines + cleane Sans für Body via `<link>` im `__root.tsx`.

### Datenmodell (Supabase)

- `profiles`, `app_role` + `user_roles` + `has_role`, `listings`, `orders`, `order_items`, `notifications`. Storage: `avatars`, `covers`, `listing-images` (public), `digital-files` (private). Explizite GRANTs + RLS wie zuvor.

### Server-Funktionen

- `recognizeFlag`, `classifyDoodle`, `createCheckoutSession`, Stripe-Webhook, `upsertListing`, `deleteListing`, `getMyPurchases`, `getMySalesOrders`, `signDigitalDownloadUrl`, `getMyNotifications`, `markNotificationRead`. Public: `getPublicShop`, `getListing`, `searchListings` über Server-Publishable-Client. Sektions-Endpunkt `getDiscoverSection(name)` mit konsistenter Empty-State-Antwort, damit das UI immer dieselbe Logik fährt.

## Reihenfolge der Umsetzung

1. Lovable Cloud aktivieren; Auth (Email + Google); Profile + Trigger; Rollen.
2. Design-Tokens (Lila + Off-White), Topbar im `__root.tsx`, Footer mit Platzhalter-Links. Framer Motion aufsetzen.
3. Landing: Hero mit Erklärer + Theme-Shuffle, Discover-Rails mit Empty-States, Seller-Invite-Block, FAQ-Sticker-Board.
4. Listings-CRUD im Dashboard + Storage.
5. Browse/Search verdrahtet mit Topbar-Suche; Listing-Detail; Creator-Shop.
6. Stripe Payments aktivieren; Checkout + Webhook + Success + Käufer/Verkäufer-Ansichten + signierte Downloads.
7. Notifications + Glocke verdrahten.
8. Mini-Games: FlagDrawModal aus Burger, optional DoodleSearch + AvatarStamp.
9. SEO/OG-Tags pro Route, Polish + `prefers-reduced-motion`-Pass.

## Offene Punkte

- Logo: hochgeladene Datei oder soll ich eine lila Wortmarke „CreaHQ" als SVG selbst bauen?
- Plattformgebühr im MVP: 0 % + manuelle Auszahlung — bestätigt?
- Sprachen: nur DE/EN umschaltbar — bestätigt?
