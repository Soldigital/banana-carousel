import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { loadUserKeys } from "@/lib/ai/load-keys";
import { runGateway } from "@/lib/ai/gateway";
import { GenError } from "@/lib/ai/errors";
import { rateLimit } from "@/lib/security/ratelimit";
import type { GeneratorInput } from "@/types/carousel";

export const runtime = "nodejs";
export const maxDuration = 60;

// AI Gateway entry point. Auth → rate-limit → load user's BYOK keys → rotate
// across providers/keys with cache + fallback → return the same CarouselOutput
// contract the client already renders. Replaces the legacy client-side call
// when NEXT_PUBLIC_USE_GATEWAY is on.
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Silakan login dulu." }, { status: 401 });
  }

  const rl = await rateLimit(`gen:${user.id}`, { limit: 20, window: "60 s" });
  if (!rl.success) {
    return NextResponse.json(
      { error: "Terlalu banyak permintaan. Tunggu sebentar lalu coba lagi.", code: "rate_limit" },
      { status: 429 },
    );
  }

  let input: GeneratorInput;
  try {
    const body = await req.json();
    input = body?.input;
  } catch {
    return NextResponse.json({ error: "Request tidak valid." }, { status: 400 });
  }
  if (!input?.topic?.trim() || !input?.audience?.trim()) {
    return NextResponse.json(
      { error: "Topik dan target audience wajib diisi." },
      { status: 400 },
    );
  }

  const keysByProvider = await loadUserKeys(user.id);

  try {
    const result = await runGateway({ userId: user.id, input, keysByProvider });
    return NextResponse.json({
      output: result.output,
      meta: {
        provider: result.provider,
        model: result.model,
        cached: result.cached,
      },
    });
  } catch (err) {
    const code = err instanceof GenError ? err.code : "unknown";
    const message =
      err instanceof Error ? err.message : "Gagal generate. Coba lagi.";
    const status =
      code === "invalid_key" ? 400 : code === "rate_limit" ? 429 : 502;
    return NextResponse.json({ error: message, code }, { status });
  }
}
