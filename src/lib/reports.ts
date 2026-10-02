import { supabase } from "@/integrations/supabase/client";

export type ReportTarget = "listing" | "shop" | "chat" | "order";

export const ORDER_PROBLEM_REASONS = [
  { value: "not_received", label: "Artikel nicht erhalten" },
  { value: "damaged", label: "Beschädigt angekommen" },
  { value: "not_as_described", label: "Entspricht nicht der Beschreibung" },
  { value: "other", label: "Sonstiges" },
] as const;

export const REPORT_REASONS = [
  { value: "spam", label: "Spam oder Betrug" },
  { value: "illegal", label: "Illegaler Inhalt" },
  { value: "counterfeit", label: "Fälschung / Urheberrecht" },
  { value: "abuse", label: "Beleidigung / Belästigung" },
  { value: "other", label: "Sonstiges" },
] as const;

export async function createReport(input: {
  targetType: ReportTarget;
  targetId: string;
  reason: string;
  note?: string;
}) {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) throw new Error("Bitte melde dich an, um zu melden.");
  const { error } = await supabase.from("reports").insert({
    reporter_id: uid,
    target_type: input.targetType,
    target_id: input.targetId,
    reason: input.reason,
    note: input.note?.slice(0, 600) || null,
  });
  if (error) throw new Error(error.message);
  return { ok: true };
}
