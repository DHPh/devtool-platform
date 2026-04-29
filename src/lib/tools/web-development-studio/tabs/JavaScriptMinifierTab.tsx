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
  minifyJavaScript,
  type CompressionResult,
} from "@/lib/processors/advanced-web-core";

function CompressionStats({ result }: { result: CompressionResult }) {
  return (
    <div className="space-y-4">
      <CopyableResult
        value={result.output}
        label="Minified JavaScript"
        copyLabel="Copy minified JavaScript"
        language="javascript"
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

export function JavaScriptMinifierTab() {
  const [input, setInput] = useState(
    "function greet(name) {\n  const message = `Hello ${name}`;\n  return message;\n}\nconsole.log(greet('Ada'));\n",
  );
  const [mangle, setMangle] = useState(true);
  const [module, setModule] = useState(false);
  const [result, setResult] = useState<
    Awaited<ReturnType<typeof minifyJavaScript>> | null
  >(null);
  const [working, setWorking] = useState(false);

  const run = async () => {
    setWorking(true);
    setResult(await minifyJavaScript(input, { mangle, module }));
    setWorking(false);
  };

  return (
    <section className="space-y-5">
      <Header
        title="JavaScript Minifier"
        description="Compress JavaScript locally with Terser and report exact UTF-8 size savings."
      />
      <div className="flex flex-wrap items-center gap-4">
        <AsyncActionButton
          pending={working}
          pendingLabel="Minifying…"
          onClick={() => void run()}
        >
          Minify JavaScript
        </AsyncActionButton>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={mangle}
            onChange={(event) => setMangle(event.target.checked)}
          />
          Mangle local names
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={module}
            onChange={(event) => setModule(event.target.checked)}
          />
          ES module
        </label>
      </div>
      <div className="space-y-2">
        <span className="block text-sm font-medium">JavaScript source</span>
        <CodeEditor
          value={input}
          onChange={setInput}
          language="javascript"
          aria-label="JavaScript source"
          rows={16}
        />
      </div>
      {result?.ok ? (
        <CompressionStats result={result.value} />
      ) : result ? (
        <ErrorResult message={result.error} />
      ) : null}
    </section>
  );
}
