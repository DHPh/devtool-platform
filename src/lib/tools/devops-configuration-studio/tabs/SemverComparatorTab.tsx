"use client";

import { useMemo, useState } from "react";
import {
  CopyableResult,
  ToolErrorResult as ErrorResult,
  ToolSectionHeader as Header,
} from "@/components/layout";
import { Input } from "@/components/ui/input";
import { compareSemanticVersions } from "@/lib/processors/devops-config-core";

export function SemverComparatorTab() {
  const [left, setLeft] = useState("1.8.0");
  const [right, setRight] = useState("2.0.0");
  const [range, setRange] = useState("^1.5.0");
  const result = useMemo(
    () => compareSemanticVersions(left, right, range),
    [left, right, range],
  );

  return (
    <section className="space-y-5">
      <Header
        title="Semantic Version Comparator"
        description="Compare versions and test the first version against an npm-style range."
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="space-y-2">
          <span className="text-sm font-medium">First version</span>
          <Input
            value={left}
            onChange={(event) => setLeft(event.target.value)}
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium">Second version</span>
          <Input
            value={right}
            onChange={(event) => setRight(event.target.value)}
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium">Range</span>
          <Input
            value={range}
            onChange={(event) => setRange(event.target.value)}
          />
        </label>
      </div>
      {result.ok ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <CopyableResult
            value={`${result.value.left} is ${result.value.relation} than ${result.value.right}`}
            label="Comparison"
            copyLabel="Copy comparison"
            rows={2}
          />
          <CopyableResult
            value={
              result.value.satisfiesRange
                ? `${result.value.left} satisfies ${range}`
                : `${result.value.left} does not satisfy ${range}`
            }
            label="Range result"
            copyLabel="Copy range result"
            rows={2}
          />
        </div>
      ) : (
        <ErrorResult message={result.error} />
      )}
    </section>
  );
}
