"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export type ClipboardStatus = "idle" | "copying" | "copied" | "error";

export async function writeClipboardText(
  value: string,
  { reportError = true }: { reportError?: boolean } = {},
) {
  if (!value) return false;
  try {
    if (!navigator.clipboard?.writeText) {
      throw new Error("Clipboard API unavailable");
    }
    await navigator.clipboard.writeText(value);
    return true;
  } catch (error) {
    if (reportError) toast.error("Failed to copy to clipboard");
    throw error;
  }
}

interface UseClipboardOptions {
  resetAfter?: number;
  successMessage?: string;
  errorMessage?: string;
}

export function useClipboard({
  resetAfter = 2_000,
  successMessage = "Copied to clipboard!",
  errorMessage = "Failed to copy to clipboard",
}: UseClipboardOptions = {}) {
  const [status, setStatus] = useState<ClipboardStatus>("idle");
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearResetTimer = useCallback(() => {
    if (resetTimer.current) {
      clearTimeout(resetTimer.current);
      resetTimer.current = null;
    }
  }, []);

  useEffect(() => clearResetTimer, [clearResetTimer]);

  const copy = useCallback(
    async (value: string) => {
      if (!value || status === "copying") return false;

      clearResetTimer();
      setStatus("copying");

      try {
        await writeClipboardText(value, { reportError: false });
        setStatus("copied");
        toast.success(successMessage);
        resetTimer.current = setTimeout(() => {
          setStatus("idle");
          resetTimer.current = null;
        }, resetAfter);
        return true;
      } catch {
        setStatus("error");
        toast.error(errorMessage);
        resetTimer.current = setTimeout(() => {
          setStatus("idle");
          resetTimer.current = null;
        }, resetAfter);
        return false;
      }
    },
    [
      clearResetTimer,
      errorMessage,
      resetAfter,
      status,
      successMessage,
    ],
  );

  return {
    copy,
    status,
    isPending: status === "copying",
    copied: status === "copied",
    hasError: status === "error",
  };
}
