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
import { convertCssUnit, type CssUnit } from "@/lib/processors/web-code-core";

const CSS_UNITS: CssUnit[] = ["px", "rem", "em", "%", "vw", "vh"];

export function CssUnitConverterTab() {
  const [value, setValue] = useState("32");
  const [unit, setUnit] = useState<CssUnit>("px");
  const [rootFont, setRootFont] = useState("16");
  const [elementFont, setElementFont] = useState("16");
  const [parent, setParent] = useState("1200");
  const [viewportWidth, setViewportWidth] = useState("1440");
  const [viewportHeight, setViewportHeight] = useState("900");

  const result = useMemo(
    () =>
      convertCssUnit(Number(value), unit, {
        rootFontPx: Number(rootFont),
        elementFontPx: Number(elementFont),
        parentPx: Number(parent),
        viewportWidthPx: Number(viewportWidth),
        viewportHeightPx: Number(viewportHeight),
      }),
    [value, unit, rootFont, elementFont, parent, viewportWidth, viewportHeight],
  );

  const contexts = [
    ["Root font px", rootFont, setRootFont],
    ["Element font px", elementFont, setElementFont],
    ["Parent px", parent, setParent],
    ["Viewport width px", viewportWidth, setViewportWidth],
    ["Viewport height px", viewportHeight, setViewportHeight],
  ] as const;

  return (
    <section className="space-y-5">
      <Header
        title="CSS Unit Converter"
        description="Convert CSS lengths using explicit font, parent, and viewport context."
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="space-y-2">
          <span className="text-sm font-medium">Value</span>
          <Input
            type="number"
            value={value}
            onChange={(event) => setValue(event.target.value)}
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium">Source unit</span>
          <Select
            value={unit}
            onValueChange={(next) => setUnit(next as CssUnit)}
          >
            <SelectTrigger aria-label="Source unit">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CSS_UNITS.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
        {contexts.map(([label, current, setter]) => (
          <label key={label} className="space-y-2">
            <span className="text-sm font-medium">{label}</span>
            <Input
              type="number"
              min="1"
              value={current}
              onChange={(event) => setter(event.target.value)}
            />
          </label>
        ))}
      </div>
      {result.ok ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CSS_UNITS.map((item) => {
            const formatted = `${Number(result.value[item].toFixed(6))}${item}`;
            return (
              <CopyableResult
                key={item}
                value={formatted}
                label={item}
                copyLabel={`Copy ${item}`}
                rows={1}
              />
            );
          })}
        </div>
      ) : (
        <ErrorResult message={result.error} />
      )}
    </section>
  );
}
