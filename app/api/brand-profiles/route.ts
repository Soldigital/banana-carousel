import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  listBrandProfiles,
  createBrandProfile,
  countBrandProfiles,
  sanitizeBrandInput,
  MAX_BRAND_PROFILES,
  type BrandProfileInput,
} from "@/lib/data/brand-profiles";

export const runtime = "nodejs";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

// GET /api/brand-profiles — list the user's profiles.
export async function GET() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const profiles = await listBrandProfiles(user.id);
  return NextResponse.json({ profiles });
}

// POST /api/brand-profiles — create a profile (name required, capped count).
export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let fields: BrandProfileInput;
  try {
    fields = sanitizeBrandInput(await req.json());
  } catch {
    return NextResponse.json({ error: "Request tidak valid." }, { status: 400 });
  }
  if (!fields.name) {
    return NextResponse.json({ error: "Nama brand wajib diisi." }, { status: 400 });
  }

  if ((await countBrandProfiles(user.id)) >= MAX_BRAND_PROFILES) {
    return NextResponse.json(
      { error: `Maksimal ${MAX_BRAND_PROFILES} brand profile.` },
      { status: 400 },
    );
  }

  const profile = await createBrandProfile(user.id, fields);
  if (!profile) {
    return NextResponse.json({ error: "Gagal menyimpan brand profile." }, { status: 500 });
  }
  return NextResponse.json({ profile });
}
