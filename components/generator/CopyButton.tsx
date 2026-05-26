"use client";

import * as React from "react";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { Button, type ButtonProps } from "@/components/ui/button";

interface Props extends Omit<ButtonProps, "onClick"> {
  text: string;
  label?: string;
  successMessage?: string;
}

export function CopyButton({
  text,
  label = "Copy",
  successMessage = "Tersalin!",
  variant = "outline",
  size = "sm",
  className,
  ...rest
}: Props) {
  const [copied, setCopied] = React.useState(false);

  async function handle() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success(successMessage);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Browser tidak mengizinkan akses clipboard.");
    }
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handle}
      className={className}
      {...rest}
    >
      {copied ? (
        <>
          <Check className="size-4" />
          Tersalin
        </>
      ) : (
        <>
          <Copy className="size-4" />
          {label}
        </>
      )}
    </Button>
  );
}
