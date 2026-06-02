"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Loader2, Send, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CopyButton } from "@/components/generator/CopyButton";
import { createClient } from "@/lib/supabase/client";
import { ADMIN_WHATSAPP, BANK, PRICE, formatIDR } from "@/lib/config/payment";

const MAX_BYTES = 5 * 1024 * 1024; // 5MB

export function TransferClient({
  userId,
  email,
  defaultWhatsapp,
}: {
  userId: string;
  email: string;
  defaultWhatsapp: string;
}) {
  const supabase = React.useMemo(() => createClient(), []);
  const [name, setName] = React.useState("");
  const [whatsapp, setWhatsapp] = React.useState(defaultWhatsapp);
  const [file, setFile] = React.useState<File | null>(null);
  const [busy, setBusy] = React.useState(false);

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    if (f) {
      if (!f.type.startsWith("image/")) {
        toast.error("File harus berupa gambar (screenshot bukti transfer).");
        return;
      }
      if (f.size > MAX_BYTES) {
        toast.error("Ukuran gambar maksimal 5MB.");
        return;
      }
    }
    setFile(f);
  }

  async function handleSubmit() {
    if (!file) {
      toast.error("Upload screenshot bukti transfer dulu.");
      return;
    }
    if (!whatsapp.trim()) {
      toast.error("Isi nomor WhatsApp agar admin bisa konfirmasi.");
      return;
    }
    setBusy(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${userId}/${crypto.randomUUID()}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from("transfer-proofs")
        .upload(path, file, { upsert: false, contentType: file.type });
      if (upErr) throw new Error(upErr.message);

      const res = await fetch("/api/manual-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          whatsapp: whatsapp.trim(),
          proofPath: path,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.orderId) {
        throw new Error(data.error || "Gagal mengirim pesanan.");
      }

      toast.success("Bukti terkirim! Mengarahkan ke WhatsApp admin...");

      const text = encodeURIComponent(
        `Halo Admin Banana Carousel 🍌\n` +
          `Saya sudah transfer manual & upload bukti.\n` +
          `Order ID: ${data.orderId}\n` +
          `Nama: ${name.trim() || "-"}\n` +
          `Email: ${email}\n` +
          `Nominal: ${formatIDR(PRICE)}\n` +
          `Mohon diverifikasi ya. Terima kasih!`,
      );

      if (ADMIN_WHATSAPP) {
        window.location.href = `https://wa.me/${ADMIN_WHATSAPP}?text=${text}`;
      } else {
        window.location.href = "/dashboard";
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengirim.");
      setBusy(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-lg space-y-6"
    >
      <div className="text-center">
        <h1 className="font-display text-3xl font-bold">Transfer Bank Manual</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Transfer{" "}
          <span className="font-semibold text-foreground">
            {formatIDR(PRICE)}
          </span>{" "}
          ke rekening di bawah, upload bukti, lalu admin akan verifikasi &
          mengaktifkan akses Anda.
        </p>
      </div>

      {/* Bank details */}
      <div className="rounded-2xl border border-border bg-card/40 p-6">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={BANK.logo}
            alt={BANK.name}
            width={44}
            height={44}
            className="size-11 rounded-md bg-white p-1"
          />
          <div>
            <p className="font-semibold">{BANK.name}</p>
            <p className="text-xs text-muted-foreground">
              a.n. {BANK.accountName}
            </p>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 py-2.5">
          <code className="font-mono text-lg font-semibold tracking-wide">
            {BANK.accountNo}
          </code>
          <CopyButton text={BANK.accountNo} label="Salin No. Rek" />
        </div>
        <div className="mt-3 flex items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 py-2.5">
          <span className="text-sm text-muted-foreground">Nominal</span>
          <div className="flex items-center gap-2">
            <code className="font-mono font-semibold">{PRICE}</code>
            <CopyButton text={String(PRICE)} label="Salin" />
          </div>
        </div>
      </div>

      {/* Proof form */}
      <div className="space-y-4 rounded-2xl border border-border bg-card/40 p-6">
        <div className="space-y-1.5">
          <Label htmlFor="t-name">Nama</Label>
          <Input
            id="t-name"
            placeholder="Nama Anda"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="t-email">Email</Label>
          <Input id="t-email" value={email} disabled readOnly />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="t-wa">No. WhatsApp</Label>
          <Input
            id="t-wa"
            type="tel"
            inputMode="tel"
            placeholder="0812xxxxxxxx"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="t-proof">Bukti Transfer (screenshot)</Label>
          <label
            htmlFor="t-proof"
            className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border bg-background px-3 py-3 text-sm text-muted-foreground hover:border-banana/50"
          >
            <Upload className="size-4 shrink-0" />
            <span className="truncate">
              {file ? file.name : "Pilih gambar bukti transfer (maks. 5MB)"}
            </span>
          </label>
          <input
            id="t-proof"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onPickFile}
          />
        </div>

        <Button
          className="w-full"
          size="lg"
          onClick={handleSubmit}
          disabled={busy}
        >
          {busy ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Mengirim...
            </>
          ) : (
            <>
              <Send className="size-4" />
              Kirim Bukti & Konfirmasi via WhatsApp
            </>
          )}
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          Setelah dikirim, Anda diarahkan ke WhatsApp admin. Akses aktif setelah
          admin verifikasi (kode akses muncul di dashboard & dikirim ke email).
        </p>
      </div>
    </motion.div>
  );
}
