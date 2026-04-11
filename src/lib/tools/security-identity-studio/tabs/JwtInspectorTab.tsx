"use client";

import { useMemo, useState } from "react";
import {
  CopyableResult,
  ToolSectionHeader as Header,
} from "@/components/layout";
import { Textarea } from "@/components/ui/textarea";
import { inspectJwt } from "@/lib/processors/crypto-core";

const SAMPLE_JWT =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMiLCJuYW1lIjoiQWRhIiwiaWF0IjoxNzA0MDY3MjAwLCJleHAiOjE4OTM0NTYwMDB9.signature";

export function JwtInspectorTab() {
  const [token, setToken] = useState(SAMPLE_JWT);
  const result = useMemo(() => inspectJwt(token), [token]);

  return (
    <section className="space-y-5">
      <Header
        title="JWT Inspector"
        description="Decode JWT content locally. Decoding does not verify its signature or trust its claims."
      />
      <label className="block space-y-2">
        <span className="text-sm font-medium">JWT</span>
        <Textarea
          value={token}
          onChange={(event) => setToken(event.target.value)}
          rows={6}
          className="font-mono"
          spellCheck={false}
        />
      </label>
      {result.ok ? (
        <div className="space-y-4">
          <p
            role="status"
            className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950/20 dark:text-amber-200"
          >
            {result.value.warning}
          </p>
          <div className="grid gap-4 lg:grid-cols-2">
            <CopyableResult
              value={JSON.stringify(result.value.header, null, 2)}
              label="Header"
              copyLabel="Copy header"
              rows={8}
            />
            <CopyableResult
              value={JSON.stringify(result.value.payload, null, 2)}
              label="Payload"
              copyLabel="Copy payload"
              rows={8}
            />
            <CopyableResult
              value={result.value.signature}
              label="Signature segment"
              copyLabel="Copy signature"
              rows={3}
            />
            <CopyableResult
              value={`Algorithm: ${result.value.algorithm ?? "unspecified"}\nStatus: ${result.value.status}\nIssued: ${result.value.issuedAt ?? "unspecified"}\nExpires: ${result.value.expiresAt ?? "unspecified"}\nNot before: ${result.value.notBefore ?? "unspecified"}`}
              label="Claim summary"
              copyLabel="Copy claim summary"
              rows={6}
            />
          </div>
        </div>
      ) : (
        <div role="alert">
          <CopyableResult
            value={result.error}
            label="Error"
            copyLabel="Copy error"
            rows={4}
            textareaClassName="border-destructive text-destructive"
          />
        </div>
      )}
    </section>
  );
}
