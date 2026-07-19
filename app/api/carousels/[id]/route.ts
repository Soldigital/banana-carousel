import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getCarouselById,
  softDeleteCarousel,
  restoreCarousel,
  permanentDeleteCarousel,
  incrementReuse,
} from "@/lib/data/carousels";

export const runtime = "nodejs";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

// GET /api/carousels/:id — full record (input + output) for opening into the
// generator.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const record = await getCarouselById(user.id, id);
  if (!record) {
    return NextResponse.json({ error: "Tidak ditemukan." }, { status: 404 });
  }
  return NextResponse.json({ record });
}

// POST /api/carousels/:id  { action: "delete" | "restore" | "permanent-delete" | "reuse" }
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  let action: unknown;
  try {
    action = (await req.json())?.action;
  } catch {
    return NextResponse.json({ error: "Request tidak valid." }, { status: 400 });
  }

  let ok = false;
  switch (action) {
    case "delete":
      ok = await softDeleteCarousel(user.id, id);
      break;
    case "restore":
      ok = await restoreCarousel(user.id, id);
      break;
    case "permanent-delete":
      ok = await permanentDeleteCarousel(user.id, id);
      break;
    case "reuse":
      await incrementReuse(user.id, id);
      ok = true;
      break;
    default:
      return NextResponse.json({ error: "Action tidak dikenal." }, { status: 400 });
  }

  if (!ok) {
    return NextResponse.json({ error: "Gagal memproses." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
