// Platform fee: 17 % of the price, but at least 0.70 € per sale (never more than the price).
export const FEE_RATE = 0.17;
export const MIN_FEE_CENTS = 70;
export function feeCents(priceCents: number) {
  return Math.min(priceCents, Math.max(MIN_FEE_CENTS, Math.round(priceCents * FEE_RATE)));
}
export function sellerPayoutCents(priceCents: number) {
  return priceCents - feeCents(priceCents);
}
