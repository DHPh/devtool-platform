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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Copy, Download, FileText, Minimize, Maximize } from "lucide-react";
import { toast } from "sonner";

export const metadata = {
  id: "css-formatter",
  name: "CSS Formatter",
  description: "Format and beautify CSS code with proper indentation",
  category: "Text & Format",
  tags: ["css", "formatter", "beautify", "minify"],
  path: "/tools/css-formatter",
  icon: "🎨",
};

export default function CssFormatter() {
  const [input, setInput] = useState(
    ".header { color: red; background: blue; } .footer { margin: 10px; }"
  );
  const [output, setOutput] = useState("");
  const [mode, setMode] = useState<"format" | "minify">("format");
  const [indentSize, setIndentSize] = useState("2");
  const [indentType, setIndentType] = useState("spaces");

  const formatCss = () => {
    if (!input.trim()) {
      setOutput("");
      return;
    }

    try {
      let formatted = input;

      if (mode === "format") {
        const indent =
          indentType === "spaces" ? " ".repeat(parseInt(indentSize)) : "\t";

        // Remove extra whitespace and format
        formatted = formatted
          .replace(/\s*{\s*/g, " {\n")
          .replace(/;\s*/g, ";\n")
          .replace(/\s*}\s*/g, "\n}\n")
          .replace(/,\s*/g, ",\n")
          .replace(/\n\s*\n/g, "\n")
          .trim();

        // Add proper indentation
        const lines = formatted.split("\n");
        let level = 0;
        formatted = lines
          .map((line) => {
            const trimmed = line.trim();
            if (trimmed.includes("}")) level--;
            const indented = trimmed ? indent.repeat(level) + trimmed : "";
            if (trimmed.includes("{")) level++;
            return indented;
          })
          .join("\n");
      } else {
        // Minify CSS
        formatted = formatted
          .replace(/\/\*[\s\S]*?\*\//g, "") // Remove comments
          .replace(/\s*{\s*/g, "{")
          .replace(/;\s*/g, ";")
          .replace(/\s*}\s*/g, "}")
          .replace(/,\s*/g, ",")
          .replace(/:\s*/g, ":")
          .replace(/\s+/g, " ")
          .trim();
      }

      setOutput(formatted);
    } catch {
      toast.error("Error processing CSS");
      setOutput("Error: Invalid CSS");
    }
  };

  const copyOutput = () => {
    navigator.clipboard.writeText(output);
    toast.success("Copied to clipboard!");
  };

  const downloadOutput = () => {
    const blob = new Blob([output], { type: "text/css" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = mode === "format" ? "formatted.css" : "minified.css";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Downloaded!");
  };

  const clearAll = () => {
    setInput("");
    setOutput("");
  };

  const loadExample = (example: string) => {
    setInput(example);
  };

  const examples = [
    {
      name: "Basic CSS",
      code: ".header { color: red; background: blue; } .footer { margin: 10px; padding: 5px; }",
    },
    {
      name: "Responsive CSS",
      code: "@media (max-width: 768px) { .container { width: 100%; } .sidebar { display: none; } }",
    },
    {
      name: "Flexbox Layout",
      code: ".container { display: flex; justify-content: center; align-items: center; flex-direction: column; }",
    },
    {
      name: "CSS Grid",
      code: ".grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; }",
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            CSS Formatter
          </CardTitle>
          <CardDescription>
            Format, beautify, or minify CSS code with customizable indentation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <div className="space-y-2">
              <Label htmlFor="mode">Mode</Label>
              <Select
                value={mode}
                onValueChange={(value: "format" | "minify") => setMode(value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="format">Format</SelectItem>
                  <SelectItem value="minify">Minify</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {mode === "format" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="indent-size">Indent Size</Label>
                  <Select value={indentSize} onValueChange={setIndentSize}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">2</SelectItem>
                      <SelectItem value="4">4</SelectItem>
                      <SelectItem value="8">8</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="indent-type">Indent Type</Label>
                  <Select value={indentType} onValueChange={setIndentType}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="spaces">Spaces</SelectItem>
                      <SelectItem value="tabs">Tabs</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="examples">Examples</Label>
            <div className="flex flex-wrap gap-2">
              {examples.map((example, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => loadExample(example.code)}
                >
                  {example.name}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="input">Input CSS</Label>
            <Textarea
              id="input"
              placeholder="Enter CSS code here..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="min-h-[200px] font-mono text-sm tool-input textarea-enhanced"
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={formatCss} className="flex items-center gap-2">
              {mode === "format" ? (
                <Maximize className="h-4 w-4" />
              ) : (
                <Minimize className="h-4 w-4" />
              )}
              {mode === "format" ? "Format" : "Minify"}
            </Button>
            <Button variant="outline" onClick={clearAll}>
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {output && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {mode === "format" ? "Formatted" : "Minified"} CSS
            </CardTitle>
            <CardDescription>
              <div className="flex gap-2">
                <Badge variant="outline">
                  {output.split("\n").length} lines
                </Badge>
                <Badge variant="outline">{output.length} characters</Badge>
              </div>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={copyOutput}>
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
              <Button variant="outline" size="sm" onClick={downloadOutput}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>

            <div className="relative">
              <Textarea
                value={output}
                readOnly
                className="min-h-[200px] font-mono text-sm tool-output textarea-enhanced"
                placeholder="Formatted CSS will appear here..."
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
