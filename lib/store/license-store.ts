import { create } from "zustand";

export type LicenseStatus = "checking" | "locked" | "unlocked";

interface LicenseState {
  status: LicenseStatus;
  isOwner: boolean;
  setStatus: (s: LicenseStatus) => void;
  setOwner: (b: boolean) => void;
  unlock: (owner: boolean) => void;
  lock: () => void;
}

export const useLicenseStore = create<LicenseState>((set) => ({
  status: "checking",
  isOwner: false,
  setStatus: (status) => set({ status }),
  setOwner: (isOwner) => set({ isOwner }),
  unlock: (owner) => set({ status: "unlocked", isOwner: owner }),
  lock: () => set({ status: "locked", isOwner: false }),
}));

// Verify a license token against the server. Reused by the gate and the
// manual activation form.
export async function verifyLicenseToken(
  token: string,
): Promise<{ valid: boolean; owner: boolean }> {
  try {
    const res = await fetch("/api/license/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const data = await res.json();
    return { valid: !!data.valid, owner: !!data.owner };
  } catch {
    return { valid: false, owner: false };
  }
}
