"use client";

import { useState } from "react";
import {
  CopyableResult,
  ToolSectionHeader as Header,
} from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatGraphql } from "@/lib/processors/data-workflow-core";

export function GraphqlFormatterTab() {
  const [input, setInput] = useState(
    "query User($id: ID!) { user(id: $id) { id name email } }",
  );
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [formatting, setFormatting] = useState(false);

  const format = async () => {
    setFormatting(true);
    const result = await formatGraphql(input);
    if (result.ok) {
      setOutput(result.value);
      setError("");
    } else {
      setOutput("");
      setError(result.error);
    }
    setFormatting(false);
  };

  return (
    <section className="space-y-5">
      <Header
        title="GraphQL Formatter"
        description="Format and parse-check GraphQL queries, mutations, fragments, and schemas locally."
      />
      <Button
        type="button"
        onClick={() => void format()}
        disabled={formatting}
      >
        {formatting ? "Formatting…" : "Format GraphQL"}
      </Button>
      <div className="grid gap-4 lg:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-medium">Input</span>
          <Textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            rows={18}
            className="font-mono"
            spellCheck={false}
          />
        </label>
        <div>
          {error ? (
            <div role="alert">
              <CopyableResult
                value={error}
                label="Error"
                copyLabel="Copy error"
                rows={5}
                textareaClassName="border-destructive text-destructive"
              />
            </div>
          ) : (
            <CopyableResult
              value={output}
              label="Result"
              copyLabel="Copy result"
              rows={18}
            />
          )}
        </div>
      </div>
    </section>
  );
}
