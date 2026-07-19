"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  BarChart3,
  Check,
  KeyRound,
  Loader2,
  Mail,
  Megaphone,
  MessageCircle,
  Pencil,
  Plus,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Users,
  X,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CopyButton } from "@/components/generator/CopyButton";
import { SalesChart } from "@/components/admin/SalesChart";
import { PromotionsTab } from "@/components/admin/PromotionsTab";
import { AffiliatesTab } from "@/components/admin/AffiliatesTab";
import { USE_PRICING_V2, USE_AFFILIATE } from "@/lib/config/flags";
import { formatIDR } from "@/lib/config/payment";
import type { AdminStats, AdminUser, SalesSeries } from "@/lib/data/admin-stats";
import type { AdminOrder } from "@/lib/data/admin-orders";
import type { Announcement, TutorialConfig } from "@/lib/data/settings";

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

export function AdminClient({
  isSuper,
  stats,
  sales,
  users,
  orders,
  tutorial,
  announcement,
}: {
  isSuper: boolean;
  stats: AdminStats;
  sales: SalesSeries;
  users: AdminUser[];
  orders: AdminOrder[];
  tutorial: TutorialConfig;
  announcement: Announcement | null;
}) {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center gap-2">
        <h1 className="font-display text-3xl font-bold">
          {isSuper ? "Super Admin" : "Admin"}
        </h1>
        {!isSuper && (
          <span className="rounded-full bg-purple-500/15 px-2 py-0.5 text-xs font-semibold text-purple-400">
            Supervisor
          </span>
        )}
      </div>

      <Tabs defaultValue={isSuper ? "overview" : "users"}>
        <TabsList className="flex flex-wrap">
          {isSuper && (
            <TabsTrigger value="overview">
              <BarChart3 className="size-4" /> Ringkasan
            </TabsTrigger>
          )}
          <TabsTrigger value="users">
            <Users className="size-4" /> User
          </TabsTrigger>
          <TabsTrigger value="approval">
            <Check className="size-4" /> Approval
            {orders.length > 0 && (
              <span className="ml-1 rounded-full bg-banana px-1.5 text-[10px] font-bold text-black">
                {orders.length}
              </span>
            )}
          </TabsTrigger>
          {isSuper && (
            <>
              <TabsTrigger value="add">
                <Plus className="size-4" /> Tambah User
              </TabsTrigger>
              <TabsTrigger value="announce">
                <Megaphone className="size-4" /> Pengumuman
              </TabsTrigger>
              <TabsTrigger value="tutorial">Tutorial</TabsTrigger>
              {USE_PRICING_V2 && (
                <TabsTrigger value="promo">Promo</TabsTrigger>
              )}
              {USE_AFFILIATE && (
                <TabsTrigger value="affiliates">Affiliate</TabsTrigger>
              )}
            </>
          )}
        </TabsList>

        {isSuper && (
          <TabsContent value="overview">
            <Overview stats={stats} sales={sales} />
          </TabsContent>
        )}
        <TabsContent value="users">
          <UsersTab users={users} isSuper={isSuper} />
        </TabsContent>
        <TabsContent value="approval">
          <ApprovalTab orders={orders} />
        </TabsContent>
        {isSuper && (
          <>
            <TabsContent value="add">
              <AddUserTab />
            </TabsContent>
            <TabsContent value="announce">
              <AnnouncementTab current={announcement} />
            </TabsContent>
            <TabsContent value="tutorial">
              <TutorialTab current={tutorial} />
            </TabsContent>
            {USE_PRICING_V2 && (
              <TabsContent value="promo">
                <PromotionsTab />
              </TabsContent>
            )}
            {USE_AFFILIATE && (
              <TabsContent value="affiliates">
                <AffiliatesTab />
              </TabsContent>
            )}
          </>
        )}
      </Tabs>
    </div>
  );
}

/* ----------------------------- Ringkasan ----------------------------- */
function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card/40 p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold">{value}</p>
    </div>
  );
}

function Overview({ stats, sales }: { stats: AdminStats; sales: SalesSeries }) {
  const [period, setPeriod] = React.useState<"daily" | "weekly" | "monthly">(
    "daily",
  );
  const series =
    period === "daily" ? sales.daily : period === "weekly" ? sales.weekly : sales.monthly;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total Omset" value={formatIDR(stats.totalRevenue)} />
        <StatCard label="Total User" value={String(stats.userCount)} />
        <StatCard label="User Pro" value={String(stats.proCount)} />
        <StatCard label="Transaksi" value={String(stats.paidCount)} />
      </div>

      <div className="rounded-2xl border border-border bg-card/40 p-5">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h3 className="font-display font-semibold">Grafik Penjualan</h3>
          <div className="flex gap-1">
            {(["daily", "weekly", "monthly"] as const).map((p) => (
              <Button
                key={p}
                size="sm"
                variant={period === p ? "default" : "outline"}
                onClick={() => setPeriod(p)}
              >
                {p === "daily" ? "Harian" : p === "weekly" ? "Mingguan" : "Bulanan"}
              </Button>
            ))}
          </div>
        </div>
        <SalesChart data={series} />
      </div>
    </div>
  );
}

