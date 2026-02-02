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
import { Copy, Download, FileText, Eye } from "lucide-react";
import { toast } from "sonner";
import {
  ToolContainer,
  SettingsPanel,
  FormField,
  ActionButtons,
  ResponsiveTextArea,
  ModeTabs,
} from "@/components/layout";
import {
  MarkdownPreviewContent,
  renderMarkdownToSafeHtml,
} from "@/lib/markdown/markdown-renderer";

export const metadata = {
  id: "markdown-preview",
  name: "Markdown Preview",
  description: "Preview markdown with live editing",
  category: "Text & Format",
  tags: ["markdown", "preview", "editor"],
  path: "/tools/markdown-preview",
  icon: "📝",
};

export default function MarkdownPreview() {
  const [input, setInput] = useState(`# Hello World

This is a **markdown** preview tool.

## Features

- Live preview
- Syntax highlighting
- Easy to use

### Code Example

\`\`\`javascript
function hello() {
  console.log("Hello, World!");
}
\`\`\`

### List Example

1. First item
2. Second item
3. Third item

### Table Example

| Name | Age | City |
|------|-----|------|
| John | 30  | NYC  |
| Jane | 25  | LA   |

> This is a blockquote

[Link example](https://example.com)`);

  const [viewMode, setViewMode] = useState<"both" | "source" | "preview">(
    "both"
  );

  const copyMarkdown = () => {
    navigator.clipboard.writeText(input);
    toast.success("Markdown copied to clipboard!");
  };

  const copyHtml = () => {
    const htmlOutput = renderMarkdownToSafeHtml(input);
    navigator.clipboard.writeText(htmlOutput);
    toast.success("HTML copied to clipboard!");
  };

  const downloadMarkdown = () => {
    const blob = new Blob([input], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "document.md";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Markdown downloaded!");
  };

  const downloadHtml = () => {
    const htmlOutput = renderMarkdownToSafeHtml(input);
    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Markdown Preview</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }
        h1, h2, h3 { color: #333; }
        code { background: #f4f4f4; padding: 2px 4px; border-radius: 3px; }
        pre { background: #f4f4f4; padding: 10px; border-radius: 5px; overflow-x: auto; }
        blockquote { border-left: 4px solid #ddd; margin: 0; padding-left: 20px; color: #666; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        a { color: #0066cc; }
    </style>
</head>
<body>
    ${htmlOutput}
</body>
</html>`;

    const blob = new Blob([fullHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "document.html";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("HTML downloaded!");
  };

  const clearAll = () => {
    setInput("");
  };

  const loadExample = (example: string) => {
    setInput(example);
  };

  const examples = [
    {
      name: "Basic",
      code: `# Hello World\n\nThis is a **markdown** example with *italic* text.`,
    },
    {
      name: "Code",
      code: `# Code Example\n\n\`\`\`javascript\nfunction hello() {\n  console.log("Hello!");\n}\n\`\`\``,
    },
    {
      name: "List",
      code: `# Todo List\n\n- [ ] Task 1\n- [x] Task 2 (completed)\n- [ ] Task 3`,
    },
    {
      name: "Table",
      code: `# Data Table\n\n| Name | Age | City |\n|------|-----|------|\n| John | 30  | NYC  |\n| Jane | 25  | LA   |`,
    },
  ];

  // View mode options
  const viewModeOptions = [
    {
      value: "both",
      label: "Split View",
      description: "View markdown source and preview side by side",
    },
    {
      value: "source",
      label: "Source Only",
      description: "View only the markdown source code",
    },
    {
      value: "preview",
      label: "Preview Only",
      description: "View only the HTML preview",
    },
  ];

  // Action buttons configuration
  const actionButtons = [
    {
      label: "Copy Markdown",
      onClick: copyMarkdown,
      icon: Copy,
      variant: "outline" as const,
    },
    {
      label: "Copy HTML",
      onClick: copyHtml,
      icon: Copy,
      variant: "outline" as const,
    },
    {
      label: "Download MD",
      onClick: downloadMarkdown,
      icon: Download,
      variant: "outline" as const,
    },
    {
      label: "Download HTML",
      onClick: downloadHtml,
      icon: Download,
      variant: "outline" as const,
    },
  ];

  return (
    <ToolContainer
      title="Markdown Preview"
      description="Write markdown and see live preview with HTML output"
    >
      {/* View Mode Selection */}
      <ModeTabs
        value={viewMode}
        onValueChange={(value: string) =>
          setViewMode(value as "both" | "source" | "preview")
        }
        options={viewModeOptions}
      />

      {/* Settings Panel */}
      <SettingsPanel title="Editor Settings">
        <FormField
          label="Quick Examples"
          description="Click to load predefined markdown examples"
        >
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
        </FormField>

        <ActionButtons buttons={actionButtons} />
      </SettingsPanel>

      {/* Editor and Preview */}
      <div
        className={`grid gap-4 ${
          viewMode === "both" ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"
        }`}
      >
        {(viewMode === "both" || viewMode === "source") && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Markdown Source
              </CardTitle>
              <CardDescription>
                Write your markdown content here
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveTextArea
                placeholder="Enter markdown here..."
                value={input}
                onChange={(value) => setInput(value)}
                minHeight={400}
                showCharacterCount={true}
                showWordCount={true}
                showLineCount={true}
              />
            </CardContent>
          </Card>
        )}

        {(viewMode === "both" || viewMode === "preview") && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                HTML Preview
              </CardTitle>
              <CardDescription>Live preview of your markdown</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg p-4 min-h-[400px] max-h-[600px] overflow-y-auto">
                <div className="markdown-preview prose prose-sm max-w-none dark:prose-invert">
                  <MarkdownPreviewContent markdown={input} />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Clear Button */}
      <div className="flex justify-end">
        <Button variant="outline" onClick={clearAll}>
          Clear All
        </Button>
      </div>
    </ToolContainer>
  );
}
