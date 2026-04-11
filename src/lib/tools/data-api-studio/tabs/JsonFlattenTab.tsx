"use client";

import { useMemo, useState } from "react";
import {
  CopyableResult,
  ToolSectionHeader as Header,
} from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { flattenJson, unflattenJson } from "@/lib/processors/data-api-core";

const SAMPLE =
  '{"user":{"id":1,"display-name":"Ada"},"roles":["admin","editor"]}';

export function JsonFlattenTab() {
  const [input, setInput] = useState(SAMPLE);
  const [direction, setDirection] = useState<"flatten" | "unflatten">(
    "flatten",
  );
  const result = useMemo(
    () => (direction === "flatten" ? flattenJson(input) : unflattenJson(input)),
    [direction, input],
  );

  const switchDirection = () => {
    if (result.ok) setInput(result.value);
    setDirection((current) =>
      current === "flatten" ? "unflatten" : "flatten",
    );
  };

  return (
    <section className="space-y-5">
      <Header
        title="JSON Flatten and Unflatten"
        description="Convert nested JSON to escaped dot-and-index paths and back."
      />
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium">
          {direction === "flatten"
            ? "Nested → flattened"
            : "Flattened → nested"}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={switchDirection}
        >
          Reverse direction
        </Button>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-medium">Input</span>
          <Textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            rows={18}
            className="font-mono"
            spellCheck={false}
          />
        </label>
        <div>
          {result.ok ? (
            <CopyableResult
              value={result.value}
              label="Result"
              copyLabel="Copy result"
              rows={18}
            />
          ) : (
            <div role="alert">
              <CopyableResult
                value={result.error}
                label="Error"
                copyLabel="Copy error"
                rows={5}
                textareaClassName="border-destructive text-destructive"
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
