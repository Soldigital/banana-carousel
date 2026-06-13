import Link from "next/link";
import { Rocket } from "lucide-react";
import { listFounders } from "@/lib/data/founders";
import { FOUNDING_CAP } from "@/lib/config/payment";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Founding Members — Banana Carousel",
  description: "100 Founding Members pertama Banana Carousel.",
};

export default async function FoundersPage() {
  const founders = await listFounders();

  return (
    <main className="container py-16 sm:py-24">
      <div className="mx-auto max-w-2xl text-center space-y-3">
        <div className="inline-flex items-center gap-2 text-xs font-semibold text-banana">
          <Rocket className="size-3.5" />
          FOUNDING MEMBERS
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">
          100 Founding Members Pertama
        </h1>
        <p className="text-muted-foreground">
          Mereka yang percaya sejak awal. {founders.length}/{FOUNDING_CAP} slot
          terisi.
        </p>
      </div>

      {founders.length === 0 ? (
        <p className="mx-auto mt-10 max-w-md rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Belum ada Founding Member. Jadilah yang pertama!{" "}
          <Link href="/#pricing" className="font-semibold text-banana hover:underline">
            Lihat harga →
          </Link>
        </p>
      ) : (
        <div className="mx-auto mt-10 grid max-w-4xl gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {founders.map((f) => (
            <div
              key={f.number}
              className="flex items-center gap-3 rounded-xl border border-border bg-card/40 p-3"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-banana/15 text-xs font-bold text-banana">
                {String(f.number).padStart(3, "0")}
              </span>
              <span className="truncate font-semibold">{f.label}</span>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
