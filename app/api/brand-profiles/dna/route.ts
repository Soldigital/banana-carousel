import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEntitlement } from "@/lib/license/status";
import { getBrandProfile } from "@/lib/data/brand-profiles";
import { generateBrandDNA } from "@/lib/ai/brand-dna";

export const runtime = "nodejs";
export const maxDuration = 60;

// POST /api/brand-profiles/dna { profileId } — Pro-only. Generates Brand DNA
// from the profile's name/website/IG using the user's OWN keys (BYOK), stores it
// on the profile, and prefills tone_of_voice + target_audience for auto-fill.
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ent = await getEntitlement();
  if (!ent.entitled) {
    return NextResponse.json({ error: "AI Brand DNA khusus member Pro." }, { status: 403 });
  }

  let profileId = "";
  try {
    profileId = String((await req.json())?.profileId ?? "");
  } catch {
    return NextResponse.json({ error: "Request tidak valid." }, { status: 400 });
  }

  const profile = await getBrandProfile(user.id, profileId);
  if (!profile) return NextResponse.json({ error: "Brand profile tidak ditemukan." }, { status: 404 });
  if (!profile.name?.trim()) {
    return NextResponse.json({ error: "Isi nama brand dulu." }, { status: 400 });
  }

  try {
    const dna = await generateBrandDNA(user.id, {
      name: profile.name,
      website: profile.website,
      instagram: profile.instagram_username,
    });

    // Persist DNA + prefill the existing auto-fill fields (don't overwrite if the
    // user already set them).
    await createAdminClient()
      .from("brand_profiles")
      .update({
        brand_dna: dna,
        tone_of_voice: profile.tone_of_voice || dna.tone_of_voice,
        target_audience: profile.target_audience || dna.audience_persona,
      })
      .eq("user_id", user.id)
      .eq("id", profileId);

    return NextResponse.json({ dna });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Gagal generate Brand DNA.";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
