"use client";

import { useMemo, useState } from "react";
import { CopyableResult } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { flattenJson, jsonToTypeScript, unflattenJson } from "@/lib/processors";

const SAMPLE = '{"user":{"id":1,"display-name":"Ada"},"roles":["admin","editor"]}';

function Header({ title, description }: { title: string; description: string }) {
  return <div><h2 className="text-2xl font-semibold">{title}</h2><p className="text-muted-foreground">{description}</p></div>;
}

function Editor({ input, onInput, output, error }: { input: string; onInput: (value: string) => void; output: string; error?: string }) {
  return <div className="grid gap-4 lg:grid-cols-2"><label className="space-y-2"><span className="text-sm font-medium">Input</span><Textarea value={input} onChange={(event) => onInput(event.target.value)} rows={18} className="font-mono" spellCheck={false} /></label><div>{error ? <div role="alert"><CopyableResult value={error} label="Error" copyLabel="Copy error" rows={5} textareaClassName="border-destructive text-destructive" /></div> : <CopyableResult value={output} label="Result" copyLabel="Copy result" rows={18} />}</div></div>;
}

export function JsonToTypeScriptTool() {
  const [input, setInput] = useState(SAMPLE);
  const [name, setName] = useState("ApiResponse");
  const result = useMemo(() => jsonToTypeScript(input, name), [input, name]);
  return <section className="space-y-5"><Header title="JSON to TypeScript" description="Infer a TypeScript type without evaluating code or uploading data." /><label className="block max-w-sm space-y-2"><span className="text-sm font-medium">Root type name</span><Input value={name} onChange={(event) => setName(event.target.value)} /></label><Editor input={input} onInput={setInput} output={result.ok ? result.value : ""} error={result.ok ? undefined : result.error} /></section>;
}

export function JsonFlattenTool() {
  const [input, setInput] = useState(SAMPLE);
  const [direction, setDirection] = useState<"flatten" | "unflatten">("flatten");
  const result = useMemo(() => direction === "flatten" ? flattenJson(input) : unflattenJson(input), [direction, input]);
  const switchDirection = () => {
    if (result.ok) setInput(result.value);
    setDirection((current) => current === "flatten" ? "unflatten" : "flatten");
  };
  return <section className="space-y-5"><Header title="JSON Flatten and Unflatten" description="Convert nested JSON to escaped dot-and-index paths and back." /><div className="flex flex-wrap items-center gap-3"><span className="text-sm font-medium">{direction === "flatten" ? "Nested → flattened" : "Flattened → nested"}</span><Button type="button" variant="outline" size="sm" onClick={switchDirection}>Reverse direction</Button></div><Editor input={input} onInput={setInput} output={result.ok ? result.value : ""} error={result.ok ? undefined : result.error} /></section>;
}
