"use client";

import { useMemo, useState } from "react";
import { CopyableResult } from "@/components/layout";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  compareEnvFiles,
  compareSemanticVersions,
  convertChmod,
  inspectCronExpression,
  parseEnvFile,
  redactEnvFile,
} from "@/lib/processors";

function Header({ title, description }: { title: string; description: string }) {
  return <div><h2 className="text-2xl font-semibold">{title}</h2><p className="text-muted-foreground">{description}</p></div>;
}

function ErrorResult({ message }: { message: string }) {
  return <div role="alert"><CopyableResult value={message} label="Error" copyLabel="Copy error" rows={3} textareaClassName="border-destructive text-destructive" /></div>;
}

export function CronExpressionBuilder() {
  const [expression, setExpression] = useState("*/15 9-17 * * 1-5");
  const [timezone, setTimezone] = useState("UTC");
  const result = useMemo(() => inspectCronExpression(expression, { timezone }), [expression, timezone]);
  return <section className="space-y-5"><Header title="Cron Expression Builder" description="Parse a five-field cron schedule and preview its next UTC runs." /><div className="grid gap-4 sm:grid-cols-[1fr_14rem]"><label className="space-y-2"><span className="text-sm font-medium">Cron expression</span><Input value={expression} onChange={(event) => setExpression(event.target.value)} className="font-mono" /></label><label className="space-y-2"><span className="text-sm font-medium">IANA timezone</span><Input value={timezone} onChange={(event) => setTimezone(event.target.value)} placeholder="UTC" /></label></div>{result.ok ? <div className="space-y-4"><div className="grid gap-4 md:grid-cols-2"><CopyableResult value={result.value.expression} label="Normalized expression" copyLabel="Copy expression" rows={2} /><CopyableResult value={result.value.explanation} label="Explanation" copyLabel="Copy explanation" rows={3} /></div><div><h3 className="mb-2 text-sm font-medium">Next runs</h3><div className="grid gap-3 md:grid-cols-2">{result.value.nextRuns.map((run, index) => <CopyableResult key={run} value={run} label={`Run ${index + 1}`} copyLabel={`Copy run ${index + 1}`} rows={1} />)}</div></div></div> : <ErrorResult message={result.error} />}</section>;
}

export function ChmodCalculator() {
  const [input, setInput] = useState("755");
  const result = useMemo(() => convertChmod(input), [input]);
  return <section className="space-y-5"><Header title="Chmod Calculator" description="Convert three-digit octal and nine-character symbolic Unix permissions." /><label className="block max-w-md space-y-2"><span className="text-sm font-medium">Permissions</span><Input value={input} onChange={(event) => setInput(event.target.value)} placeholder="755 or rwxr-xr-x" className="font-mono" /></label>{result.ok ? <div className="grid gap-4 sm:grid-cols-2"><CopyableResult value={result.value.octal} label="Octal" copyLabel="Copy octal" rows={1} /><CopyableResult value={result.value.symbolic} label="Symbolic" copyLabel="Copy symbolic" rows={1} /><CopyableResult value={result.value.command} label="Command" copyLabel="Copy command" rows={1} /><CopyableResult value={`Owner: ${result.value.owner}\nGroup: ${result.value.group}\nOthers: ${result.value.others}`} label="Breakdown" copyLabel="Copy breakdown" rows={3} /></div> : <ErrorResult message={result.error} />}</section>;
}

export function EnvFileManager() {
  const [left, setLeft] = useState("API_URL=https://example.com\nAPI_TOKEN=secret\nDEBUG=true");
  const [right, setRight] = useState("API_URL=https://api.example.com\nDEBUG=true\nREGION=us-east-1");
  const redacted = useMemo(() => redactEnvFile(left), [left]);
  const comparison = useMemo(() => compareEnvFiles(left, right), [left, right]);
  const parsed = useMemo(() => parseEnvFile(left), [left]);
  return <section className="space-y-5"><Header title=".env File Manager" description="Parse, compare, and redact environment files locally. Values never leave your browser." /><div className="grid gap-4 lg:grid-cols-2"><label className="space-y-2"><span className="text-sm font-medium">Primary .env</span><Textarea value={left} onChange={(event) => setLeft(event.target.value)} rows={10} className="font-mono" spellCheck={false} /></label><label className="space-y-2"><span className="text-sm font-medium">Comparison .env</span><Textarea value={right} onChange={(event) => setRight(event.target.value)} rows={10} className="font-mono" spellCheck={false} /></label></div>{parsed.duplicates.length > 0 && <p role="status" className="text-sm text-amber-600">Duplicate keys: {parsed.duplicates.join(", ")}</p>}{redacted.ok && comparison.ok ? <div className="space-y-4"><CopyableResult value={redacted.value} label="Redacted primary file" copyLabel="Copy redacted file" rows={8} /><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{([ ["Only in primary", comparison.value.onlyLeft], ["Only in comparison", comparison.value.onlyRight], ["Changed", comparison.value.changed], ["Unchanged", comparison.value.unchanged] ] as const).map(([label, values]) => <CopyableResult key={label} value={values.join("\n") || "None"} label={label} copyLabel={`Copy ${label.toLowerCase()}`} rows={4} />)}</div></div> : <ErrorResult message={!redacted.ok ? redacted.error : comparison.ok ? "" : comparison.error} />}</section>;
}

export function SemverComparator() {
  const [left, setLeft] = useState("1.8.0");
  const [right, setRight] = useState("2.0.0");
  const [range, setRange] = useState("^1.5.0");
  const result = useMemo(() => compareSemanticVersions(left, right, range), [left, right, range]);
  return <section className="space-y-5"><Header title="Semantic Version Comparator" description="Compare versions and test the first version against an npm-style range." /><div className="grid gap-4 sm:grid-cols-3"><label className="space-y-2"><span className="text-sm font-medium">First version</span><Input value={left} onChange={(event) => setLeft(event.target.value)} /></label><label className="space-y-2"><span className="text-sm font-medium">Second version</span><Input value={right} onChange={(event) => setRight(event.target.value)} /></label><label className="space-y-2"><span className="text-sm font-medium">Range</span><Input value={range} onChange={(event) => setRange(event.target.value)} /></label></div>{result.ok ? <div className="grid gap-4 sm:grid-cols-2"><CopyableResult value={`${result.value.left} is ${result.value.relation} than ${result.value.right}`} label="Comparison" copyLabel="Copy comparison" rows={2} /><CopyableResult value={result.value.satisfiesRange ? `${result.value.left} satisfies ${range}` : `${result.value.left} does not satisfy ${range}`} label="Range result" copyLabel="Copy range result" rows={2} /></div> : <ErrorResult message={result.error} />}</section>;
}
