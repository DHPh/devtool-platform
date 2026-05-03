"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Type } from "lucide-react";
import {
  ToolHeader,
  QuickActions,
  ResultCard,
  CopyableResult,
} from "@/components/layout";
import { convertTextToAllCases } from "@/lib/processors/text";

export default function CaseConverter() {
  const [input, setInput] = useState("Hello World Example Text");

  const results = convertTextToAllCases(input);

  const sampleTexts = [
    "Hello World Example",
    "myVariableName",
    "some-kebab-case",
    "user_account_settings",
  ];

  return (
    <div className="space-y-6">
      <ToolHeader
        title="Case Converter"
        description="Convert text between different naming conventions and cases including camelCase, snake_case, kebab-case, and more"
        icon={Type}
      />

      <QuickActions
        actions={[
          ...sampleTexts.map((sample, index) => ({
            id: `sample-${index}`,
            label: sample,
            onClick: () => setInput(sample),
          })),
          {
            id: "clear",
            label: "Clear",
            onClick: () => setInput(""),
            variant: "outline" as const,
          },
        ]}
      />

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Input Section */}
        <div>
          <ResultCard
            title="Input Text"
            description="Enter the text you want to convert to different cases"
            status="info"
          >
            <Textarea
              placeholder="Enter your text here...
Examples: 'Hello World', 'myVariableName', 'some-kebab-case'"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="min-h-[120px] font-mono text-sm"
            />
          </ResultCard>
        </div>

        {/* Results Section */}
        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {results.map(({ name, result }) => (
              <ResultCard
                key={name}
                title={name}
                status="success"
              >
                <CopyableResult
                  value={result}
                  fontFamily="mono"
                  rows={2}
                />
              </ResultCard>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
