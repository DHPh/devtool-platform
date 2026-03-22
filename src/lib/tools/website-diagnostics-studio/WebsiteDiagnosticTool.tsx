"use client";

import { useState } from "react";
import { CopyableResult } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  runWebsiteDiagnostic,
  type WebsiteDiagnosticOperation,
} from "@/lib/utils/network/website-inspection-client";

const CONFIG: Record<
  WebsiteDiagnosticOperation,
  {
    title: string;
    description: string;
    inputLabel: string;
    sample: string;
    button: string;
  }
> = {
  "redirect-tracer": {
    title: "Redirect Tracer",
    description:
      "Follow a bounded, SSRF-protected redirect chain from the server.",
    inputLabel: "Public URL",
    sample: "https://example.com",
    button: "Trace redirects",
  },
  "security-header-analyzer": {
    title: "Security Header Analyzer",
    description:
      "Inspect public response headers and receive configuration recommendations.",
    inputLabel: "Public URL",
    sample: "https://example.com",
    button: "Analyze headers",
  },
  "cors-analyzer": {
    title: "CORS Analyzer",
    description:
      "Send a bounded preflight probe and inspect the returned CORS policy.",
    inputLabel: "Public URL",
    sample: "https://example.com",
    button: "Analyze CORS",
  },
  "robots-inspector": {
    title: "Robots.txt Inspector",
    description:
      "Fetch and parse a bounded robots.txt file without recursively fetching linked sitemaps.",
    inputLabel: "Website URL",
    sample: "https://example.com",
    button: "Inspect robots.txt",
  },
  "sitemap-validator": {
    title: "Sitemap Validator",
    description:
      "Validate one bounded public sitemap document and report at most 500 locations.",
    inputLabel: "Sitemap URL",
    sample: "https://example.com/sitemap.xml",
    button: "Validate sitemap",
  },
  "open-graph-inspector": {
    title: "Open Graph Inspector",
    description:
      "Extract metadata from bounded public HTML without executing page scripts.",
    inputLabel: "Public page URL",
    sample: "https://example.com",
    button: "Inspect metadata",
  },
  "email-dns-analyzer": {
    title: "Email DNS Analyzer",
    description: "Analyze public MX, SPF, and DMARC records from the server.",
    inputLabel: "Domain",
    sample: "example.com",
    button: "Analyze email DNS",
  },
  "dns-propagation-checker": {
    title: "DNS Propagation Checker",
    description:
      "Compare one record across three bounded DNS-over-HTTPS resolvers.",
    inputLabel: "Domain",
    sample: "example.com",
    button: "Check propagation",
  },
};

interface FlatResult {
  label: string;
  value: string;
}

function flattenResult(value: unknown, path = "Result"): FlatResult[] {
  if (value === null || value === undefined)
    return [{ label: path, value: "None" }];
  if (typeof value !== "object") return [{ label: path, value: String(value) }];
  if (Array.isArray(value)) {
    if (!value.length) return [{ label: path, value: "None" }];
    return value.flatMap((item, index) =>
      flattenResult(item, `${path} ${index + 1}`),
    );
  }
  const entries = Object.entries(value as Record<string, unknown>);
  if (!entries.length) return [{ label: path, value: "None" }];
  return entries.flatMap(([key, item]) =>
    flattenResult(item, path === "Result" ? key : `${path} · ${key}`),
  );
}

function readableLabel(value: string): string {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[._-]/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function WebsiteDiagnosticTool({
  operation,
}: {
  operation: WebsiteDiagnosticOperation;
}) {
  const config = CONFIG[operation];
  const [input, setInput] = useState(config.sample);
  const [recordType, setRecordType] = useState("A");
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState("");
  const [working, setWorking] = useState(false);
  const run = async () => {
    setWorking(true);
    try {
      setResult(await runWebsiteDiagnostic(operation, input, recordType));
      setError("");
    } catch (runError) {
      setResult(null);
      setError(
        runError instanceof Error ? runError.message : "Diagnostic failed.",
      );
    }
    setWorking(false);
  };
  const outputs = result === null ? [] : flattenResult(result);
  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold">{config.title}</h2>
        <p className="text-muted-foreground">{config.description}</p>
        <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">
          The entered public destination is sent to this site&apos;s serverless
          diagnostic endpoint.
        </p>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <label className="min-w-72 flex-1 space-y-2">
          <span className="text-sm font-medium">{config.inputLabel}</span>
          <Input
            value={input}
            onChange={(event) => setInput(event.target.value)}
          />
        </label>
        {operation === "dns-propagation-checker" && (
          <label className="w-40 space-y-2">
            <span className="text-sm font-medium">Record type</span>
            <Select value={recordType} onValueChange={setRecordType}>
              <SelectTrigger aria-label="Record type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["A", "AAAA", "MX", "TXT", "NS", "CNAME"].map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
        )}
        <Button type="button" onClick={() => void run()} disabled={working}>
          {working ? "Running…" : config.button}
        </Button>
      </div>
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
      ) : outputs.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {outputs.map((output, index) => {
            const label = readableLabel(output.label);
            return (
              <CopyableResult
                key={`${output.label}-${index}`}
                value={output.value}
                label={label}
                copyLabel={`Copy result ${index + 1}`}
                rows={Math.min(5, Math.max(1, output.value.split("\n").length))}
              />
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
