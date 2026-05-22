"use client";

import { useMemo, useState } from "react";
import {
  CopyableResult,
  ToolErrorResult as ErrorResult,
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
import { Slider } from "@/components/ui/slider";
import { createCssClamp } from "@/lib/processors/web-code-core";

export function CssClampCalculatorTab() {
  const [min, setMin] = useState("16");
  const [max, setMax] = useState("32");
  const [minViewport, setMinViewport] = useState("320");
  const [maxViewport, setMaxViewport] = useState("1280");
  const [unit, setUnit] = useState<"rem" | "px">("rem");
  const [rootFontPx, setRootFontPx] = useState("16");
  const [previewViewport, setPreviewViewport] = useState([768]);

  const result = useMemo(
    () =>
      createCssClamp(
        Number(min),
        Number(max),
        Number(minViewport),
        Number(maxViewport),
        { unit, rootFontPx: Number(rootFontPx) },
      ),
    [min, max, minViewport, maxViewport, unit, rootFontPx],
  );

  const previewFontSize = useMemo(() => {
    const minN = Number(min);
    const maxN = Number(max);
    const minV = Number(minViewport);
    const maxV = Number(maxViewport);
    if (
      ![minN, maxN, minV, maxV].every(Number.isFinite) ||
      maxV <= minV ||
      maxN <= minN
    ) {
      return null;
    }
    const vp = previewViewport[0];
    const linear = minN + ((vp - minV) / (maxV - minV)) * (maxN - minN);
    return Math.min(maxN, Math.max(minN, linear));
  }, [min, max, minViewport, maxViewport, previewViewport]);

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
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
        <label className="space-y-2">
          <span className="text-sm font-medium">Output unit</span>
          <Select
            value={unit}
            onValueChange={(value) => setUnit(value as "rem" | "px")}
          >
            <SelectTrigger aria-label="Output unit">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rem">rem (accessible scaling)</SelectItem>
              <SelectItem value="px">px</SelectItem>
            </SelectContent>
          </Select>
        </label>
        {unit === "rem" && (
          <label className="space-y-2">
            <span className="text-sm font-medium">Root font size px</span>
            <Input
              type="number"
              min="1"
              value={rootFontPx}
              onChange={(event) => setRootFontPx(event.target.value)}
            />
          </label>
        )}
      </div>
      {result.ok ? (
        <div className="space-y-4">
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
              value={`${Number(result.value.intercept.toFixed(6))}${unit}`}
              label="Intercept"
              copyLabel="Copy intercept"
              rows={2}
            />
          </div>
          {previewFontSize !== null && (
            <div className="rounded-lg border p-4 space-y-3 bg-muted/20">
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="font-medium">
                  Live preview at viewport {previewViewport[0]}px
                </span>
                <span className="font-mono text-muted-foreground">
                  {previewFontSize.toFixed(2)}px
                </span>
              </div>
              <Slider
                aria-label="Preview viewport width"
                min={240}
                max={1600}
                step={10}
                value={previewViewport}
                onValueChange={setPreviewViewport}
              />
              <p
                className="font-medium leading-tight truncate"
                style={{ fontSize: `${previewFontSize}px` }}
              >
                Fluid typography scales smoothly
              </p>
            </div>
          )}
        </div>
      ) : (
        <ErrorResult message={result.error} />
      )}
    </section>
  );
}
