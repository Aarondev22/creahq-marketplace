import { supabase } from "@/integrations/supabase/client";

export type ReportTarget = "listing" | "shop" | "chat";

export type Report = {
  id: string;
  reporter_id: string;
  target_type: ReportTarget;
  target_id: string;
  reason: string;
  note: string | null;
  status: string;
  admin_note: string | null;
  created_at: string;
};

export const REPORT_REASONS = [
  { value: "verboten", label: "Verbotene Ware" },
  { value: "fake", label: "Fake / Fälschung" },
  { value: "betrug", label: "Betrugsversuch" },
  { value: "spam", label: "Spam / Werbung" },
  { value: "beleidigung", label: "Beleidigung im Chat" },
  { value: "sonstiges", label: "Sonstiges" },
] as const;

const COLS = "id,reporter_id,target_type,target_id,reason,note,status,admin_note,created_at";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const table = () => supabase.from("reports") as any;

export async function createReport(input: {
  targetType: ReportTarget;
  targetId: string;
  reason: string;
  note?: string;
}): Promise<void> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("Bitte melde dich an, um zu melden.");
  const { error } = await table().insert({
    reporter_id: u.user.id,
    target_type: input.targetType,
    target_id: input.targetId,
    reason: input.reason,
    note: input.note?.trim() || null,
  });
  if (error) throw new Error(error.message);
}

export async function fetchReports(status?: string): Promise<Report[]> {
  let q = table().select(COLS).order("created_at", { ascending: false }).limit(200);
  if (status) q = q.eq("status", status);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as Report[];
}

export async function resolveReport(id: string, status: "resolved" | "dismissed", adminNote?: string) {
  const { data: u } = await supabase.auth.getUser();
  const { error } = await table()
    .update({
      status,
      admin_note: adminNote?.trim() || null,
      resolved_by: u.user?.id ?? null,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
}
