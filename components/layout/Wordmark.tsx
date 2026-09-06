import { cn } from "@/lib/utils";

// Full brand lockup (banana + pen mark plus the "Banana Carousel" wordmark).
//
// Two files, swapped by CSS rather than by reading the theme in JS: the word
// "Banana" is black in the light asset and white in the dark one, and Tailwind
// is on darkMode:"class", so `dark:` variants resolve from the class next-themes
// puts on <html>. Doing it in CSS keeps this a server component and avoids the
// hydration mismatch (and first-paint flash) a useTheme() read would introduce.
//
// Intrinsic size is 464x130; width/height are set so the browser reserves the
// right box and the header doesn't shift while the PNG loads. Callers size it
// with a height class (e.g. "h-7") — the width follows via `w-auto`.
export function Wordmark({
  className,
  priority = false,
}: {
  className?: string;
  priority?: boolean;
}) {
  const common = "w-auto select-none";
  const loading = priority ? undefined : ("lazy" as const);
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/wordmark-light.png"
        alt="Banana Carousel"
        width={464}
        height={130}
        loading={loading}
        decoding="async"
        className={cn(common, "block dark:hidden", className)}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/wordmark-dark.png"
        alt=""
        aria-hidden
        width={464}
        height={130}
        loading={loading}
        decoding="async"
        className={cn(common, "hidden dark:block", className)}
      />
    </>
  );
}