/* ------------------------------- Users ------------------------------- */
function UsersTab({
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
      <Input
        placeholder="Cari email / WhatsApp..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
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

/* ------------------------------ Approval ----------------------------- */
function ApprovalTab({ orders }: { orders: AdminOrder[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = React.useState<string | null>(null);

  async function act(orderId: string, action: "approve" | "reject") {
    setBusyId(orderId);
    try {
      const res = await fetch(`/api/admin/orders/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Gagal.");
      toast.success(action === "approve" ? "Disetujui." : "Ditolak.");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal.");
    } finally {
      setBusyId(null);
    }
  }

  if (orders.length === 0)
    return (
      <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
        Tidak ada transfer manual menunggu approval. 🎉
      </div>
    );

  return (
    <div className="space-y-4">
      {orders.map((o) => (
        <div key={o.id} className="rounded-2xl border border-border bg-card/40 p-5">
          <div className="flex flex-col gap-4 sm:flex-row">
            {o.proofSignedUrl ? (
              <a href={o.proofSignedUrl} target="_blank" rel="noopener noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={o.proofSignedUrl}
                  alt="Bukti"
                  className="h-32 w-32 rounded-lg border border-border object-cover"
                />
              </a>
            ) : (
              <div className="flex h-32 w-32 items-center justify-center rounded-lg border border-dashed text-xs text-muted-foreground">
                Tanpa bukti
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{o.name || "(tanpa nama)"}</p>
              <p className="truncate text-sm text-muted-foreground">{o.email}</p>
              <p className="text-sm text-muted-foreground">WA: {o.whatsapp || "-"}</p>
              <p className="mt-1 text-sm font-semibold">{formatIDR(o.amount)}</p>
              <div className="mt-4 flex gap-2">
                <Button size="sm" onClick={() => act(o.id, "approve")} disabled={busyId === o.id}>
                  {busyId === o.id ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                  Approve
                </Button>
                <Button size="sm" variant="outline" onClick={() => act(o.id, "reject")} disabled={busyId === o.id}>
                  <X className="size-4" /> Tolak
                </Button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ----------------------------- Add user ------------------------------ */
function AddUserTab() {
  const router = useRouter();
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
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-md space-y-3 rounded-2xl border border-border bg-card/40 p-6">
      <p className="text-sm text-muted-foreground">
        Tambah user manual (mis. promo gratis). Akun dibuat + akses Pro lifetime +
        license key dikirim ke email.
      </p>
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
      <Button onClick={submit} disabled={busy} className="w-full">
        {busy ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
        Tambah & Aktifkan Pro
      </Button>
    </div>
  );
}

/* --------------------------- Announcement ---------------------------- */
function AnnouncementTab({ current }: { current: Announcement | null }) {
  const router = useRouter();
  const [title, setTitle] = React.useState(current?.title ?? "");
  const [message, setMessage] = React.useState(current?.message ?? "");
  const [active, setActive] = React.useState(current?.active ?? false);
  const [busy, setBusy] = React.useState(false);

  async function save() {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/announcement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, message, active }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success("Pengumuman disimpan.");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-md space-y-3 rounded-2xl border border-border bg-card/40 p-6">
      <p className="text-sm text-muted-foreground">
        Banner pengumuman (mis. maintenance) tampil di dashboard & generator saat
        aktif.
      </p>
      <div className="space-y-1.5">
        <Label htmlFor="an-title">Judul</Label>
        <Input id="an-title" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="an-msg">Pesan</Label>
        <Textarea id="an-msg" rows={3} value={message} onChange={(e) => setMessage(e.target.value)} />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={active}
          onChange={(e) => setActive(e.target.checked)}
          className="size-4"
        />
        Aktifkan banner
      </label>
      <Button onClick={save} disabled={busy} className="w-full">
        {busy ? <Loader2 className="size-4 animate-spin" /> : <Megaphone className="size-4" />}
        Simpan Pengumuman
      </Button>
    </div>
  );
}

/* ----------------------------- Tutorial ------------------------------ */
function TutorialTab({ current }: { current: TutorialConfig }) {
  const router = useRouter();
  const [youtubeId, setYoutubeId] = React.useState(current.youtubeId);
  const [steps, setSteps] = React.useState(
    current.steps.length ? current.steps : [{ title: "", body: "" }],
  );
  const [busy, setBusy] = React.useState(false);

  function update(i: number, field: "title" | "body", val: string) {
    setSteps((s) => s.map((x, idx) => (idx === i ? { ...x, [field]: val } : x)));
  }
  function addStep() {
    setSteps((s) => [...s, { title: "", body: "" }]);
  }
  function removeStep(i: number) {
    setSteps((s) => s.filter((_, idx) => idx !== i));
  }

  async function save() {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/tutorial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ youtubeId, steps }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success("Tutorial diperbarui.");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-4 rounded-2xl border border-border bg-card/40 p-6">
      <div className="space-y-1.5">
        <Label htmlFor="tut-yt">YouTube Video ID</Label>
        <Input
          id="tut-yt"
          placeholder="contoh: L6A0Kh0Iz0U"
          value={youtubeId}
          onChange={(e) => setYoutubeId(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          ID saja (bagian setelah watch?v= atau youtu.be/).
        </p>
      </div>

      <div className="space-y-3">
        <Label>Langkah Tutorial</Label>
        {steps.map((s, i) => (
          <div key={i} className="space-y-2 rounded-lg border border-border p-3">
            <div className="flex items-center gap-2">
              <Input
                placeholder={`Judul langkah ${i + 1}`}
                value={s.title}
                onChange={(e) => update(i, "title", e.target.value)}
              />
              <Button
                size="icon"
                variant="ghost"
                onClick={() => removeStep(i)}
                aria-label="Hapus langkah"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
            <Textarea
              rows={2}
              placeholder="Isi langkah"
              value={s.body}
              onChange={(e) => update(i, "body", e.target.value)}
            />
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={addStep}>
          <Plus className="size-4" /> Tambah Langkah
        </Button>
      </div>

      <Button onClick={save} disabled={busy} className="w-full">
        {busy ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
        Simpan Tutorial
      </Button>
    </div>
  );
}
