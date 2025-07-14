"use client";

import { useState } from "react";
import { Code } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  ToolHeader,
  QuickActions,
  ResultCard,
  ValidationMessages,
  CopyableResult,
  ResponsiveTextArea,
} from "@/components/layout";

export const metadata = {
  id: "json-validator",
  name: "JSON Validator",
  description: "Validate JSON syntax and structure",
  category: "Validators",
  tags: ["json", "validator", "syntax"],
  path: "/tools/json-validator",
  icon: "✅",
};

export default function JsonValidator() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<{
    isValid: boolean;
    error: string | null;
    formatted: string | null;
  } | null>(null);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard!");
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  const sampleData = {
    simple: '{"name": "John Doe", "age": 30, "city": "New York"}',
    array: '[{"id": 1, "name": "Item 1"}, {"id": 2, "name": "Item 2"}]',
    nested: '{"user": {"profile": {"name": "John", "settings": {"theme": "dark"}}}}',
    complex: '{"products": [{"id": 1, "name": "Laptop", "price": 999.99, "tags": ["electronics"]}, {"id": 2, "name": "Phone", "price": 599.99}]}'
  };

  const validateJson = () => {
    if (!input.trim()) {
      setResult({
        isValid: false,
        error: "Please enter JSON to validate",
        formatted: "",
      });
      return;
    }

    try {
      const parsed = JSON.parse(input);
      const formatted = JSON.stringify(parsed, null, 2);
      setResult({
        isValid: true,
        error: "",
        formatted,
      });
    } catch (err) {
      setResult({
        isValid: false,
        error: err instanceof Error ? err.message : "Invalid JSON",
        formatted: "",
      });
    }
  };

  const clearInput = () => {
    setInput("");
    setResult(null);
  };

  return (
    <div className="space-y-6">
      <ToolHeader
        title="JSON Validator"
        description="Validate JSON syntax, check for formatting errors, and get formatted output"
        icon={Code}
      />

      <QuickActions
        actions={[
          {
            id: "simple",
            label: "Simple Object",
            onClick: () => setInput(sampleData.simple),
          },
          {
            id: "array",
            label: "Array",
            onClick: () => setInput(sampleData.array),
          },
          {
            id: "nested",
            label: "Nested Object",
            onClick: () => setInput(sampleData.nested),
          },
          {
            id: "complex",
            label: "Complex Data",
            onClick: () => setInput(sampleData.complex),
          },
          {
            id: "clear",
            label: "Clear",
            onClick: clearInput,
            variant: "outline" as const,
          },
        ]}
      />

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            JSON Input
          </label>
          <ResponsiveTextArea
            placeholder='Paste your JSON here...
Example: {"name": "John", "age": 30}'
            value={input}
            onChange={(value) => {
              setInput(value);
              setResult(null);
            }}
            minHeight={250}
            showCharacterCount={true}
            showLineCount={true}
          />
        </div>

        <div className="flex gap-2">
          <Button onClick={validateJson} className="w-full">
            Validate JSON
          </Button>
        </div>
      </div>

      {result && (
        <>
          <ValidationMessages
            errors={result.isValid ? [] : [result.error || "Invalid JSON"]}
            successes={result.isValid ? ["JSON is valid and properly formatted"] : []}
          />

          {result.isValid && result.formatted && (
            <ResultCard
              title="Formatted JSON"
              status="success"
              onCopy={() => copyToClipboard(result.formatted!)}
            >
              <CopyableResult
                value={result.formatted}
                fontFamily="mono"
              />
            </ResultCard>
          )}
        </>
      )}
    </div>
  );
}
