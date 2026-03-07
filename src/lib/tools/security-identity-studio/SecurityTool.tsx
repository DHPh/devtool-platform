"use client";

import { useMemo, useState } from "react";
import { CopyableResult } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { generateDigest, generateHmac, inspectJwt, type DigestAlgorithm } from "@/lib/processors";

const SAMPLE_JWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMiLCJuYW1lIjoiQWRhIiwiaWF0IjoxNzA0MDY3MjAwLCJleHAiOjE4OTM0NTYwMDB9.signature";

function Header({ title, description }: { title: string; description: string }) {
  return <div><h2 className="text-2xl font-semibold">{title}</h2><p className="text-muted-foreground">{description}</p></div>;
}

export function JwtInspectorTool() {
  const [token, setToken] = useState(SAMPLE_JWT);
  const result = useMemo(() => inspectJwt(token), [token]);
  return <section className="space-y-5"><Header title="JWT Inspector" description="Decode JWT content locally. Decoding does not verify its signature or trust its claims." /><label className="space-y-2"><span className="text-sm font-medium">JWT</span><Textarea value={token} onChange={(event) => setToken(event.target.value)} rows={6} className="font-mono" spellCheck={false} /></label>{result.ok ? <div className="space-y-4"><p role="status" className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950/20 dark:text-amber-200">{result.value.warning}</p><div className="grid gap-4 lg:grid-cols-2"><CopyableResult value={JSON.stringify(result.value.header, null, 2)} label="Header" copyLabel="Copy header" rows={8} /><CopyableResult value={JSON.stringify(result.value.payload, null, 2)} label="Payload" copyLabel="Copy payload" rows={8} /><CopyableResult value={result.value.signature} label="Signature segment" copyLabel="Copy signature" rows={3} /><CopyableResult value={`Algorithm: ${result.value.algorithm ?? "unspecified"}\nStatus: ${result.value.status}\nIssued: ${result.value.issuedAt ?? "unspecified"}\nExpires: ${result.value.expiresAt ?? "unspecified"}\nNot before: ${result.value.notBefore ?? "unspecified"}`} label="Claim summary" copyLabel="Copy claim summary" rows={6} /></div></div> : <div role="alert"><CopyableResult value={result.error} label="Error" copyLabel="Copy error" rows={4} textareaClassName="border-destructive text-destructive" /></div>}</section>;
}

export function HashHmacGeneratorTool() {
  const [input, setInput] = useState("Hello, world!");
  const [secret, setSecret] = useState("development-secret");
  const [mode, setMode] = useState<"hash" | "hmac">("hash");
  const [algorithm, setAlgorithm] = useState<DigestAlgorithm>("SHA-256");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const generate = async () => {
    const result = mode === "hash" ? await generateDigest(input, algorithm) : await generateHmac(input, secret, algorithm);
    if (result.ok) { setOutput(result.value); setError(""); } else { setOutput(""); setError(result.error); }
  };
  return <section className="space-y-5"><Header title="Hash and HMAC Generator" description="Generate SHA-2 digests and keyed HMAC values locally with Web Crypto." /><div className="grid gap-4 sm:grid-cols-2"><label className="space-y-2"><span className="text-sm font-medium">Operation</span><Select value={mode} onValueChange={(value) => setMode(value as "hash" | "hmac")}><SelectTrigger aria-label="Operation"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="hash">Hash</SelectItem><SelectItem value="hmac">HMAC</SelectItem></SelectContent></Select></label><label className="space-y-2"><span className="text-sm font-medium">Algorithm</span><Select value={algorithm} onValueChange={(value) => setAlgorithm(value as DigestAlgorithm)}><SelectTrigger aria-label="Algorithm"><SelectValue /></SelectTrigger><SelectContent>{(["SHA-256", "SHA-384", "SHA-512"] as const).map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select></label></div><label className="space-y-2"><span className="text-sm font-medium">Input text</span><Textarea value={input} onChange={(event) => setInput(event.target.value)} rows={7} /></label>{mode === "hmac" && <label className="block max-w-xl space-y-2"><span className="text-sm font-medium">Secret key</span><Input type="password" value={secret} onChange={(event) => setSecret(event.target.value)} autoComplete="off" /></label>}<Button type="button" onClick={() => void generate()}>Generate {mode === "hash" ? "hash" : "HMAC"}</Button>{error ? <div role="alert"><CopyableResult value={error} label="Error" copyLabel="Copy error" rows={3} textareaClassName="border-destructive text-destructive" /></div> : <CopyableResult value={output} label={mode === "hash" ? "Hash" : "HMAC"} copyLabel={mode === "hash" ? "Copy hash" : "Copy HMAC"} rows={4} />}</section>;
}
