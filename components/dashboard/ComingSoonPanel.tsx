import { Construction } from "lucide-react";

export function ComingSoonPanel({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border py-24 text-center">
      <Construction className="size-10 text-muted-foreground" />
      <h2 className="text-lg font-semibold">{label}</h2>
      <p className="max-w-sm text-sm text-muted-foreground">
        Fitur ini belum tersedia. Kami sedang menyiapkannya — pantau terus untuk update selanjutnya.
      </p>
    </div>
  );
}
