"use client";

import { useMemo, useState } from "react";
import {
  CopyableResult,
  ToolErrorResult as ErrorResult,
  ToolSectionHeader as Header,
} from "@/components/layout";
import { Input } from "@/components/ui/input";
import { convertChmod } from "@/lib/processors/devops-config-core";

export function ChmodCalculatorTab() {
  const [input, setInput] = useState("755");
  const result = useMemo(() => convertChmod(input), [input]);

  return (
    <section className="space-y-5">
      <Header
        title="Chmod Calculator"
        description="Convert three-digit octal and nine-character symbolic Unix permissions."
      />
      <label className="block max-w-md space-y-2">
        <span className="text-sm font-medium">Permissions</span>
        <Input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="755 or rwxr-xr-x"
          className="font-mono"
        />
      </label>
      {result.ok ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <CopyableResult
            value={result.value.octal}
            label="Octal"
            copyLabel="Copy octal"
            rows={1}
          />
          <CopyableResult
            value={result.value.symbolic}
            label="Symbolic"
            copyLabel="Copy symbolic"
            rows={1}
          />
          <CopyableResult
            value={result.value.command}
            label="Command"
            copyLabel="Copy command"
            rows={1}
          />
          <CopyableResult
            value={`Owner: ${result.value.owner}\nGroup: ${result.value.group}\nOthers: ${result.value.others}`}
            label="Breakdown"
            copyLabel="Copy breakdown"
            rows={3}
          />
        </div>
      ) : (
        <ErrorResult message={result.error} />
      )}
    </section>
  );
}
