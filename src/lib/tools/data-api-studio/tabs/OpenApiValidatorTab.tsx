"use client";

import { useMemo, useState } from "react";
import {
  CopyableResult,
  ToolErrorResult as ErrorResult,
  ToolSectionHeader as Header,
} from "@/components/layout";
import { Textarea } from "@/components/ui/textarea";
import { validateOpenApi } from "@/lib/processors/data-workflow-core";

const OPENAPI_SAMPLE = `openapi: 3.1.0
info:
  title: Example API
  version: 1.0.0
paths:
  /users:
    get:
      responses:
        "200":
          description: OK`;

export function OpenApiValidatorTab() {
  const [input, setInput] = useState(OPENAPI_SAMPLE);
  const result = useMemo(() => validateOpenApi(input), [input]);

  return (
    <section className="space-y-5">
      <Header
        title="OpenAPI Validator"
        description="Parse OpenAPI 3.x JSON or YAML and inspect required metadata, paths, operations, and responses."
      />
      <label className="block space-y-2">
        <span className="text-sm font-medium">OpenAPI document</span>
        <Textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          rows={18}
          className="font-mono"
          spellCheck={false}
        />
      </label>
      {result.ok ? (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <CopyableResult
              value={result.value.version}
              label="OpenAPI version"
              copyLabel="Copy OpenAPI version"
              rows={1}
            />
            <CopyableResult
              value={result.value.title || "Missing"}
              label="API title"
              copyLabel="Copy API title"
              rows={1}
            />
            <CopyableResult
              value={String(result.value.paths)}
              label="Path count"
              copyLabel="Copy path count"
              rows={1}
            />
            <CopyableResult
              value={String(result.value.operations)}
              label="Operation count"
              copyLabel="Copy operation count"
              rows={1}
            />
          </div>
          {result.value.issues.length ? (
            <div className="grid gap-3 md:grid-cols-2">
              {result.value.issues.map((issue, index) => (
                <CopyableResult
                  key={`${issue}-${index}`}
                  value={issue}
                  label={`Issue ${index + 1}`}
                  copyLabel={`Copy issue ${index + 1}`}
                  rows={2}
                  textareaClassName="border-destructive"
                />
              ))}
            </div>
          ) : (
            <CopyableResult
              value="No issues found."
              label="Validation result"
              copyLabel="Copy validation result"
              rows={1}
            />
          )}
        </div>
      ) : (
        <ErrorResult message={result.error} />
      )}
    </section>
  );
}
