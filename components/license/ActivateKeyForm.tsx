"use client";

import * as React from "react";
import { KeyRound, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { saveLicense } from "@/lib/license/storage";
import { useLicenseStore, verifyLicenseToken } from "@/lib/store/license-store";

// Lets a user activate by pasting a license key (from the purchase email,
// or the owner's default key). On success, stores it and unlocks the gate.
export function ActivateKeyForm() {
  const [value, setValue] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const unlock = useLicenseStore((s) => s.unlock);

  async function handleActivate() {
    const token = value.trim();
    if (!token) {
      toast.error("Tempel license key Anda dulu.");
      return;
    }
    setBusy(true);
    try {
      const { valid, owner } = await verifyLicenseToken(token);
      if (!valid) {
        toast.error("License key tidak valid. Cek kembali key dari email Anda.");
        return;
      }
      saveLicense(token);
      unlock(owner);
      toast.success(owner ? "Akses owner aktif." : "Lisensi aktif. Selamat berkarya!");
    } catch {
      toast.error("Gagal memverifikasi lisensi. Coba lagi.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-col sm:flex-row gap-2">
        <Input
          placeholder="Tempel license key Anda di sini"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="font-mono text-xs"
          onKeyDown={(e) => {
            if (e.key === "Enter") handleActivate();
          }}
        />
        <Button
          type="button"
          variant="outline"
          onClick={handleActivate}
          disabled={busy}
          className="shrink-0"
        >
          {busy ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <KeyRound className="size-4" />
          )}
          Aktivasi
        </Button>
      </div>
    </div>
  );
}
