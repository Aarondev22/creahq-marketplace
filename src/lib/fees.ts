// CreaHQ Gebührenmodell
// - Keine monatliche Grundgebühr
// - Digitale Produkte: Start 17 %
// - Physische Produkte: Start 12 %
// - Pro Shop & Monat: alle 25 abgeschlossenen Verkäufe -1 %
// - Reset jeden 1. des Monats (UTC)
// - Mindestgebühr (Floor): 5 %

export type ProductKind = "digital" | "physical";

export const FEES = {
  digitalStartPct: 17,
  physicalStartPct: 12,
  tierSize: 25,
  reductionPerTier: 1,
  floorPct: 5,
};

export function feeRate(kind: ProductKind, salesThisMonth: number): number {
  const start = kind === "digital" ? FEES.digitalStartPct : FEES.physicalStartPct;
  const tiers = Math.floor(Math.max(0, salesThisMonth) / FEES.tierSize);
  return Math.max(FEES.floorPct, start - tiers * FEES.reductionPerTier);
}

export function feeAmountCents(kind: ProductKind, salesThisMonth: number, priceCents: number): number {
  const rate = feeRate(kind, salesThisMonth);
  return Math.round((priceCents * rate) / 100);
}

export const feeExplainerShort =
  "Keine monatliche Gebühr. Pro Verkauf: digital 17 %, physisch 12 % — alle 25 Verkäufe im Monat 1 % weniger, Reset jeden Monat.";
