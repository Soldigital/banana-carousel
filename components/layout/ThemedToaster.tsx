"use client";

import { useTheme } from "next-themes";
import { Toaster } from "sonner";

// Toasts are this app's primary error channel (AI failures, checkout errors),
// so they must be readable in whichever theme the user is on. The Toaster was
// previously hardcoded to theme="dark", which rendered dark toasts over the
// light theme.
//
// `resolvedTheme` rather than `theme`: `theme` can be the literal "system".
// Falls back to "dark" before hydration, matching defaultTheme in app/layout.
export function ThemedToaster() {
  const { resolvedTheme } = useTheme();
  return (
    <Toaster
      position="top-center"
      theme={resolvedTheme === "light" ? "light" : "dark"}
      richColors
      closeButton
    />
  );
}
