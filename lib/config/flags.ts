// Feature flags (public — safe to read on the client).

// Route generation through the server-side AI Gateway (multi-provider, multi-key
// rotation, cache, monitoring). When off, the app uses the legacy client-side
// Gemini path — an instant rollback switch.
export const USE_GATEWAY = process.env.NEXT_PUBLIC_USE_GATEWAY === "on";

// History Management v2: search, filters, soft-delete + recycle bin, virtualized
// infinite list. When off, the dashboard shows the existing simple grid — an
// instant rollback switch. The DB migration (0007) is additive and harmless
// regardless of this flag.
export const USE_HISTORY_V2 = process.env.NEXT_PUBLIC_USE_HISTORY_V2 === "on";

// Brand Profiles + logo management (Phase 2). When off, the generator behaves
// exactly as today (free-text brand name only).
export const USE_BRAND_PROFILES =
  process.env.NEXT_PUBLIC_USE_BRAND_PROFILES === "on";

// Pricing v2 (V2 Phase B): tiers/Founding counter/Founder Wall pricing UI. When
// off, the original single "Rp99.000 Lifetime" buy flow shows. The DB migration
// (0010) is additive and harmless regardless of this flag; entitlement/access is
// unchanged either way.
export const USE_PRICING_V2 = process.env.NEXT_PUBLIC_USE_PRICING_V2 === "on";

// Affiliate / referral program (V2 Phase C3). Off ⇒ no affiliate UI; referral
// links + reward logic are inert. Additive migration 0013 is harmless regardless.
export const USE_AFFILIATE = process.env.NEXT_PUBLIC_USE_AFFILIATE === "on";
