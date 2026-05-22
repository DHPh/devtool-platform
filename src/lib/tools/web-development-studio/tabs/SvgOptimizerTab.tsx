"use client";

import { useState } from "react";
import {
  AsyncActionButton,
  CodeEditor,
  CopyableResult,
  ToolErrorResult as ErrorResult,
  ToolSectionHeader as Header,
} from "@/components/layout";
import {
  optimizeSvg,
  type CompressionResult,
} from "@/lib/processors/advanced-web-core";

const SVG_OPTIMIZER_SAMPLE =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">\n  <!-- decorative circle -->\n  <circle cx="60" cy="60" r="48" fill="#6366f1" />\n</svg>';

function CompressionStats({
  originalSvg,
  result,
}: {
  originalSvg: string;
  result: CompressionResult;
}) {
  const originalPreview = `data:image/svg+xml,${encodeURIComponent(originalSvg)}`;
  const optimizedPreview = `data:image/svg+xml,${encodeURIComponent(result.output)}`;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border p-3 space-y-2">
          <span className="text-xs font-medium text-muted-foreground">Original preview</span>
          <div className="flex h-36 items-center justify-center rounded border bg-muted/40 p-3">
            {/* eslint-disable-next-line @next/next/no-img-element -- sandboxed SVG data URI preview */}
            <img
              src={originalPreview}
              alt="Original SVG preview"
              className="max-h-full max-w-full object-contain"
            />
          </div>
        </div>
        <div className="rounded-lg border p-3 space-y-2">
          <span className="text-xs font-medium text-muted-foreground">Optimized preview</span>
          <div className="flex h-36 items-center justify-center rounded border bg-muted/40 p-3">
            {/* eslint-disable-next-line @next/next/no-img-element -- sandboxed SVG data URI preview */}
            <img
              src={optimizedPreview}
              alt="Optimized SVG preview"
              className="max-h-full max-w-full object-contain"
            />
          </div>
        </div>
      </div>
      <CopyableResult
        value={result.output}
        label="Optimized SVG"
        copyLabel="Copy optimized SVG"
        language="svg"
        rows={16}
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <CopyableResult
          value={String(result.originalBytes)}
          label="Original bytes"
          copyLabel="Copy original bytes"
          rows={1}
        />
        <CopyableResult
          value={String(result.outputBytes)}
          label="Output bytes"
          copyLabel="Copy output bytes"
          rows={1}
        />
        <CopyableResult
          value={String(result.savedBytes)}
          label="Saved bytes"
          copyLabel="Copy saved bytes"
          rows={1}
        />
        <CopyableResult
          value={`${result.reductionPercent}%`}
          label="Reduction"
          copyLabel="Copy reduction"
          rows={1}
        />
      </div>
    </div>
  );
}

export function SvgOptimizerTab() {
  const [input, setInput] = useState(SVG_OPTIMIZER_SAMPLE);
  const [multipass, setMultipass] = useState(true);
  const [preserveViewBox, setPreserveViewBox] = useState(true);
  const [result, setResult] = useState<
    Awaited<ReturnType<typeof optimizeSvg>> | null
  >(null);
  const [working, setWorking] = useState(false);

  const run = async () => {
    setWorking(true);
    setResult(await optimizeSvg(input, { multipass, preserveViewBox }));
    setWorking(false);
  };

  return (
    <section className="space-y-5">
      <Header
        title="SVG Optimizer"
        description="Optimize allowlisted, self-contained SVG markup locally with SVGO."
      />
      <div className="flex flex-wrap items-center gap-4">
        <AsyncActionButton
          pending={working}
          pendingLabel="Optimizing…"
          onClick={() => void run()}
        >
          Optimize SVG
        </AsyncActionButton>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={multipass}
            onChange={(event) => setMultipass(event.target.checked)}
          />
          Multiple passes
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={preserveViewBox}
            onChange={(event) => setPreserveViewBox(event.target.checked)}
          />
          Preserve viewBox
        </label>
      </div>
      <div className="space-y-2">
        <span className="block text-sm font-medium">SVG markup</span>
        <CodeEditor
          value={input}
          onChange={setInput}
          language="svg"
          aria-label="SVG markup"
          rows={16}
        />
      </div>
      {result?.ok ? (
        <CompressionStats originalSvg={input} result={result.value} />
      ) : result ? (
        <ErrorResult message={result.error} />
      ) : null}
    </section>
  );
}
