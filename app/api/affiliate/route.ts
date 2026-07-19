import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { normalizeEmail } from "@/lib/config/app";
import { getEntitlement } from "@/lib/license/status";
import {
  getMyAffiliate,
  listMyEarnings,
  enrollAffiliate,
  setReward,
  type RewardType,
} from "@/lib/data/affiliate";

export const runtime = "nodejs";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

// GET /api/affiliate — my affiliate profile + earnings.
export async function GET() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const affiliate = await getMyAffiliate();
  const earnings = affiliate ? await listMyEarnings(user.id) : [];
  return NextResponse.json({ affiliate, earnings });
}

// POST /api/affiliate { action: 'enroll' | 'reward', reward_type?, commission_rate? }
// Affiliate program is Pro-only.
export async function POST(req: Request) {
  const user = await requireUser();
  if (!user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ent = await getEntitlement();
  if (!ent.entitled) {
    return NextResponse.json(
      { error: "Affiliate khusus member Pro." },
      { status: 403 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Request tidak valid." }, { status: 400 });
  }

  if (body.action === "enroll") {
    const aff = await enrollAffiliate(user.id, normalizeEmail(user.email));
    if (!aff) return NextResponse.json({ error: "Gagal mendaftar." }, { status: 500 });
    return NextResponse.json({ affiliate: aff });
  }

  if (body.action === "reward") {
    const rt = body.reward_type as RewardType;
    if (rt !== "commission" && rt !== "bonus") {
      return NextResponse.json({ error: "Tipe reward tidak valid." }, { status: 400 });
    }
    const ok = await setReward(user.id, rt, Number(body.commission_rate) || 0.2);
    if (!ok) return NextResponse.json({ error: "Gagal menyimpan." }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Action tidak dikenal." }, { status: 400 });
}
