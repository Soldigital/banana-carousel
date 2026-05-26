import { decryptString, encryptString } from "./crypto";

const API_KEY_STORAGE = "banana-carousel.api-key.v1";

export async function saveApiKey(plaintextKey: string): Promise<void> {
  if (typeof window === "undefined") return;
  const encrypted = await encryptString(plaintextKey.trim());
  localStorage.setItem(API_KEY_STORAGE, encrypted);
}

export async function loadApiKey(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  const encrypted = localStorage.getItem(API_KEY_STORAGE);
  if (!encrypted) return null;
  try {
    return await decryptString(encrypted);
  } catch {
    localStorage.removeItem(API_KEY_STORAGE);
    return null;
  }
}

export function clearApiKey(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(API_KEY_STORAGE);
}

export function hasApiKey(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(API_KEY_STORAGE) !== null;
}
