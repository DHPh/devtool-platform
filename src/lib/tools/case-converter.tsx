"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Type } from "lucide-react";
import { toast } from "sonner";
import {
  ToolHeader,
  QuickActions,
  ResultCard,
  CopyableResult,
} from "@/components/layout";

export const metadata = {
  id: "case-converter",
  name: "Case Converter",
  description:
    "Convert text between different cases (camelCase, snake_case, etc.)",
  category: "Converters",
  tags: ["case", "converter", "camel", "snake", "kebab"],
  path: "/tools/case-converter",
  icon: "🔠",
};

export default function CaseConverter() {
  const [input, setInput] = useState("Hello World Example Text");

  const convertToCase = {
    camelCase: (text: string) => {
      return text
        .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
          return index === 0 ? word.toLowerCase() : word.toUpperCase();
        })
        .replace(/\s+/g, "");
    },

    PascalCase: (text: string) => {
      return text
        .replace(/(?:^\w|[A-Z]|\b\w)/g, (word) => {
          return word.toUpperCase();
        })
        .replace(/\s+/g, "");
    },

    snake_case: (text: string) => {
      return text
        .replace(/\W+/g, " ")
        .split(/ |\B(?=[A-Z])/)
        .map((word) => word.toLowerCase())
        .join("_");
    },

    SCREAMING_SNAKE_CASE: (text: string) => {
      return text
        .replace(/\W+/g, " ")
        .split(/ |\B(?=[A-Z])/)
        .map((word) => word.toUpperCase())
        .join("_");
    },

    "kebab-case": (text: string) => {
      return text
        .replace(/\W+/g, " ")
        .split(/ |\B(?=[A-Z])/)
        .map((word) => word.toLowerCase())
        .join("-");
    },

    "SCREAMING-KEBAB-CASE": (text: string) => {
      return text
        .replace(/\W+/g, " ")
        .split(/ |\B(?=[A-Z])/)
        .map((word) => word.toUpperCase())
        .join("-");
    },

    "dot.case": (text: string) => {
      return text
        .replace(/\W+/g, " ")
        .split(/ |\B(?=[A-Z])/)
        .map((word) => word.toLowerCase())
        .join(".");
    },

    "path/case": (text: string) => {
      return text
        .replace(/\W+/g, " ")
        .split(/ |\B(?=[A-Z])/)
        .map((word) => word.toLowerCase())
        .join("/");
    },

    "Title Case": (text: string) => {
      return text
        .toLowerCase()
        .replace(/(?:^|\s)\w/g, (match) => match.toUpperCase());
    },

    "Sentence case": (text: string) => {
      return text.toLowerCase().replace(/^\w/, (match) => match.toUpperCase());
    },

    UPPERCASE: (text: string) => {
      return text.toUpperCase();
    },

    lowercase: (text: string) => {
      return text.toLowerCase();
    },
  };

  const copyToClipboard = async (text: string, caseName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${caseName} copied to clipboard!`);
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  const results = Object.entries(convertToCase).map(
    ([caseName, converter]) => ({
      name: caseName,
      result: converter(input),
    })
  );

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
                onCopy={() => copyToClipboard(result, name)}
                copyLabel="Copy"
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
