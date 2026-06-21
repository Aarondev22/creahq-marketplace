# Großer Ausbau — alles am Stück

## Was du jetzt schon kannst
Ja, du kannst dich **schon hier im Preview** anmelden — Profil-Icon oben rechts → "Anmelden". Veröffentlichen ist nicht nötig. Sobald du deine E-Mail nennst, hängt die DB an: dieses Konto = Founder + Admin, ab Login automatisch.

---

## 1. Founder-Badge & Admin-Panel

- Neue Rolle `founder` in der `app_role`-Enum. Trigger: wenn sich jemand mit **deiner E-Mail** registriert, kriegt das Konto sofort `founder` + `admin`.
- **Founder-Badge** überall wo dein Name auftaucht (Chat, Shop-Profil, Listing-Kommentare): kleines lila Abzeichen "Founder" über dem Namen.
- **Admin-Panel als Floating Window**: für dich erscheint im Burger-Menü unter "Kategorien" ein neuer Eintrag **"Admin"**. Klick öffnet ein draggable/resizable Fenster (oben Titelbar mit Minimieren/Schließen, drag via Header, resize via Ecke, minimiert dockt unten rechts an).
- Panel-Tabs: **Übersicht** (Live-Zahlen: Nutzer, Shops, Listings, Orders, GMV), **Nutzer** (suchen, Rolle ändern, sperren), **Shops/Listings** (entfernen, featuren), **Codes** (globale Rabattcodes anlegen: Prozent/Festbetrag, Gültigkeit, Limit), **Featured** (welche Shops auf der Startseite priorisiert werden).

## 2. Seller-Onboarding (Guide vor erstem Listing)

Beim ersten Klick auf "Shop erstellen" läuft ein 5-Schritt-Wizard:
1. **Shop-Basics** (Handle, Name, Beschreibung, Avatar)
2. **Versand-Modell**: pro Listing wählbar "Versand extra" (Käufer zahlt obendrauf, Zonen/Pauschale) oder "inklusive" (im Preis drin) — gilt nur für physische Produkte
3. **Gebühren-Erklärung** (17% digital / 12% physisch, Staffel-Rabatt pro 25 Sales/Monat)
4. **Payouts**: alle 2 Wochen automatisch via Stripe Connect; Verkäufer hinterlegt IBAN über Stripe
5. **Pflichten**: bei Versand **Tracking-Nummer eingeben** (Pflicht für Streitfälle), Käufer kann bei Schaden Reklamation öffnen, Founder-Team prüft anhand Tracking + Chat

Dazu permanente Hilfe-Seite `/verkaufen/guide` mit:
- **Marketing-Sektion**: Tipps für Instagram/TikTok/Pinterest (Hashtag-Vorschläge je Kategorie, Posting-Zeiten, Story-Templates, Crosspost-Checkliste), UTM-Link-Generator für eigene Posts
- Versand-Best-Practices, Verpackung, Rücksendungen
- Streitfall-Ablauf

## 3. Käufer ↔ Verkäufer Chat

- Neue Tabellen `conversations` und `messages`. Jeder Käufer kann pro Shop **einen** Thread öffnen.
- Aufruf über Button "Verkäufer kontaktieren" auf Listing- und Shop-Seite.
- **Persönliche Preisangebote**: Verkäufer kann im Chat ein **privates Angebot** schicken (gilt nur für diesen einen Käufer, mit Ablaufdatum, Einlöse-Button → preisgesenkter Checkout-Link, der nur für diesen User funktioniert).
- Realtime via Supabase Channel; ungelesene Nachrichten triggern Notification.
- Founder (du) kann jeden Thread einsehen (für Streitfälle, im Admin-Panel).

## 4. Stripe Checkout + echte Orders

- Lovable's eingebautes Stripe (kein API-Key nötig) — `enable_stripe_payments`.
- Pro Listing wird beim Anlegen automatisch ein Stripe-Produkt + Preis erzeugt.
- Checkout-Button auf Listing-Seite → Stripe Checkout Session (mit Versandkosten falls "extra", mit Rabattcode falls eingegeben oder über privates Angebot).
- Webhook unter `/api/public/webhooks/stripe` validiert Signatur und schreibt:
  - `orders` + `order_items` (Käufer, Verkäufer, Menge, Preis, Versand, Founder-Anteil = Gebühr nach Staffel)
  - Notification an Verkäufer ("Du hast verkauft!")
  - **Tracking-Pflicht-Task** im Seller-Dashboard
