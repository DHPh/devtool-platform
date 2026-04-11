"use client";

import { useMemo, useState } from "react";
import {
  CopyableResult,
  ToolSectionHeader as Header,
} from "@/components/layout";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  dataToSql,
  type SqlDialect,
} from "@/lib/processors/data-workflow-core";

const DATA_SQL_SAMPLE = `[
  { "name": "Ada", "active": true, "score": 98 },
  { "name": "Grace", "active": true, "score": 96 }
]`;

export function DataToSqlTab() {
  const [input, setInput] = useState(DATA_SQL_SAMPLE);
  const [table, setTable] = useState("users");
  const [dialect, setDialect] = useState<SqlDialect>("postgresql");
  const result = useMemo(
    () => dataToSql(input, table, dialect),
    [input, table, dialect],
  );

  return (
    <section className="space-y-5">
      <Header
        title="Data to SQL Generator"
        description="Generate escaped literal INSERT statements for PostgreSQL, MySQL, or SQLite. Review before execution."
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-medium">Table</span>
          <Input
            value={table}
            onChange={(event) => setTable(event.target.value)}
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium">Dialect</span>
          <Select
            value={dialect}
            onValueChange={(value) => setDialect(value as SqlDialect)}
          >
            <SelectTrigger aria-label="Dialect">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(["postgresql", "mysql", "sqlite"] as const).map((value) => (
                <SelectItem key={value} value={value}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
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
