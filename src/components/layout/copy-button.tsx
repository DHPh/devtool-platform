"use client";

import { Check, Copy, Loader2, TriangleAlert } from "lucide-react";

import { Button, type ButtonProps } from "@/components/ui/button";
import { useClipboard } from "@/hooks/use-clipboard";
import { cn } from "@/lib/utils";

interface CopyButtonProps
  extends Omit<ButtonProps, "onClick" | "value" | "aria-label"> {
  value: string;
  label?: string;
  copiedLabel?: string;
  successMessage?: string;
  errorMessage?: string;
  resetAfter?: number;
  showText?: boolean;
}

export function CopyButton({
  value,
  label = "Copy",
  copiedLabel = "Copied",
  successMessage,
  errorMessage,
  resetAfter,
  showText = true,
  className,
  disabled,
  variant = "ghost",
  size = "sm",
  ...props
}: CopyButtonProps) {
  const { copy, copied, hasError, isPending } = useClipboard({
    successMessage,
    errorMessage,
    resetAfter,
  });
  const stateLabel = copied
    ? copiedLabel
    : hasError
      ? `${label} failed`
      : isPending
        ? `Copying ${label.replace(/^copy\s*/i, "")}`.trim()
        : label;

  return (
    <Button
      {...props}
      type="button"
      variant={variant}
      size={size}
      className={cn("shrink-0", className)}
      disabled={disabled || !value || isPending}
      aria-label={stateLabel}
      aria-live="polite"
      onClick={() => void copy(value)}
    >
      {isPending ? (
        <Loader2 className="animate-spin" />
      ) : copied ? (
        <Check className="text-green-600" />
      ) : hasError ? (
        <TriangleAlert className="text-destructive" />
      ) : (
        <Copy />
      )}
      {showText && <span>{copied ? copiedLabel : label}</span>}
    </Button>
  );
}
