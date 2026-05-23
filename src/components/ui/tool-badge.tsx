import { cn } from "@/lib/utils";

interface ToolMonogramProps {
  code: string;
  size?: "xs" | "sm" | "md";
  active?: boolean;
  className?: string;
}

const SIZE_CLASSES = {
  xs: "h-5 min-w-[2.125rem] px-1 text-[10px]",
  sm: "h-6 min-w-[2.5rem] px-1.5 text-[11px]",
  md: "h-8 min-w-[3rem] px-2 text-xs",
} as const;

export function ToolMonogram({
  code,
  size = "sm",
  active = false,
  className,
}: ToolMonogramProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex items-center justify-center shrink-0 rounded-sm border font-mono font-semibold tracking-tight tabular-nums select-none",
        active
          ? "border-primary/40 bg-accent text-accent-foreground"
          : "border-border bg-surface-sunken text-muted-foreground",
        SIZE_CLASSES[size],
        className,
      )}
    >
      {code}
    </span>
  );
}
