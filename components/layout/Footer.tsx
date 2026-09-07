import Link from "next/link";
import { Mail, Send } from "lucide-react";
import { Wordmark } from "./Wordmark";
import { ADMIN_WHATSAPP } from "@/lib/config/payment";

// Server component. Rendered on /, /login, /activate, /transfer and
// /reset-password, so keep links here globally valid (anchors are absolute
// "/#..." rather than bare "#..." for that reason).

const NAV = [
  { href: "/#features", label: "Fitur" },
  { href: "/#services", label: "Layanan" },
  { href: "/#pricing", label: "Harga" },
  { href: "/#hasil", label: "Contoh Hasil" },
  { href: "/#faq", label: "FAQ" },
  { href: "/#about", label: "Tentang" },
] as const;

export function Footer() {
  const year = new Date().getFullYear();
  const waHref = ADMIN_WHATSAPP ? `https://wa.me/${ADMIN_WHATSAPP}` : null;

  return (
    <footer className="border-t border-border/60 mt-16 sm:mt-24">
      <div className="container py-10 sm:py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-10">
          <div className="md:col-span-2 space-y-3">
            <Wordmark className="h-6" />
            <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
              Ubah ide sederhana jadi prompt carousel Instagram premium yang siap
              di-generate — lengkap dengan hook, arahan visual, dan caption.
            </p>
            {/* Previously read "No data stored on our servers", which stopped
                being true once the AI Gateway began storing BYOK keys
                server-side. */}
            <p className="text-xs text-muted-foreground/80">
              BYOK · API key Anda disimpan terenkripsi AES-256-GCM
            </p>
          </div>

          <div>
            <h4 className="font-display font-bold text-sm mb-3">Navigasi</h4>
            <ul className="space-y-2 text-sm">
              {NAV.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-muted-foreground hover:text-banana transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display font-bold text-sm mb-3">Kontak</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="https://t.me/BananaCarousel"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-banana transition-colors"
                >
                  <Send className="size-3.5" />
                  Channel Telegram
                </a>
              </li>
              {waHref && (
                <li>
                  <a
                    href={waHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-banana transition-colors"
                  >
                    <Mail className="size-3.5" />
                    WhatsApp admin
                  </a>
                </li>
              )}
              <li className="pt-1">
                <Link
                  href="/#pricing"
                  className="font-semibold text-banana hover:underline underline-offset-4"
                >
                  Beli akses →
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-border/60 pt-6 text-xs text-muted-foreground">
          <p>
            &copy; {year} Banana Carousel · Built for Indonesian creators
          </p>
        </div>
      </div>
    </footer>
  );
}
