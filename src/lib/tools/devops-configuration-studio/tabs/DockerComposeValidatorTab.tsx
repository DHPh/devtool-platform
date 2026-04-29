"use client";

import { useMemo, useState } from "react";
import {
  CodeEditor,
  CopyableResult,
  ToolErrorResult as ErrorResult,
  ToolSectionHeader as Header,
} from "@/components/layout";
import {
  validateDockerCompose,
  type ValidationIssue,
} from "@/lib/processors/devops-validation-core";

const COMPOSE_SAMPLE = `services:
  web:
    image: nginx:1.27-alpine
    ports:
      - "8080:80"`;

function IssueResults({ issues }: { issues: ValidationIssue[] }) {
  if (!issues.length) {
    return (
      <CopyableResult
        value="No issues found."
        label="Validation result"
        copyLabel="Copy validation result"
        rows={1}
      />
    );
  }
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {issues.map((issue, index) => {
        const value = `${issue.severity.toUpperCase()}${issue.line ? ` · line ${issue.line}` : ""}: ${issue.message}`;
        return (
          <CopyableResult
            key={`${value}-${index}`}
            value={value}
            label={`Issue ${index + 1}`}
            copyLabel={`Copy issue ${index + 1}`}
            rows={2}
            textareaClassName={
              issue.severity === "error"
                ? "border-destructive"
                : "border-amber-500"
            }
          />
        );
      })}
    </div>
  );
}

export function DockerComposeValidatorTab() {
  const [input, setInput] = useState(COMPOSE_SAMPLE);
  const result = useMemo(() => validateDockerCompose(input), [input]);

  return (
    <section className="space-y-5">
      <Header
        title="Docker Compose Validator"
        description="Parse Compose YAML and validate service and top-level field shapes locally."
      />
      <div className="space-y-2">
        <span className="block text-sm font-medium">compose.yaml</span>
        <CodeEditor
          value={input}
          onChange={setInput}
          language="yaml"
          aria-label="compose.yaml"
          rows={16}
        />
      </div>
      {result.ok ? (
        <div className="space-y-4">
          <CopyableResult
            value={result.value.services.join("\n")}
            label="Services"
            copyLabel="Copy services"
            rows={Math.max(2, result.value.services.length)}
          />
          <IssueResults issues={result.value.issues} />
        </div>
      ) : (
        <ErrorResult message={result.error} />
      )}
    </section>
  );
}
