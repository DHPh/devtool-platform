"use client";

import type { ButtonProps } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AlertTriangle, Loader2 } from "lucide-react";
import { CopyButton } from "./copy-button";

export function ToolSectionHeader({
  title,
  description,
  actions,
  titleId,
  className,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  titleId?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <div className="space-y-1">
        <h2 id={titleId} className="text-2xl font-semibold">{title}</h2>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions}
    </div>
  );
}

export function ToolErrorResult({
  children,
  message,
  className,
}: {
  children?: React.ReactNode;
  message?: string;
  className?: string;
}) {
  const content = children ?? message;
  return (
    <div
      role="alert"
      className={cn(
        "flex gap-2 rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive",
        className,
      )}
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0 flex-1">{content}</div>
      {message && (
        <CopyButton
          value={message}
          label="Copy error"
          copiedLabel="Error copied"
          showText={false}
          className="-my-1 h-7 w-7 p-0"
        />
      )}
    </div>
  );
}

export function AsyncActionButton({
  pending,
  pendingLabel = "Working…",
  children,
  disabled,
  ...props
}: ButtonProps & { pending: boolean; pendingLabel?: string }) {
  return (
    <Button {...props} disabled={disabled || pending} aria-busy={pending}>
      {pending && <Loader2 className="animate-spin" />}
      {pending ? pendingLabel : children}
    </Button>
  );
}
