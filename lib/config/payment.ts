// Single source of truth for price + payment display config.

// Used when USE_PRICING_V2 is off, and — more importantly — as the amount
// recorded for manual bank-transfer orders (app/api/manual-order) and as the
// webhook's fallback amount. It therefore has to track the price actually
// advertised, not stay behind as a legacy value.
export const PRICE = 199000;
export const PRODUCT_NAME = "Banana Carousel — Lifetime Access";

// V2 Phase B — Founding Member pricing. The first 100 members pay the founding
// price (lifetime); once the 100 slots are taken the full lifetime price
// applies. Slots are counted by profiles.founder_number (lib/data/founding.ts).
export const FOUNDING_PRICE = 199000; // first 100
export const LIFETIME_PRICE = 499000; // after founding sold out
export const FOUNDING_CAP = 100;
export const FOUNDING_PRODUCT_NAME = "Banana Carousel — Founding Member (Lifetime)";

// V2 Phase C — Pro Annual (manual yearly renewal).
//
// Annual is discounted during the Founding window too, but note it does NOT
// consume a Founding slot: setProfilePro deliberately never calls assignTier
// for an annual plan, and the counter only counts founder_number. So this is
// "launch pricing while Founding slots remain", not "first 100 annual buyers" —
// the landing copy must say it that way.
export const ANNUAL_PRICE = 299000; // /tahun — after founding sold out
export const ANNUAL_FOUNDING_PRICE = 149000; // /tahun — during founding window
export const ANNUAL_DAYS = 365;
export const ANNUAL_PRODUCT_NAME = "Banana Carousel — Pro Annual (1 Tahun)";
export const ANNUAL_FOUNDING_PRODUCT_NAME =
  "Banana Carousel — Pro Annual Founding (1 Tahun)";

export function formatIDR(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

// Manual bank-transfer details shown to buyers (public, not secret).
export const BANK = {
  name: process.env.NEXT_PUBLIC_BANK_NAME || "Bank Jago Syariah",
  accountNo: process.env.NEXT_PUBLIC_BANK_ACCOUNT_NO || "501697030764",
  accountName: process.env.NEXT_PUBLIC_BANK_ACCOUNT_NAME || "Husna Muthmainnah",
  logo: "/banks/bank-jago-syariah.svg",
};

// Admin WhatsApp (digits only, intl format e.g. 62812xxxx). Empty = no redirect.
export const ADMIN_WHATSAPP = process.env.NEXT_PUBLIC_ADMIN_WHATSAPP || "";
