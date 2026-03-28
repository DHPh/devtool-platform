"use client";

import { BookOpen, CircleHelp } from "lucide-react";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  getToolGlossary,
  type ToolGlossaryTerm,
} from "@/lib/tool-glossary";
import { cn } from "@/lib/utils";

export function TermHelp({
  children,
  definition,
  className,
}: {
  children: React.ReactNode;
  definition: string;
  className?: string;
}) {
  return (
    <TooltipProvider>
      <span className={cn("inline-flex items-center gap-1", className)}>
        {children}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="rounded-full text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Explain this term"
            >
              <CircleHelp className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p>{definition}</p>
          </TooltipContent>
        </Tooltip>
      </span>
    </TooltipProvider>
  );
}

export function ToolGlossary({
  toolId,
  terms,
}: {
  toolId?: string;
  terms?: ToolGlossaryTerm[];
}) {
  const glossary = terms ?? (toolId ? getToolGlossary(toolId) : []);
  if (!glossary.length) return null;

  return (
    <section
      aria-labelledby={`${toolId ?? "tool"}-terms-title`}
      className="mt-8 border-t pt-6"
    >
      <div className="mb-4 flex items-start gap-3">
        <BookOpen className="mt-0.5 h-5 w-5 text-muted-foreground" />
        <div>
          <h2
            id={`${toolId ?? "tool"}-terms-title`}
            className="text-lg font-semibold"
          >
            Terms explained
          </h2>
          <p className="text-sm text-muted-foreground">
            Plain-language definitions for technical terms used by this tool.
          </p>
        </div>
      </div>
      <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
        {glossary.map(({ term, definition }) => (
          <div key={term}>
            <dt className="text-sm font-medium">{term}</dt>
            <dd className="mt-1 text-sm leading-relaxed text-muted-foreground">
              {definition}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
