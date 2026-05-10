"use client";

import { useMemo, useState } from "react";
import {
  CopyableResult,
  ToolErrorResult as ErrorResult,
  ToolSectionHeader as Header,
} from "@/components/layout";
import { Textarea } from "@/components/ui/textarea";
import {
  compareEnvFiles,
  parseEnvFile,
  redactEnvFile,
} from "@/lib/processors/devops-config-core";

export function EnvFileManagerTab() {
  const [left, setLeft] = useState(
    "API_URL=https://example.com\nAPI_TOKEN=secret\nDEBUG=true",
  );
  const [right, setRight] = useState(
    "API_URL=https://api.example.com\nDEBUG=true\nREGION=us-east-1",
  );
  const redacted = useMemo(() => redactEnvFile(left), [left]);
  const comparison = useMemo(() => compareEnvFiles(left, right), [left, right]);
  const parsed = useMemo(() => parseEnvFile(left), [left]);

  return (
    <section className="space-y-5">
      <Header
        title=".env File Manager"
        description="Parse, compare, and redact environment files locally. The redacted copy masks every non-empty value."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-medium">Primary .env</span>
          <Textarea
            value={left}
            onChange={(event) => setLeft(event.target.value)}
            rows={10}
            className="font-mono"
            spellCheck={false}
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium">Comparison .env</span>
          <Textarea
            value={right}
            onChange={(event) => setRight(event.target.value)}
            rows={10}
            className="font-mono"
            spellCheck={false}
          />
        </label>
      </div>
      {parsed.duplicates.length > 0 && (
        <p role="status" className="text-sm text-amber-600">
          Duplicate keys: {parsed.duplicates.join(", ")}
        </p>
      )}
      {redacted.ok && comparison.ok ? (
        <div className="space-y-4">
          <CopyableResult
            value={redacted.value}
            label="Redacted primary file"
            copyLabel="Copy redacted file"
            rows={8}
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {(
              [
                ["Only in primary", comparison.value.onlyLeft],
                ["Only in comparison", comparison.value.onlyRight],
                ["Changed", comparison.value.changed],
                ["Unchanged", comparison.value.unchanged],
              ] as const
            ).map(([label, values]) => (
              <CopyableResult
                key={label}
                value={values.join("\n") || "None"}
                label={label}
                copyLabel={`Copy ${label.toLowerCase()}`}
                rows={4}
              />
            ))}
          </div>
        </div>
      ) : (
        <ErrorResult
          message={
            !redacted.ok
              ? redacted.error
              : comparison.ok
                ? ""
                : comparison.error
          }
        />
      )}
    </section>
  );
}
