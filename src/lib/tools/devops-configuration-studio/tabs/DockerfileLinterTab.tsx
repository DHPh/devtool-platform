"use client";

import { useMemo, useState } from "react";
import {
  CodeEditor,
  CopyableResult,
  ToolErrorResult as ErrorResult,
  ToolSectionHeader as Header,
} from "@/components/layout";
import {
  lintDockerfile,
  type ValidationIssue,
} from "@/lib/processors/devops-validation-core";

const DOCKERFILE_SAMPLE = `FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
USER node
CMD ["node", "server.js"]`;

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

export function DockerfileLinterTab() {
  const [input, setInput] = useState(DOCKERFILE_SAMPLE);
  const result = useMemo(() => lintDockerfile(input), [input]);

  return (
    <section className="space-y-5">
      <Header
        title="Dockerfile Linter"
        description="Check Dockerfile structure and flag common image security and reproducibility risks."
      />
      <div className="space-y-2">
        <span className="block text-sm font-medium">Dockerfile</span>
        <CodeEditor
          value={input}
          onChange={setInput}
          language="plaintext"
          aria-label="Dockerfile"
          rows={16}
        />
      </div>
      {result.ok ? (
        <div className="space-y-4">
          <CopyableResult
            value={`${result.value.instructions} instructions\n${result.value.stages} build stages\n${result.value.issues.length} issues`}
            label="Summary"
            copyLabel="Copy summary"
            rows={3}
          />
          <IssueResults issues={result.value.issues} />
        </div>
      ) : (
        <ErrorResult message={result.error} />
      )}
    </section>
  );
}
