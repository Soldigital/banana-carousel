"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  KeyRound,
  Loader2,
  Mail,
  MessageCircle,
  Pencil,
  Plus,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CopyButton } from "@/components/generator/CopyButton";
import type { AdminUser } from "@/lib/data/admin-stats";

function waLink(num: string | null | undefined): string | null {
  const d = String(num ?? "").replace(/\D/g, "");
  if (!d) return null;
  const intl = d.startsWith("0") ? "62" + d.slice(1) : d;
  return `https://wa.me/${intl}`;
}

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

// Extracted verbatim from the former app/admin/AdminClient.tsx `UsersTab` (+
// its dialogs) — logic unchanged, only relocated to /admin/users. "Tambah
// User" (formerly its own tab) is folded in here as a dialog per the redesign
// plan, since it's a micro-action tightly coupled to user management rather
// than a standalone destination.
export function UsersPanel({
  users,
  isSuper,
}: {
  users: AdminUser[];
  isSuper: boolean;
}) {
  const router = useRouter();
  const [q, setQ] = React.useState("");
  const [emailFor, setEmailFor] = React.useState<AdminUser | null>(null);
  const [waFor, setWaFor] = React.useState<AdminUser | null>(null);
  const [editFor, setEditFor] = React.useState<AdminUser | null>(null);
  const [addOpen, setAddOpen] = React.useState(false);
  const [busyId, setBusyId] = React.useState<string | null>(null);

  const filtered = users.filter(
    (u) =>
      u.email.toLowerCase().includes(q.toLowerCase()) ||
      (u.name ?? "").toLowerCase().includes(q.toLowerCase()) ||
      (u.whatsapp ?? "").includes(q),
  );

  async function setRole(u: AdminUser, role: "user" | "supervisor") {
    if (!confirm(`Ubah role ${u.email} menjadi ${role}?`)) return;
    setBusyId(u.id + ":role");
    try {
      const res = await fetch("/api/admin/role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: u.id, role }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success("Role diperbarui.");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal");
    } finally {
      setBusyId(null);
    }
  }

  async function resend(u: AdminUser) {
    setBusyId(u.id + ":resend");
    try {
      const res = await fetch("/api/admin/resend-license", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: u.email }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success("License key dikirim ke " + u.email);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal");
    } finally {
      setBusyId(null);
    }
  }

  async function toggleBan(u: AdminUser) {
    const action = u.banned ? "unban" : "ban";
    if (!confirm(`Yakin ${action} ${u.email}?`)) return;
    setBusyId(u.id + ":ban");
    try {
      const res = await fetch("/api/admin/ban", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: u.id, banned: !u.banned }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success(u.banned ? "User diaktifkan kembali." : "User di-ban.");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input
          placeholder="Cari email / WhatsApp..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        {isSuper && (
          <Button onClick={() => setAddOpen(true)} className="shrink-0">
            <Plus className="size-4" /> Tambah User
          </Button>
        )}
      </div>
      <p className="text-xs text-muted-foreground">{filtered.length} user</p>

      <div className="space-y-2">
        {filtered.map((u) => {
          return (
            <div
              key={u.id}
              className="rounded-xl border border-border bg-card/40 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{u.name || u.email}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {u.name ? `${u.email} · ` : ""}
                    {u.whatsapp || "tanpa WA"} · {fmtDate(u.created_at)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1">
                  {u.role === "supervisor" && (
                    <span className="rounded-full bg-purple-500/15 px-2 py-0.5 text-[10px] font-semibold text-purple-400">
                      Supervisor
                    </span>
                  )}
                  {u.banned ? (
                    <span className="rounded-full bg-destructive/15 px-2 py-0.5 text-[10px] font-semibold text-destructive">
                      Banned
                    </span>
                  ) : u.is_pro ? (
                    <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-500">
                      Pro
                    </span>
                  ) : (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                      Free
                    </span>
                  )}
                </div>
              </div>

              {u.access_code && (
                <div className="mt-3 flex items-center gap-2">
                  <code className="block flex-1 overflow-x-auto rounded border border-border bg-background px-2 py-1 font-mono text-[10px]">
                    {u.access_code}
                  </code>
                  <CopyButton text={u.access_code} label="Key" />
                </div>
              )}

              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => resend(u)}
                  disabled={busyId === u.id + ":resend"}
                >
                  {busyId === u.id + ":resend" ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <KeyRound className="size-3.5" />
                  )}
                  Kirim Key
                </Button>
                <Button size="sm" variant="outline" onClick={() => setEmailFor(u)}>
                  <Mail className="size-3.5" /> Email
                </Button>
                <Button size="sm" variant="outline" onClick={() => setWaFor(u)}>
                  <MessageCircle className="size-3.5" /> WhatsApp
                </Button>
                {isSuper && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditFor(u)}
                    >
                      <Pencil className="size-3.5" /> Edit
                    </Button>
                    <Button
                      size="sm"
                      variant={u.banned ? "outline" : "destructive"}
                      onClick={() => toggleBan(u)}
                      disabled={busyId === u.id + ":ban"}
                    >
                      {busyId === u.id + ":ban" ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : u.banned ? (
                        <ShieldCheck className="size-3.5" />
                      ) : (
                        <ShieldAlert className="size-3.5" />
                      )}
                      {u.banned ? "Aktifkan" : "Ban"}
                    </Button>
                    <select
                      value={u.role}
                      disabled={busyId === u.id + ":role"}
                      onChange={(e) =>
                        setRole(u, e.target.value as "user" | "supervisor")
                      }
                      className="h-9 rounded-lg border border-input bg-background px-2 text-xs"
                    >
                      <option value="user">Role: User</option>
                      <option value="supervisor">Role: Supervisor</option>
                    </select>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <EmailDialog user={emailFor} onClose={() => setEmailFor(null)} />
      <WhatsappDialog user={waFor} onClose={() => setWaFor(null)} />
      <EditUserDialog
        user={editFor}
        onClose={() => setEditFor(null)}
        onSaved={() => {
          setEditFor(null);
          router.refresh();
        }}
      />
      <AddUserDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdded={() => {
          setAddOpen(false);
          router.refresh();
        }}
      />
    </div>
  );
}

const WA_TEMPLATES: { label: string; text: string }[] = [
  {
    label: "Konfirmasi pembayaran",
    text: "Halo {nama} 👋, pembayaran Anda untuk Banana Carousel sudah kami terima & akses lifetime sudah AKTIF. License key dikirim ke email terdaftar. Selamat berkarya! 🍌",
  },
  {
    label: "Kirim ulang license",
    text: "Halo {nama} 👋, berikut info akses Banana Carousel Anda — license key sudah kami kirim ulang ke email terdaftar. Mohon cek inbox/spam ya 🙏",
  },
  {
    label: "Reminder transfer",
    text: "Halo {nama} 👋, kami belum menerima konfirmasi transfer Anda untuk Banana Carousel. Jika sudah transfer, mohon kirim bukti agar akses kami aktifkan. Terima kasih 🙏",
  },
  {
    label: "Info promo",
    text: "Halo {nama} 🎉, ada promo spesial dari Banana Carousel untuk Anda! Balas pesan ini untuk info lebih lanjut ya 😊",
  },
  {
    label: "Sapaan / bantuan",
    text: "Halo {nama} 😊, ada yang bisa kami bantu terkait Banana Carousel?",
  },
];

function WhatsappDialog({
  user,
  onClose,
}: {
  user: AdminUser | null;
  onClose: () => void;
}) {
  const [text, setText] = React.useState("");
  React.useEffect(() => {
    setText("");
  }, [user]);

  function apply(t: string) {
    setText(t.split("{nama}").join(user?.name || "Kak"));
  }
  function openWa() {
    const wa = waLink(user?.whatsapp);
    if (!wa) return toast.error("User belum punya nomor WhatsApp.");
    window.open(`${wa}?text=${encodeURIComponent(text)}`, "_blank");
    onClose();
  }

  return (
    <Dialog open={!!user} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>WhatsApp ke {user?.name || user?.email}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {WA_TEMPLATES.map((t) => (
              <Button
                key={t.label}
                size="sm"
                variant="outline"
                onClick={() => apply(t.text)}
              >
                {t.label}
              </Button>
            ))}
          </div>
          <Textarea
            rows={5}
            placeholder="Pilih template di atas atau tulis pesan custom..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Nomor: {user?.whatsapp || "— (tidak ada)"}
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button onClick={openWa} disabled={!text.trim()}>
            <MessageCircle className="size-4" /> Buka WhatsApp
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditUserDialog({
  user,
  onClose,
  onSaved,
}: {
  user: AdminUser | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = React.useState("");
  const [whatsapp, setWhatsapp] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    setName(user?.name ?? "");
    setWhatsapp(user?.whatsapp ?? "");
  }, [user]);

  async function save() {
    if (!user) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/update-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, name, whatsapp }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success("Data user disimpan.");
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={!!user} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Data User</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Email (terkunci)</Label>
            <Input value={user?.email ?? ""} disabled readOnly />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="eu-name">Nama</Label>
            <Input
              id="eu-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="eu-wa">No. WhatsApp</Label>
            <Input
              id="eu-wa"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Batal
          </Button>
          <Button onClick={save} disabled={busy}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : null}
            Simpan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EmailDialog({
  user,
  onClose,
}: {
  user: AdminUser | null;
  onClose: () => void;
}) {
  const [subject, setSubject] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  async function send() {
    if (!user) return;
    if (!subject.trim() || !message.trim())
      return toast.error("Subjek & pesan wajib.");
    setBusy(true);
    try {
      const res = await fetch("/api/admin/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: user.email, subject, message }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success("Email terkirim ke " + user.email);
      setSubject("");
      setMessage("");
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={!!user} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Kirim Email ke {user?.email}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="em-sub">Subjek</Label>
            <Input
              id="em-sub"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="em-msg">Pesan</Label>
            <Textarea
              id="em-msg"
              rows={6}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Batal
          </Button>
          <Button onClick={send} disabled={busy}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />}
            Kirim
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Formerly the standalone "Tambah User" tab — folded into a dialog here
// (logic unchanged) since it's a micro-action on user management, not a
// standalone sidebar destination.
function AddUserDialog({
  open,
  onClose,
  onAdded,
}: {
  open: boolean;
  onClose: () => void;
  onAdded: () => void;
}) {
  const [email, setEmail] = React.useState("");
  const [name, setName] = React.useState("");
  const [whatsapp, setWhatsapp] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  async function submit() {
    if (!email.trim()) return toast.error("Email wajib.");
    setBusy(true);
    try {
      const res = await fetch("/api/admin/add-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, whatsapp }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success("User ditambahkan & akses Pro aktif. Email terkirim.");
      setEmail("");
      setName("");
      setWhatsapp("");
      onAdded();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Tambah User</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Tambah user manual (mis. promo gratis). Akun dibuat + akses Pro lifetime +
          license key dikirim ke email.
        </p>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="au-email">Email *</Label>
            <Input id="au-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="au-name">Nama</Label>
            <Input id="au-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="au-wa">No. WhatsApp</Label>
            <Input id="au-wa" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Batal
          </Button>
          <Button onClick={submit} disabled={busy}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
            Tambah & Aktifkan Pro
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
