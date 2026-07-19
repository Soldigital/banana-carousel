import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { encryptKey, keyLast4 } from "@/lib/ai/key-crypto";
import { isProviderId } from "@/lib/ai/types";

export const runtime = "nodejs";

const MAX_PER_PROVIDER = 5;

// Shape returned to the client — NEVER includes ciphertext or plaintext.
const MASKED_COLUMNS = "id, provider, label, key_last4, enabled, created_at";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

// GET /api/keys — list the current user's keys (masked).
export async function GET() {
  const { supabase, user } = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("ai_provider_keys")
    .select(MASKED_COLUMNS)
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: "Gagal memuat keys." }, { status: 500 });
  }
  return NextResponse.json({ keys: data ?? [] });
}

// POST /api/keys — add a key (validates, encrypts, enforces <=5 per provider).
export async function POST(req: Request) {
  const { user } = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let provider: unknown;
  let key: unknown;
  let label: unknown;
  try {
    const body = await req.json();
    provider = body?.provider;
    key = body?.key;
    label = body?.label;
  } catch {
    return NextResponse.json({ error: "Request tidak valid." }, { status: 400 });
  }

  if (!isProviderId(provider)) {
    return NextResponse.json({ error: "Provider tidak dikenal." }, { status: 400 });
  }
  const plaintext = typeof key === "string" ? key.trim() : "";
  if (plaintext.length < 10) {
    return NextResponse.json(
      { error: "API key tidak valid (terlalu pendek)." },
      { status: 400 },
    );
  }

  const admin = createAdminClient();

  const { count } = await admin
    .from("ai_provider_keys")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("provider", provider);

  if ((count ?? 0) >= MAX_PER_PROVIDER) {
    return NextResponse.json(
      { error: `Maksimal ${MAX_PER_PROVIDER} key per provider.` },
      { status: 400 },
    );
  }

  const insertLabel =
    typeof label === "string" && label.trim()
      ? label.trim().slice(0, 40)
      : `key_${(count ?? 0) + 1}`;

  const { data, error } = await admin
    .from("ai_provider_keys")
    .insert({
      user_id: user.id,
      provider,
      label: insertLabel,
      key_ciphertext: encryptKey(plaintext),
      key_last4: keyLast4(plaintext),
      enabled: true,
    })
    .select(MASKED_COLUMNS)
    .single();

  if (error) {
    return NextResponse.json({ error: "Gagal menyimpan key." }, { status: 500 });
  }
  return NextResponse.json({ key: data });
}
