import { NextResponse } from "next/server";

export const runtime = "nodejs";

// Server-side conversion relay. Forwards events to Meta CAPI, TikTok Events API,
// and GA4 Measurement Protocol — but ONLY for platforms whose server token is
// configured. With no tokens set it is a safe no-op, so it can ship dormant and
// be activated later by adding env vars. The client should send a stable
// `event_id` so server + browser-pixel events can be deduplicated.
export async function POST(req: Request) {
  let body: {
    event?: string;
    event_id?: string;
    email?: string;
    value?: number;
    currency?: string;
    client_id?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
  const event = body.event;
  if (!event) {
    return NextResponse.json({ error: "Missing event" }, { status: 400 });
  }

  const tasks: Promise<unknown>[] = [];

  // --- Meta Conversions API ---
  const metaToken = process.env.META_CAPI_TOKEN;
  const metaPixel = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  if (metaToken && metaPixel) {
    tasks.push(
      fetch(
        `https://graph.facebook.com/v19.0/${metaPixel}/events?access_token=${metaToken}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            data: [
              {
                event_name: event,
                event_time: Math.floor(Date.now() / 1000),
                event_id: body.event_id,
                action_source: "website",
                user_data: body.email
                  ? { em: [await sha256(body.email.trim().toLowerCase())] }
                  : {},
                custom_data:
                  body.value != null
                    ? { value: body.value, currency: body.currency || "IDR" }
                    : {},
              },
            ],
          }),
        },
      ).catch(() => null),
    );
  }

  // --- GA4 Measurement Protocol ---
  const ga4Id = process.env.NEXT_PUBLIC_GA4_ID;
  const ga4Secret = process.env.GA4_API_SECRET;
  if (ga4Id && ga4Secret && body.client_id) {
    tasks.push(
      fetch(
        `https://www.google-analytics.com/mp/collect?measurement_id=${ga4Id}&api_secret=${ga4Secret}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            client_id: body.client_id,
            events: [
              {
                name: event,
                params:
                  body.value != null
                    ? { value: body.value, currency: body.currency || "IDR" }
                    : {},
              },
            ],
          }),
        },
      ).catch(() => null),
    );
  }

  // --- TikTok Events API ---
  const ttToken = process.env.TIKTOK_EVENTS_TOKEN;
  const ttPixel = process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID;
  if (ttToken && ttPixel) {
    tasks.push(
      fetch("https://business-api.tiktok.com/open_api/v1.3/event/track/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Access-Token": ttToken,
        },
        body: JSON.stringify({
          event_source: "web",
          event_source_id: ttPixel,
          data: [
            {
              event,
              event_id: body.event_id,
              event_time: Math.floor(Date.now() / 1000),
              user: body.email
                ? { email: await sha256(body.email.trim().toLowerCase()) }
                : {},
            },
          ],
        }),
      }).catch(() => null),
    );
  }

  if (tasks.length === 0) {
    return NextResponse.json({ ok: true, skipped: true });
  }
  await Promise.allSettled(tasks);
  return NextResponse.json({ ok: true });
}

async function sha256(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
