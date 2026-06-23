// CreaHQ Gebührenmodell
// - Keine monatliche Grundgebühr
// - Digitale Produkte: Start 17 % → min. 12 %
// - Physische Produkte: Start 12 % → min. 7 %
// - Pro Shop & Monat: alle 25 abgeschlossenen Verkäufe -1 %
// - Reset jeden 1. des Monats (UTC)

export type ProductKind = "digital" | "physical";

export const FEES = {
  digitalStartPct: 17,
  physicalStartPct: 12,
  tierSize: 25,
  reductionPerTier: 1,
  digitalFloorPct: 12,
  physicalFloorPct: 7,
};

export function feeRate(kind: ProductKind, salesThisMonth: number): number {
  const start = kind === "digital" ? FEES.digitalStartPct : FEES.physicalStartPct;
  const floor = kind === "digital" ? FEES.digitalFloorPct : FEES.physicalFloorPct;
  const tiers = Math.floor(Math.max(0, salesThisMonth) / FEES.tierSize);
  return Math.max(floor, start - tiers * FEES.reductionPerTier);
}

export function feeAmountCents(kind: ProductKind, salesThisMonth: number, priceCents: number): number {
  const rate = feeRate(kind, salesThisMonth);
  return Math.round((priceCents * rate) / 100);
}

export const feeExplainerShort =
  "Keine monatliche Gebühr. Digital: 17 % → min. 12 %. Physisch: 12 % → min. 7 %. Alle 25 Verkäufe/Monat: −1 %. Reset jeden Monat.";

export function feeForSale(args: { kind: ProductKind; priceCents: number; salesThisMonth: number }) {
  const feeRatePct = feeRate(args.kind, args.salesThisMonth);
  const feeCents = feeAmountCents(args.kind, args.salesThisMonth, args.priceCents);
  return {
    feeRate: feeRatePct,
    feeCents,
    payoutCents: args.priceCents - feeCents,
  };
}
