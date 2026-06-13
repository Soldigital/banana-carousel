// Single source of truth for price + payment display config.

export const PRICE = 99000; // Rp99.000 lifetime (legacy single price)
export const PRODUCT_NAME = "Banana Carousel — Lifetime Access";

// V2 Phase B — Founding Member pricing. First 100 members pay the founding
// price (lifetime); after the 100 slots are taken the lifetime price applies.
export const FOUNDING_PRICE = 99000; // Rp99.000 — first 100
export const LIFETIME_PRICE = 299000; // Rp299.000 — after founding sold out
export const FOUNDING_CAP = 100;
export const FOUNDING_PRODUCT_NAME = "Banana Carousel — Founding Member (Lifetime)";

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
