"use client";

import { useState } from "react";
import { FileText, Download } from "lucide-react";
import { toast } from "sonner";
import {
  ToolHeader,
  QuickActions,
  ResultCard,
  CopyableResult,
  ResponsiveTextArea,
  ModeTabs,
} from "@/components/layout";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

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

  const loadExample = (code: string) => {
    setInput(code);
    toast.success("Example loaded!");
  };

  const copyOutput = async () => {
    await navigator.clipboard.writeText(output);
    toast.success("Copied to clipboard!");
  };

  const downloadOutput = () => {
    const blob = new Blob([output], { type: "text/css" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `formatted-styles.css`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Downloaded!");
  };

  const clearAll = () => {
    setInput("");
    setOutput("");
  };

  return (
    <div className="space-y-6">
      <ToolHeader
        title="CSS Formatter"
        description="Format, beautify, or minify CSS code with customizable indentation"
        icon={FileText}
      />

      <ModeTabs
        value={mode}
        onValueChange={(value) => setMode(value as "format" | "minify")}
        options={[
          {
            value: "format",
            label: "Format",
            description: "Beautify CSS with proper indentation and formatting",
          },
          {
            value: "minify",
            label: "Minify",
            description: "Compress CSS by removing whitespace and unnecessary characters",
          },
        ]}
      />

      <QuickActions
        actions={[
          {
            id: "format",
            label: mode === "format" ? "Format CSS" : "Minify CSS",
            onClick: formatCss,
            variant: "default" as const,
          },
          {
            id: "clear",
            label: "Clear All",
            onClick: clearAll,
            variant: "outline" as const,
          },
          ...examples.map(example => ({
            id: `example-${example.name.toLowerCase().replace(/\s+/g, '-')}`,
            label: example.name,
            onClick: () => loadExample(example.code),
            variant: "outline" as const,
          })),
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input */}
        <div className="space-y-4">
          <div>
            <Label className="block text-sm font-medium mb-2">Input CSS</Label>
            <ResponsiveTextArea
              value={input}
              onChange={setInput}
              placeholder="Enter CSS code here..."
              minHeight={300}
              showCharacterCount={true}
              allowFileUpload={true}
              acceptedFileTypes=".css"
            />
          </div>

          {mode === "format" && (
            <ResultCard
              title="Format Settings"
              description="Customize CSS formatting options"
              status="info"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="indent-size">Indent Size</Label>
                  <Select value={indentSize} onValueChange={setIndentSize}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">2 spaces</SelectItem>
                      <SelectItem value="4">4 spaces</SelectItem>
                      <SelectItem value="8">8 spaces</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="indent-type">Indent Type</Label>
                  <Select value={indentType} onValueChange={setIndentType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="spaces">Spaces</SelectItem>
                      <SelectItem value="tabs">Tabs</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </ResultCard>
          )}
        </div>

        {/* Output */}
        <div className="space-y-4">
          <ResultCard
            title={mode === "format" ? "Formatted CSS" : "Minified CSS"}
            description={`${output.split("\n").length} lines, ${output.length} characters`}
            status={output ? "success" : "info"}
            onCopy={output ? copyOutput : undefined}
            copyLabel="Copy CSS"
          >
            <div className="space-y-2">
              {output && (
                <div className="flex gap-2 mb-4">
                  <Download
                    className="h-4 w-4 cursor-pointer text-muted-foreground hover:text-foreground"
                    onClick={downloadOutput}
                  />
                </div>
              )}
              <CopyableResult
                value={output}
                placeholder={`${mode === "format" ? "Formatted" : "Minified"} CSS will appear here...`}
                fontFamily="mono"
                rows={12}
              />
            </div>
          </ResultCard>
        </div>
      </div>

      {/* Information */}
      <ResultCard
        title="About CSS Formatting"
        status="info"
        description="Learn about CSS formatting and optimization"
      >
        <div className="space-y-4 text-sm text-muted-foreground">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="font-medium mb-2">Format Benefits</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Improved code readability</li>
                <li>Consistent indentation</li>
                <li>Better debugging experience</li>
                <li>Easier maintenance</li>
              </ul>
            </div>
            <div>
              <p className="font-medium mb-2">Minify Benefits</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Reduced file size</li>
                <li>Faster page load times</li>
                <li>Lower bandwidth usage</li>
                <li>Production optimization</li>
              </ul>
            </div>
          </div>
          <p className="text-xs bg-muted p-2 rounded">
            <strong>Tip:</strong> Use formatted CSS during development and minified CSS for production.
          </p>
        </div>
      </ResultCard>
    </div>
  );
}
