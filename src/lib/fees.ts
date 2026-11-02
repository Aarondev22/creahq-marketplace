// Platform fee: 17 % of the price, but at least 0.70 € per sale (never more than the price).
export const FEE_RATE = 0.17;
export const MIN_FEE_CENTS = 70;
export function feeCents(priceCents: number) {
  return Math.min(priceCents, Math.max(MIN_FEE_CENTS, Math.round(priceCents * FEE_RATE)));
}
export function sellerPayoutCents(priceCents: number) {
  return priceCents - feeCents(priceCents);
}

// Tiered rate used by the fee page and seller guide.
export type ProductKind = "digital" | "physical";
export const FEES = {
  digitalStartPct: 17,
  physicalStartPct: 12,
  tierSize: 25,
  reductionPerTier: 1,
  digitalFloorPct: 10,
  physicalFloorPct: 7,
};
export function feeRate(kind: ProductKind, salesThisMonth: number) {
  const start = kind === "digital" ? FEES.digitalStartPct : FEES.physicalStartPct;
  const floor = kind === "digital" ? FEES.digitalFloorPct : FEES.physicalFloorPct;
  return Math.max(floor, start - Math.floor(salesThisMonth / FEES.tierSize) * FEES.reductionPerTier);
}
export function feeForSale(input: { kind: ProductKind; priceCents: number; salesThisMonth: number }) {
  const rate = feeRate(input.kind, input.salesThisMonth);
  const fee = Math.min(input.priceCents, Math.max(MIN_FEE_CENTS, Math.round((input.priceCents * rate) / 100)));
  return { feeRate: rate, feeCents: fee, payoutCents: input.priceCents - fee };
}
