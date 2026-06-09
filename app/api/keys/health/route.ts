import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getHealthSnapshot } from "@/lib/ai/health";
import { isProviderId, type ProviderId } from "@/lib/ai/types";

export const runtime = "nodejs";

// GET /api/keys/health — per-key health snapshot (success rate, latency, last
// status) for the monitoring panel. Reads hot counters from Redis.
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await supabase
    .from("ai_provider_keys")
    .select("id, provider")
    .eq("user_id", user.id);

  const keys = (data ?? [])
    .filter((k): k is { id: string; provider: ProviderId } =>
      isProviderId(k.provider),
    )
    .map((k) => ({ id: k.id, provider: k.provider }));

  const health = await getHealthSnapshot(user.id, keys);
  return NextResponse.json({ health });
}
