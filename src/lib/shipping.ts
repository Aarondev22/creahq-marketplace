import { z } from "zod";

export const CARRIERS = ["DHL", "Hermes", "DPD", "UPS", "GLS", "Deutsche Post", "Sonstiger"] as const;
export const PROCESSING_TIMES = ["1–2 Werktage", "3–5 Werktage", "1–2 Wochen"] as const;

export const shippingSchema = z.object({
  shippingMode: z.enum(["included", "extra", "digital"]),
  shippingPriceCents: z.number().int().min(0).max(100000),
  shippingCarrier: z.enum(CARRIERS),
  processingTime: z.enum(PROCESSING_TIMES),
}).refine((d) => d.shippingMode !== "digital", "Bitte eine Versandoption wählen.");

export function validatePhysicalShipping(enabled: boolean, input: unknown) {
  if (!enabled) throw new Error("Physische Produkte sind derzeit nicht freigeschaltet.");
  return shippingSchema.parse(input);
}

export function shippingTotalCents(lines: { qty: number; kind: string; shipping_mode: string; shipping_price_cents: number }[]) {
  return lines.reduce((sum, l) => sum + (l.kind !== "digital" && l.shipping_mode === "extra" ? l.shipping_price_cents * l.qty : 0), 0);
}

export function requirePhysicalShipping(input: { kind: string; shippingMode?: string; shippingPriceCents?: number; shippingCarrier?: string; processingTime?: string }, enabled: boolean) {
  if (input.kind === "digital") return null;
  if (!enabled) throw new Error("Physische Angebote sind derzeit nicht freigeschaltet.");
  return shippingSchema.parse({
    shippingMode: input.shippingMode ?? "included",
    shippingPriceCents: Number(input.shippingPriceCents ?? 0),
    shippingCarrier: (input.shippingCarrier ?? "DHL") as (typeof CARRIERS)[number],
    processingTime: (input.processingTime ?? "3–5 Werktage") as (typeof PROCESSING_TIMES)[number],
  });
}
