"use client";

import { useMemo, useState } from "react";
import {
  CopyableResult,
  ToolErrorResult as ErrorResult,
  ToolSectionHeader as Header,
} from "@/components/layout";
import { Textarea } from "@/components/ui/textarea";
import {
  validateKubernetesManifest,
  type ValidationIssue,
} from "@/lib/processors/devops-validation-core";

const KUBERNETES_SAMPLE = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
spec:
  replicas: 2`;

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

export function KubernetesManifestValidatorTab() {
  const [input, setInput] = useState(KUBERNETES_SAMPLE);
  const result = useMemo(() => validateKubernetesManifest(input), [input]);

  return (
    <section className="space-y-5">
      <Header
        title="Kubernetes Manifest Validator"
        description="Parse multi-document Kubernetes YAML and verify required resource fields."
      />
      <label className="block space-y-2">
        <span className="text-sm font-medium">Kubernetes YAML</span>
        <Textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          rows={17}
          className="font-mono"
          spellCheck={false}
        />
      </label>
      {result.ok ? (
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            {result.value.resources.map((resource, index) => (
              <CopyableResult
                key={`${resource.kind}-${resource.name}-${index}`}
                value={`${resource.apiVersion}\n${resource.kind}\n${resource.name}`}
                label={`Resource ${index + 1}`}
                copyLabel={`Copy resource ${index + 1}`}
                rows={3}
              />
            ))}
          </div>
          <IssueResults issues={result.value.issues} />
        </div>
      ) : (
        <ErrorResult message={result.error} />
      )}
    </section>
  );
}
