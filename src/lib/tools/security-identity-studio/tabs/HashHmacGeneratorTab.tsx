"use client";

import { useRef, useState } from "react";
import {
  CopyableResult,
  ToolSectionHeader as Header,
} from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  generateDigest,
  generateHmac,
  type DigestAlgorithm,
} from "@/lib/processors/crypto-core";

export function HashHmacGeneratorTab() {
  const [input, setInput] = useState("Hello, world!");
  const [secret, setSecret] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [mode, setMode] = useState<"hash" | "hmac">("hash");
  const [algorithm, setAlgorithm] = useState<DigestAlgorithm>("SHA-256");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");

  const revision = useRef(0);

  const updateInput = (update: () => void) => {
    revision.current++;
    update();
    setOutput("");
    setError("");
  };

  const generate = async () => {
    const request = ++revision.current;
    const result =
      mode === "hash"
        ? await generateDigest(input, algorithm)
        : await generateHmac(input, secret, algorithm);
    if (request !== revision.current) return;
    if (result.ok) {
      setOutput(result.value);
      setError("");
    } else {
      setOutput("");
      setError(result.error);
    }
  };

  return (
    <section className="space-y-5">
      <Header
        title="Hash and HMAC Generator"
        description="Generate SHA-2 digests and keyed HMAC values locally with Web Crypto."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-medium">Operation</span>
          <Select
            value={mode}
            onValueChange={(value) => updateInput(() => setMode(value as "hash" | "hmac"))}
          >
            <SelectTrigger aria-label="Operation">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hash">Hash</SelectItem>
              <SelectItem value="hmac">HMAC</SelectItem>
            </SelectContent>
          </Select>
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium">Algorithm</span>
          <Select
            value={algorithm}
            onValueChange={(value) => updateInput(() => setAlgorithm(value as DigestAlgorithm))}
          >
            <SelectTrigger aria-label="Algorithm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(["SHA-256", "SHA-384", "SHA-512"] as const).map((value) => (
                <SelectItem key={value} value={value}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
      </div>
      <label className="block space-y-2">
        <span className="text-sm font-medium">Input text</span>
        <Textarea
          value={input}
          onChange={(event) => updateInput(() => setInput(event.target.value))}
          rows={7}
        />
      </label>
      {mode === "hmac" && (
        <div className="max-w-xl space-y-2">
          <label htmlFor="hash-hmac-secret" className="text-sm font-medium">
            Secret key
          </label>
          <div className="flex gap-2">
            <Input
              id="hash-hmac-secret"
              type={showSecret ? "text" : "password"}
              value={secret}
              onChange={(event) => updateInput(() => setSecret(event.target.value))}
              autoComplete="off"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowSecret((value) => !value)}
            >
              {showSecret ? "Hide" : "Show"}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            A shared secret supplied by your application or protocol. The
            producer and verifier must use the exact same value.
          </p>
        </div>
      )}
      <Button type="button" disabled={mode === "hmac" && !secret} onClick={() => void generate()}>
        Generate {mode === "hash" ? "hash" : "HMAC"}
      </Button>
      {error ? (
        <div role="alert">
          <CopyableResult
            value={error}
            label="Error"
            copyLabel="Copy error"
            rows={3}
            textareaClassName="border-destructive text-destructive"
          />
        </div>
      ) : (
        <CopyableResult
          value={output}
          label={mode === "hash" ? "Hash" : "HMAC"}
          copyLabel={mode === "hash" ? "Copy hash" : "Copy HMAC"}
          rows={4}
        />
      )}
    </section>
  );
}
