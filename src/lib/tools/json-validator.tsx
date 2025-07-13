"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Copy } from "lucide-react";
import { toast } from "sonner";
import {
  ToolContainer,
  ResponsiveTextArea,
  ActionButtons,
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

  const validateJson = () => {
    if (!input.trim()) {
      setResult(null);
      return;
    }

    try {
      const parsed = JSON.parse(input);
      const formatted = JSON.stringify(parsed, null, 2);
      setResult({
        isValid: true,
        error: null,
        formatted,
      });
    } catch (error) {
      setResult({
        isValid: false,
        error: error instanceof Error ? error.message : "Invalid JSON",
        formatted: null,
      });
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard!");
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  const exampleJsons = [
    {
      name: "Simple Object",
      content: `{"name": "John", "age": 30, "city": "New York"}`,
    },
    {
      name: "Array",
      content: `[{"id": 1, "name": "Item 1"}, {"id": 2, "name": "Item 2"}]`,
    },
    {
      name: "Nested Object",
      content: `{"user": {"profile": {"name": "John", "settings": {"theme": "dark"}}}}`,
    },
  ];

  return (
    <ToolContainer
      title="JSON Validator"
      description="Validate JSON syntax, check for formatting errors, and get formatted output"
    >
      <Card>
        <CardHeader>
          <CardTitle>JSON Input</CardTitle>
          <CardDescription>
            Enter or paste your JSON to validate its syntax
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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

          <div className="flex gap-2 flex-wrap">
            {exampleJsons.map((example, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => setInput(example.content)}
              >
                {example.name}
              </Button>
            ))}
          </div>

          <Button onClick={validateJson} className="w-full">
            Validate JSON
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {result.isValid ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                <CardTitle
                  className={result.isValid ? "text-green-500" : "text-red-500"}
                >
                  {result.isValid ? "Valid JSON" : "Invalid JSON"}
                </CardTitle>
              </div>
              {result.isValid && (
                <ActionButtons
                  buttons={[
                    {
                      icon: Copy,
                      label: "Copy Formatted",
                      onClick: () => copyToClipboard(result.formatted!),
                    },
                  ]}
                />
              )}
            </div>
          </CardHeader>
          <CardContent>
            {result.isValid ? (
              <div className="space-y-4">
                <Badge variant="secondary" className="text-green-700">
                  JSON is valid and properly formatted
                </Badge>
                <div className="max-h-96 overflow-auto">
                  <pre className="bg-muted p-4 rounded-md text-sm overflow-x-auto">
                    {result.formatted}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Badge variant="destructive">Syntax Error Found</Badge>
                <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md">
                  <p className="text-red-700 dark:text-red-300 text-sm font-mono">
                    {result.error}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </ToolContainer>
  );
}
