// Unified analytics event dispatch. Fans a single semantic event out to every
// tracker that happens to be loaded (GTM dataLayer, GA4, Meta Pixel, TikTok
// Pixel, PostHog). Each call is a safe no-op when a given tracker is absent, so
// this works whether or not the pixels are configured.

export type AnalyticsEvent =
  | "generate_carousel"
  | "sign_up"
  | "login"
  | "begin_checkout"
  | "purchase";

type Props = Record<string, unknown>;

// Map our semantic events to each platform's standard event taxonomy.
const META_STANDARD: Partial<Record<AnalyticsEvent, string>> = {
  sign_up: "CompleteRegistration",
  begin_checkout: "InitiateCheckout",
  purchase: "Purchase",
  generate_carousel: "Lead",
};

const TIKTOK_STANDARD: Partial<Record<AnalyticsEvent, string>> = {
  sign_up: "CompleteRegistration",
  begin_checkout: "InitiateCheckout",
  purchase: "CompletePayment",
  generate_carousel: "SubmitForm",
};

export function track(event: AnalyticsEvent, props: Props = {}): void {
  if (typeof window === "undefined") return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;

  // Google Tag Manager dataLayer.
  w.dataLayer = w.dataLayer || [];
  w.dataLayer.push({ event, ...props });

  // GA4 (standalone gtag, if loaded outside GTM).
  if (typeof w.gtag === "function") w.gtag("event", event, props);

  // Meta Pixel.
  if (typeof w.fbq === "function") {
    const std = META_STANDARD[event];
    if (std) w.fbq("track", std, props);
    else w.fbq("trackCustom", event, props);
  }

  // TikTok Pixel.
  if (w.ttq && typeof w.ttq.track === "function") {
    w.ttq.track(TIKTOK_STANDARD[event] ?? event, props);
  }

  // PostHog.
  if (w.posthog && typeof w.posthog.capture === "function") {
    w.posthog.capture(event, props);
  }
}
