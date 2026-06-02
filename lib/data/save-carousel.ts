import { createClient } from "@/lib/supabase/client";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import type { CarouselOutput, GeneratorInput } from "@/types/carousel";

// Best-effort client-side save of a generated carousel to the logged-in user's
// account (RLS enforces ownership). No-ops when Supabase is unconfigured or the
// visitor is not logged in. Never throws — history saving must not break the
// generation UX.
export async function saveCarousel(
  input: GeneratorInput,
  output: CarouselOutput,
): Promise<void> {
  try {
    if (!hasSupabaseEnv()) return;
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("carousels").insert({
      user_id: user.id,
      title: output.carousel_title || input.title || null,
      input,
      output,
    });
  } catch (err) {
    console.error("[carousels] save failed", err);
  }
}
