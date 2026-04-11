"use client";

import { useState } from "react";
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
import type { DigestAlgorithm } from "@/lib/processors/crypto-core";
import { generateSri } from "@/lib/processors/advanced-crypto-core";

export function SriGeneratorTab() {
  const [input, setInput] = useState("console.log('loaded');\n");
  const [algorithm, setAlgorithm] = useState<DigestAlgorithm>("SHA-384");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");

  const generate = async () => {
    const output = await generateSri(input, algorithm);
    if (output.ok) {
      setResult(output.value);
      setError("");
    } else {
      setResult("");
      setError(output.error);
    }
  };

  return (
    <section className="space-y-5">
      <Header
        title="Subresource Integrity Generator"
        description="Generate an SRI hash from the exact local resource content. Hash remote files only after downloading them from a trusted source."
      />
      <label className="block max-w-sm space-y-2">
        <span className="text-sm font-medium">Algorithm</span>
        <Select
          value={algorithm}
          onValueChange={(value) => setAlgorithm(value as DigestAlgorithm)}
        >
          <SelectTrigger aria-label="SRI algorithm">
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
      <label className="block space-y-2">
        <span className="text-sm font-medium">Resource content</span>
        <Textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          rows={12}
          className="font-mono"
        />
      </label>
      <Button type="button" onClick={() => void generate()}>
        Generate SRI
      </Button>
      {error ? (
        <ErrorResult message={error} />
      ) : (
        <CopyableResult
          value={result}
          label="Integrity attribute"
          copyLabel="Copy integrity attribute"
          rows={3}
        />
      )}
    </section>
  );
}
