import { supabase } from "@/integrations/supabase/client";
import { resolveReport as resolveReportServer } from "@/lib/admin";

export async function resolveReport(id: string, status: "resolved" | "dismissed", adminNote?: string) {
  // Call server-side endpoint via admin.client wrapper
  await resolveReportServer({ id, status, adminNote });
}
