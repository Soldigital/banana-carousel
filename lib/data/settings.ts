import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  TUTORIAL_STEPS,
  TUTORIAL_YOUTUBE_ID,
  type TutorialStep,
} from "@/lib/config/tutorial";

export interface TutorialConfig {
  youtubeId: string;
  steps: TutorialStep[];
}

export interface Announcement {
  title: string;
  message: string;
  active: boolean;
}

// Reads a public app_setting (RLS allows select to everyone). Returns null on
// any issue so callers fall back to defaults.
async function readSetting<T>(key: string): Promise<T | null> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", key)
      .maybeSingle();
    return (data?.value as T) ?? null;
  } catch {
    return null;
  }
}

export async function getTutorial(): Promise<TutorialConfig> {
  const v = await readSetting<Partial<TutorialConfig>>("tutorial");
  return {
    youtubeId: v?.youtubeId ?? TUTORIAL_YOUTUBE_ID,
    steps: v?.steps && v.steps.length ? v.steps : TUTORIAL_STEPS,
  };
}

// Public-facing: only returns an active announcement (for the banner).
export async function getAnnouncement(): Promise<Announcement | null> {
  const v = await readSetting<Announcement>("announcement");
  if (!v || !v.active || !v.message) return null;
  return v;
}

// Admin-facing: returns the stored announcement as-is (for the editor form).
export async function getAnnouncementRaw(): Promise<Announcement | null> {
  return readSetting<Announcement>("announcement");
}

// Service-role upsert — call only from admin routes (after admin verification).
export async function setSetting(key: string, value: unknown): Promise<void> {
  const admin = createAdminClient();
  await admin
    .from("app_settings")
    .upsert({ key, value, updated_at: new Date().toISOString() });
}
