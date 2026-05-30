// Client-side license token storage (plain localStorage — the token is a
// signed credential, not a secret to hide). Mirrors lib/storage/api-key.ts.
const LICENSE_STORAGE = "banana-carousel.license.v1";

export function getLicense(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(LICENSE_STORAGE);
}

export function saveLicense(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LICENSE_STORAGE, token.trim());
}

export function clearLicense(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(LICENSE_STORAGE);
}
