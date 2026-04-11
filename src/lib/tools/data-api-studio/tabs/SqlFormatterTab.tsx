"use client";

import { useMemo, useState } from "react";
import {
  CopyableResult,
  ToolSectionHeader as Header,
} from "@/components/layout";
import { Textarea } from "@/components/ui/textarea";
import { formatSql } from "@/lib/processors/data-workflow-core";

export function SqlFormatterTab() {
  const [input, setInput] = useState(
    "select u.id,u.name from users u where u.active=true order by u.name;",
  );
  const result = useMemo(() => formatSql(input), [input]);

  return (
    <section className="space-y-5">
      <Header
        title="SQL Formatter"
        description="Format SQL locally while preserving quoted strings and identifiers."
      />
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
