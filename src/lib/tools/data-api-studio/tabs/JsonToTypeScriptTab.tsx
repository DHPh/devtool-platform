"use client";

import { useMemo, useState } from "react";
import {
  CopyableResult,
  ToolSectionHeader as Header,
} from "@/components/layout";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { jsonToTypeScript } from "@/lib/processors/data-api-core";

const SAMPLE =
  '{"user":{"id":1,"display-name":"Ada"},"roles":["admin","editor"]}';

export function JsonToTypeScriptTab() {
  const [input, setInput] = useState(SAMPLE);
  const [name, setName] = useState("ApiResponse");
  const result = useMemo(() => jsonToTypeScript(input, name), [input, name]);

  return (
    <section className="space-y-5">
      <Header
        title="JSON to TypeScript"
        description="Infer a TypeScript type without evaluating code or uploading data."
      />
      <label className="block max-w-sm space-y-2">
        <span className="text-sm font-medium">Root type name</span>
        <Input value={name} onChange={(event) => setName(event.target.value)} />
      </label>
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
