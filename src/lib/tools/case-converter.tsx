"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Copy } from "lucide-react";
import { toast } from "sonner";

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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Case Converter</CardTitle>
          <CardDescription>
            Convert text between different naming conventions and cases
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="input">Input Text</Label>
              <Textarea
                id="input"
                placeholder="Enter your text here..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={3}
              />
            </div>
          </div>
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
    </div>
  );
}
