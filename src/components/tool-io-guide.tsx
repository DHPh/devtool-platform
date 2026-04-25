"use client";

import { useState } from "react";
import { BookOpen, ChevronDown, Copy } from "lucide-react";
import { toast } from "sonner";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { writeClipboardText } from "@/hooks/use-clipboard";

interface ToolIoExample {
  input?: string;
  output?: string;
}

interface ToolIoGuideProps {
  inputDescription?: string;
  outputDescription?: string;
  example?: ToolIoExample;
}

export function ToolIoGuide({
  inputDescription,
  outputDescription,
  example,
}: ToolIoGuideProps) {
  const [open, setOpen] = useState(false);

  if (!inputDescription && !outputDescription && !example) {
    return null;
  }

  const copyExampleInput = async () => {
    if (!example?.input) return;
    try {
      await writeClipboardText(example.input);
      toast.success("Example input copied to clipboard");
    } catch {
      toast.error("Failed to copy example input");
    }
  };

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="mb-5 rounded-lg border bg-muted/25"
    >
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left text-xs sm:text-sm hover:bg-muted/40 transition-colors rounded-lg"
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <BookOpen className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="font-medium shrink-0">Input / Output & Example</span>
            {(inputDescription || outputDescription) && (
              <span className="hidden md:inline text-xs text-muted-foreground truncate">
                — {inputDescription ?? outputDescription}
              </span>
            )}
          </div>
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground shrink-0">
            <span>{open ? "Hide" : "Details"}</span>
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-150 ${
                open ? "rotate-180" : ""
              }`}
            />
          </span>
        </button>
      </CollapsibleTrigger>

      <CollapsibleContent className="border-t px-4 py-3.5 space-y-3">
        {(inputDescription || outputDescription) && (
          <div className="grid gap-4 sm:grid-cols-2">
            {inputDescription && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                  Input
                </h3>
                <p className="text-sm text-foreground/90">{inputDescription}</p>
              </div>
            )}
            {outputDescription && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                  Output
                </h3>
                <p className="text-sm text-foreground/90">
                  {outputDescription}
                </p>
              </div>
            )}
          </div>
        )}

        {example && (example.input || example.output) && (
          <div className="grid gap-3 sm:grid-cols-2">
            {example.input && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Example input
                  </h4>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={copyExampleInput}
                    className="h-6 px-2 text-xs"
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copy
                  </Button>
                </div>
                <pre className="whitespace-pre-wrap rounded-md border bg-background p-3 text-xs font-mono break-all max-h-40 overflow-y-auto">
                  {example.input}
                </pre>
              </div>
            )}
            {example.output && (
              <div>
                <div className="flex items-center h-6 mb-1">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Expected output
                  </h4>
                </div>
                <pre className="whitespace-pre-wrap rounded-md border bg-background p-3 text-xs font-mono break-all max-h-40 overflow-y-auto">
                  {example.output}
                </pre>
              </div>
            )}
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