- **Top-20 wird real**: sobald Orders reinkommen, sortiert die Query nach Stückzahl der letzten 7 Tage.
- Payouts: Stripe Connect Express-Konto pro Verkäufer, 14-Tage-Auszahlungszyklus, Gebühren-Abzug automatisch.

## 5. Notifications (Glocke live + sortiert)

Glocke oben rechts bekommt einen Dropdown mit Gruppierungen statt flacher Liste:
- **Nachrichten** (neue Chat-Messages)
- **Refill — Lieblingsshop** (Shop, bei dem du schon gekauft hast, hat neue Listings)
- **Refill — Lieblingsprodukt** (Listing das du favorisiert hast ist wieder verfügbar)
- **Bestellungen** (Status: bezahlt, versandt, geliefert, Reklamation)
- **Founder-News** (das ist dein Kanal: du kannst aus dem Admin-Panel an alle/Segment/einzelne Shops Push-Nachrichten schicken — z.B. "Hey, ich will mit deinem Shop was zusammen machen, schreib mir hier:")
- **System** (Gebühren-Update, AGB-Änderung)

Realtime via Supabase Channels. Ungelesen-Badge mit Anzahl pro Gruppe.

## 6. Slides: 10 statt 6

In `DiscoverRail` (Top 20 + Perfekt für daheim + alle weiteren Rails) zeigt jede Slide 10 Karten statt 6. Karten werden etwas kompakter, Grid passt sich responsive an (Handy 2 pro Reihe → 10 in 5 Reihen pro Slide).

## 7. Hero-Mixer-Klarstellung

Beschriftung am Mixer ergänzen: "Vorschau-Stil — nur diese Box, ändert nicht die Seite". Plus kleiner ⓘ-Tooltip. Optional: Reset-Button.

## 8. Stern im gelben Kreis

Aktuell nur Deko ("Trending"-Badge in Hero). Ich mache ihn klickbar → scrollt zur Top-20-Rail. Falls dir das immer noch nicht passt, kann er auch raus.

## 9. Mobile-Feinschliff

Während ich eh überall ran muss: Topbar-Suche auf Handy in Bottom-Sheet, Admin-Panel auf Handy fullscreen statt floating.

---

## Technisches (nur für Doku)

- **DB-Migrationen**: `app_role` += `founder`; `shops`-Felder (handle, shipping_default, stripe_account_id); `listings` += shipping_mode/shipping_price/stripe_price_id/favorites_count; `conversations`, `messages`, `private_offers`, `discount_codes`, `tracking`, `disputes`, `featured_shops`, `notification_groups`-Spalte; RLS + GRANTs überall.
- **Server-Functions** (`src/lib/`): `shop.functions.ts`, `chat.functions.ts`, `offers.functions.ts`, `codes.functions.ts`, `admin.functions.ts`, `notifications.functions.ts`, `stripe.functions.ts`.
- **Public Routes**: `/api/public/webhooks/stripe` (Signaturprüfung + DB-Schreib).
- **AI Minigames** (Lovable AI Gateway, `google/gemini-3-flash-preview` für Logik + `google/gemini-2.5-flash-image` für Visuals): **Flag-Draw** (Spieler zeichnet Flagge → KI rät Land), **Doodle-Search** (Spieler kritzelt Produkt → KI macht Vision-Embedding → Suche im Listings-Bestand). Eigene Route `/spielen`, im Burger verlinkt.
- **Realtime**: `messages`, `notifications`, `orders` per Postgres Changes.
- **Tracking**: einfaches Feld + Carrier-Dropdown (DHL/Hermes/DPD/UPS/Post), Statusabfrage später optional.

## Was ich dich noch brauche

1. **Deine E-Mail** (damit Founder-Trigger sie hardcoded matcht). Falls du sie hier nicht reinschreiben willst, kann ich stattdessen einen einmaligen 24-Zeichen-Code generieren — den löst du nach Registrierung in `/redeem` ein und das Konto wird Founder.
2. **Reihenfolge im Code**: ich baue in dieser Welle 1–9 durch. Migrations zuerst (du wirst eine Migration zum Bestätigen sehen), dann Code, dann Stripe-Enable (du klickst kurz im Stripe-Setup-Dialog Email/Name ein).