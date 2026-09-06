import { cn } from "@/lib/utils";

// Square app mark (banana + pen nib on the brand yellow tile). Used where the
// full lockup doesn't fit — most importantly the dashboard sidebar, which
// collapses to icon-only and pairs the mark with its own two-line label.
//
// The asset already carries the yellow tile and its rounded corners, so no
// gradient/background is applied here; `rounded-lg` only clips our own corners
// to match the surrounding UI. Served at 64px, which covers every current use
// (size-6 to size-8) at 2x DPR.
export function Logo({ className }: { className?: string }) {
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src="/brand/icon-64.png"
      alt=""
      aria-hidden
      width={64}
      height={64}
      decoding="async"
      className={cn("inline-block rounded-lg select-none", className)}
    />
  );
}
