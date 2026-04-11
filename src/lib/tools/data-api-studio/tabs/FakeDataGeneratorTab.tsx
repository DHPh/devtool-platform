"use client";

import { useMemo, useState } from "react";
import {
  CopyableResult,
  ToolErrorResult as ErrorResult,
  ToolSectionHeader as Header,
} from "@/components/layout";
import { Input } from "@/components/ui/input";
import { generateFakeData } from "@/lib/processors/data-workflow-core";

export function FakeDataGeneratorTab() {
  const [count, setCount] = useState("10");
  const [seed, setSeed] = useState("42");
  const result = useMemo(
    () => generateFakeData({ count: Number(count), seed: Number(seed) }),
    [count, seed],
  );

  return (
    <section className="space-y-5">
      <Header
        title="Fake Data Generator"
        description="Generate deterministic JSON records for development and tests using a repeatable seed."
      />
      <div className="grid max-w-xl gap-3 sm:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-medium">Record count</span>
          <Input
            type="number"
            min="1"
            max="1000"
            value={count}
            onChange={(event) => setCount(event.target.value)}
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium">Seed</span>
          <Input
            type="number"
            value={seed}
            onChange={(event) => setSeed(event.target.value)}
          />
        </label>
      </div>
      {result.ok ? (
        <CopyableResult
          value={result.value}
          label="Generated JSON"
          copyLabel="Copy generated JSON"
          rows={20}
        />
      ) : (
        <ErrorResult message={result.error} />
      )}
    </section>
  );
}
