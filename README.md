# CreaHQ

## Social-Media-Links und Footer

Die Social-Media-Links und der Footer-Text werden zentral in `src/lib/site-config.ts` gepflegt. Trage dort deine vollständigen Profil-URLs ein, zum Beispiel:

```ts
socials: {
  instagram: "https://www.instagram.com/deinname/",
  tiktok: "https://www.tiktok.com/@deinname",
  youtube: "https://www.youtube.com/@deinname",
  github: "https://github.com/deinname",
  x: "https://x.com/deinname",
  discord: "https://discord.gg/dein-einladungslink",
}
```

Nicht genutzte Netzwerke lässt du als leeren String (`""`). Für sie wird im Footer kein Icon angezeigt. Du kannst im selben File außerdem den Markennamen und die beiden Footer-Zeilen ändern. Verwende nur Links zu Profilen, die tatsächlich zu CreaHQ gehören.

## Lokale Entwicklung

Installiere die Abhängigkeiten und starte den Entwicklungsserver mit `npm install` und `npm run dev`. Die verfügbaren Qualitätsprüfungen stehen in `package.json` (`npm run lint`, `npm run build`).

Die Anwendung benötigt die Supabase-Konfiguration aus den Umgebungsvariablen. Halte private Schlüssel aus dem Repository heraus.
