"use client";

import { useMemo, useState } from "react";
import {
  CopyableResult,
  ToolErrorResult as ErrorResult,
  ToolSectionHeader as Header,
} from "@/components/layout";
import { Input } from "@/components/ui/input";
import { createCssClamp } from "@/lib/processors/web-code-core";

export function CssClampCalculatorTab() {
  const [min, setMin] = useState("16");
  const [max, setMax] = useState("32");
  const [minViewport, setMinViewport] = useState("320");
  const [maxViewport, setMaxViewport] = useState("1280");

  const result = useMemo(
    () =>
      createCssClamp(
        Number(min),
        Number(max),
        Number(minViewport),
        Number(maxViewport),
      ),
    [min, max, minViewport, maxViewport],
  );

  const fields = [
    ["Minimum size px", min, setMin],
    ["Maximum size px", max, setMax],
    ["Minimum viewport px", minViewport, setMinViewport],
    ["Maximum viewport px", maxViewport, setMaxViewport],
  ] as const;

  return (
    <section className="space-y-5">
      <Header
        title="CSS Clamp Calculator"
        description="Generate a fluid clamp expression between explicit viewport bounds."
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {fields.map(([label, current, setter]) => (
          <label key={label} className="space-y-2">
            <span className="text-sm font-medium">{label}</span>
            <Input
              type="number"
              value={current}
              onChange={(event) => setter(event.target.value)}
            />
          </label>
        ))}
      </div>
      {result.ok ? (
        <div className="grid gap-4 md:grid-cols-3">
          <CopyableResult
            value={result.value.css}
            label="CSS clamp"
            copyLabel="Copy CSS clamp"
            rows={2}
          />
          <CopyableResult
            value={`${Number(result.value.slope.toFixed(6))}vw`}
            label="Slope"
            copyLabel="Copy slope"
            rows={2}
          />
          <CopyableResult
            value={`${Number(result.value.intercept.toFixed(6))}px`}
            label="Intercept"
            copyLabel="Copy intercept"
            rows={2}
          />
        </div>
      ) : (
        <ErrorResult message={result.error} />
      )}
    </section>
  );
}
