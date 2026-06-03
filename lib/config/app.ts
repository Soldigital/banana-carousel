// Small shared app config / helpers.

// Normalize emails consistently everywhere (checkout, entitlement, accounts)
// so entitlement-by-email matching never misses on case/whitespace.
export function normalizeEmail(email: string | null | undefined): string {
  return String(email ?? "").trim().toLowerCase();
}

// Owner / super-admin emails (server env). Comma-separated list in OWNER_EMAIL.
// Used to auto-promote to admin and as an always-entitled fast-path.
export function ownerEmails(): string[] {
  return String(process.env.OWNER_EMAIL ?? "")
    .split(",")
    .map((e) => normalizeEmail(e))
    .filter(Boolean);
}

export function isOwnerEmail(email: string | null | undefined): boolean {
  const e = normalizeEmail(email);
  return !!e && ownerEmails().includes(e);
}
