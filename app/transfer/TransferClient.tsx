"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Loader2, Send, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CopyButton } from "@/components/generator/CopyButton";
import { ADMIN_WHATSAPP, BANK, PRICE, formatIDR } from "@/lib/config/payment";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const MAX_BYTES = 5 * 1024 * 1024; // 5MB

export function TransferClient() {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [whatsapp, setWhatsapp] = React.useState("");
  const [file, setFile] = React.useState<File | null>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);
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
    const cleanEmail = email.trim().toLowerCase();
    if (!name.trim()) return toast.error("Isi nama Anda.");
    if (!EMAIL_RE.test(cleanEmail))
      return toast.error("Masukkan email yang valid — akun & kode akses dikirim ke sini.");
    if (!whatsapp.trim())
      return toast.error("Isi nomor WhatsApp agar admin bisa konfirmasi.");
    if (!file) return toast.error("Upload screenshot bukti transfer dulu.");

    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("name", name.trim());
      fd.append("email", cleanEmail);
      fd.append("whatsapp", whatsapp.trim());
      fd.append("proof", file);

      const res = await fetch("/api/manual-order", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok || !data.orderId) {
        throw new Error(data.error || "Gagal mengirim pesanan.");
      }

      toast.success("Bukti terkirim! Mengarahkan ke WhatsApp admin...");

      const text = encodeURIComponent(
        `Halo Admin Banana Carousel 🍌\n` +
          `Saya sudah transfer manual & upload bukti.\n` +
          `Order ID: ${data.orderId}\n` +
          `Nama: ${name.trim()}\n` +
          `Email: ${cleanEmail}\n` +
          `Nominal: ${formatIDR(PRICE)}\n` +
          `Mohon diverifikasi ya. Terima kasih!`,
      );

      if (ADMIN_WHATSAPP) {
        window.location.href = `https://wa.me/${ADMIN_WHATSAPP}?text=${text}`;
      } else {
        window.location.href = "/login?redirect=/dashboard";
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
          ke rekening di bawah, upload bukti, lalu admin verifikasi &
          mengaktifkan akses Anda. Akun otomatis dibuat dari email Anda.
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
          <Input
            id="t-email"
            type="email"
            inputMode="email"
            placeholder="kamu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
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
          <Label id="t-proof-label">Bukti Transfer (screenshot)</Label>
          {/* A real <button> drives the picker. The previous markup paired a
              <label htmlFor> with an input hidden via `display:none`, which
              removes it from the tab order — and labels are not focusable — so
              there was NO keyboard path to attach the proof, while submit
              requires it. Same pattern as BrandProfilesPanel's logo upload. */}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            aria-labelledby="t-proof-label"
            className="flex w-full cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border bg-background px-3 py-3 text-left text-sm text-muted-foreground transition-colors hover:border-banana/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <Upload className="size-4 shrink-0" />
            <span className="truncate">
              {file ? file.name : "Pilih gambar bukti transfer (maks. 5MB)"}
            </span>
          </button>
          {/* sr-only, not `hidden`: keeps it out of sight but still a real,
              focusable form control for assistive tech and autofill. */}
          <input
            ref={fileRef}
            id="t-proof"
            type="file"
            accept="image/*"
            className="sr-only"
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
          Setelah diverifikasi admin, akses aktif & kode akses dikirim ke email
          Anda. Masuk ke dashboard kapan saja via Magic Link di halaman Masuk.
        </p>
      </div>
    </motion.div>
  );
}
