"use client";

import { useMemo, useState } from "react";
import {
  CopyableResult,
  ToolErrorResult as ErrorResult,
  ToolSectionHeader as Header,
} from "@/components/layout";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { dataUriToSvg, svgToDataUri } from "@/lib/processors/web-code-core";

const SVG_SAMPLE =
  '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><circle cx="60" cy="60" r="48" fill="#6366f1"/></svg>';

export function SvgDataUriConverterTab() {
  const [input, setInput] = useState(SVG_SAMPLE);
  const [direction, setDirection] = useState<"encode" | "decode">("encode");
  const [encoding, setEncoding] = useState<"percent" | "base64">("percent");

  const result = useMemo(
    () =>
      direction === "encode"
        ? svgToDataUri(input, encoding)
        : dataUriToSvg(input),
    [direction, encoding, input],
  );

  const reverse = () => {
    if (result.ok) setInput(result.value);
    setDirection((value) => (value === "encode" ? "decode" : "encode"));
  };

  return (
    <section className="space-y-5">
      <Header
        title="SVG Data URI Converter"
        description="Encode allowlisted, self-contained SVG markup as a data URI or decode it back to markup."
      />
      <div className="flex flex-wrap items-end gap-3">
        {direction === "encode" && (
          <label className="w-48 space-y-2">
            <span className="text-sm font-medium">Encoding</span>
            <Select
              value={encoding}
              onValueChange={(value) =>
                setEncoding(value as "percent" | "base64")
              }
            >
              <SelectTrigger aria-label="Encoding">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percent">Percent encoded</SelectItem>
                <SelectItem value="base64">Base64</SelectItem>
              </SelectContent>
            </Select>
          </label>
        )}
        <Button type="button" variant="outline" onClick={reverse}>
          Reverse direction
        </Button>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-medium">
            {direction === "encode" ? "SVG markup" : "SVG data URI"}
          </span>
          <Textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            rows={15}
            className="font-mono"
            spellCheck={false}
          />
        </label>
        {result.ok ? (
          <div className="space-y-4">
            <CopyableResult
              value={result.value}
              label={direction === "encode" ? "Data URI" : "SVG markup"}
              copyLabel={
                direction === "encode" ? "Copy data URI" : "Copy SVG markup"
              }
              rows={11}
            />
            {direction === "encode" && (
              <CopyableResult
                value={`background-image: url("${result.value}");`}
                label="CSS background-image"
                copyLabel="Copy CSS background-image"
                rows={3}
              />
            )}
          </div>
        ) : (
          <ErrorResult message={result.error} />
        )}
      </div>
      {result.ok && (
        <div className="rounded-lg border p-3 space-y-2">
          <span className="text-xs font-medium text-muted-foreground">Visual Preview</span>
          <div className="flex h-36 items-center justify-center rounded border bg-muted/40 p-3">
            {/* eslint-disable-next-line @next/next/no-img-element -- sandboxed SVG data URI preview */}
            <img
              src={
                direction === "encode"
                  ? result.value
                  : `data:image/svg+xml,${encodeURIComponent(result.value)}`
              }
              alt="SVG preview"
              className="max-h-full max-w-full object-contain"
            />
          </div>
        </div>
      )}
    </section>
  );
}
