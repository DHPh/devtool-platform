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
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { ToolContainer, ResponsiveTextArea } from "@/components/layout";

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

  return (
    <ToolContainer
      title="Case Converter"
      description="Convert text between different naming conventions and cases including camelCase, snake_case, kebab-case, and more"
    >
      <Card>
        <CardHeader>
          <CardTitle>Input Text</CardTitle>
          <CardDescription>
            Enter the text you want to convert to different cases
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveTextArea
            placeholder="Enter your text here...
Examples: 'Hello World', 'myVariableName', 'some-kebab-case'"
            value={input}
            onChange={setInput}
            minHeight={80}
            showCharacterCount={true}
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto">
        {results.map(({ name, result }) => (
          <Card key={name}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{name}</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(result, name)}
                  className="h-8 w-8 p-0"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="p-3 bg-muted rounded-md max-h-20 overflow-auto">
                <code className="text-sm break-all">{result}</code>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </ToolContainer>
  );
}
