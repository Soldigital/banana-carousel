import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export interface FounderEntry {
  number: number;
  label: string;
}

// Public Founder Wall: founding members ordered by number, each shown per their
// chosen display preference (name / username / number-only). Never leaks email
// or any field the founder didn't opt to show.
export async function listFounders(): Promise<FounderEntry[]> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("profiles")
      .select("founder_number, founder_display, founder_alias, name")
      .not("founder_number", "is", null)
      .order("founder_number", { ascending: true });
    if (error || !data) return [];

    return data.map((p) => {
      const n = p.founder_number as number;
      const anon = `Founding Member #${String(n).padStart(3, "0")}`;
      let label = anon;
      if (p.founder_display === "name" && p.name) label = p.name as string;
      else if (p.founder_display === "username" && p.founder_alias)
        label = p.founder_alias as string;
      return { number: n, label };
    });
  } catch {
    return [];
  }
}
