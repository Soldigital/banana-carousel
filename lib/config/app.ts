// Small shared app config / helpers.

// Normalize emails consistently everywhere (checkout, entitlement, accounts)
// so entitlement-by-email matching never misses on case/whitespace.
export function normalizeEmail(email: string | null | undefined): string {
  return String(email ?? "").trim().toLowerCase();
}

// Owner email (server env). Used to auto-promote the owner to admin and as an
// always-entitled fast-path. Empty string when unset.
export function ownerEmail(): string {
  return normalizeEmail(process.env.OWNER_EMAIL);
}

export function isOwnerEmail(email: string | null | undefined): boolean {
  const owner = ownerEmail();
  return !!owner && normalizeEmail(email) === owner;
}
