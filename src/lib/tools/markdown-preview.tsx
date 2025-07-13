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
  Copy,
  Download,
  FileText,
  Eye,
  Maximize2,
} from "lucide-react";
import { toast } from "sonner";

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

  const [showPreview, setShowPreview] = useState(true);
  const [showSource, setShowSource] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  // Enhanced markdown to HTML converter
  const convertMarkdownToHtml = (markdown: string) => {
    let html = markdown;

    // Handle code blocks first (to prevent other conversions inside them)
    html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
      return `<pre><code class="language-${
        lang || "text"
      }">${code.trim()}</code></pre>`;
    });

    // Handle inline code
    html = html.replace(/`([^`]+)`/g, "<code>$1</code>");

    // Handle headers (must be on their own line)
    html = html.replace(/^# (.*$)/gm, "<h1>$1</h1>");
    html = html.replace(/^## (.*$)/gm, "<h2>$1</h2>");
    html = html.replace(/^### (.*$)/gm, "<h3>$1</h3>");
    html = html.replace(/^#### (.*$)/gm, "<h4>$1</h4>");
    html = html.replace(/^##### (.*$)/gm, "<h5>$1</h5>");
    html = html.replace(/^###### (.*$)/gm, "<h6>$1</h6>");

    // Handle bold and italic
    html = html.replace(/\*\*\*(.*?)\*\*\*/g, "<strong><em>$1</em></strong>");
    html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");

    // Handle links
    html = html.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
    );

    // Handle images
    html = html.replace(
      /!\[([^\]]*)\]\(([^)]+)\)/g,
      '<img src="$2" alt="$1" style="max-width: 100%;">'
    );

    // Handle blockquotes
    html = html.replace(/^> (.*$)/gm, "<blockquote>$1</blockquote>");

    // Handle tables
    const tableRegex = /^(\|.+\|)\n(\|[-:| ]+\|)\n((\|.+\|(?:\n|$))*)/gm;
    html = html.replace(tableRegex, (match, header, separator, body) => {
      // Parse header
      const headerCells = header
        .split("|")
        .slice(1, -1)
        .map((cell: string) => cell.trim());

      // Parse body rows
      const bodyRows = body
        .trim()
        .split("\n")
        .map((row: string) =>
          row
            .split("|")
            .slice(1, -1)
            .map((cell: string) => cell.trim())
        );

      let table = "<table><thead><tr>";
      headerCells.forEach((cell: string) => {
        table += `<th>${cell}</th>`;
      });
      table += "</tr></thead><tbody>";

      bodyRows.forEach((row: string[]) => {
        table += "<tr>";
        row.forEach((cell: string) => {
          table += `<td>${cell}</td>`;
        });
        table += "</tr>";
      });

      table += "</tbody></table>";
      return table;
    });

    // Handle horizontal rules
    html = html.replace(/^---$/gm, "<hr>");

    // Handle lists (numbered and bullet)
    const lines = html.split("\n");
    let inOrderedList = false;
    let inUnorderedList = false;
    const result: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Check for ordered list
      if (/^\d+\. /.test(line)) {
        if (!inOrderedList) {
          if (inUnorderedList) {
            result.push("</ul>");
            inUnorderedList = false;
          }
          result.push("<ol>");
          inOrderedList = true;
        }
        result.push("<li>" + line.replace(/^\d+\. /, "") + "</li>");
      }
      // Check for unordered list
      else if (/^- /.test(line)) {
        if (!inUnorderedList) {
          if (inOrderedList) {
            result.push("</ol>");
            inOrderedList = false;
          }
          result.push("<ul>");
          inUnorderedList = true;
        }
        result.push("<li>" + line.replace(/^- /, "") + "</li>");
      }
      // Not a list item
      else {
        if (inOrderedList) {
          result.push("</ol>");
          inOrderedList = false;
        }
        if (inUnorderedList) {
          result.push("</ul>");
          inUnorderedList = false;
        }
        result.push(line);
      }
    }

    // Close any remaining lists
    if (inOrderedList) result.push("</ol>");
    if (inUnorderedList) result.push("</ul>");

    html = result.join("\n");

    // Handle line breaks (but not in code blocks)
    html = html.replace(/\n/g, "<br>");

    // Clean up extra breaks around block elements
    html = html.replace(/<br><(h[1-6]|div|p|blockquote|pre|table)>/g, "<$1>");
    html = html.replace(
      /<\/(h[1-6]|div|p|blockquote|pre|table)><br>/g,
      "</$1>"
    );

    return html;
  };

  const htmlOutput = convertMarkdownToHtml(input);

  const copyMarkdown = () => {
    navigator.clipboard.writeText(input);
    toast.success("Markdown copied to clipboard!");
  };

  const copyHtml = () => {
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Markdown Preview
          </CardTitle>
          <CardDescription>
            Write markdown and see live preview with HTML output
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <Button
                variant={showSource ? "default" : "outline"}
                size="sm"
                onClick={() => setShowSource(!showSource)}
              >
                <FileText className="h-4 w-4 mr-2" />
                Source
              </Button>
              <Button
                variant={showPreview ? "default" : "outline"}
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
            </div>
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

          {/* Dynamic grid layout based on visible panels */}
          <div
            className={`grid gap-4 ${
              showSource && showPreview
                ? "grid-cols-1 lg:grid-cols-2"
                : "grid-cols-1"
            }`}
          >
            {showSource && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="input">Markdown Input</Label>
                  {!showPreview && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsExpanded(!isExpanded)}
                      className="text-xs"
                    >
                      <Maximize2 className="h-3 w-3 mr-1" />
                      {isExpanded ? "Normal" : "Expand"}
                    </Button>
                  )}
                </div>
                <Textarea
                  id="input"
                  placeholder="Enter markdown here..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className={`font-mono text-sm tool-input textarea-enhanced transition-all duration-300 ${
                    !showPreview && isExpanded
                      ? "min-h-[600px]"
                      : "min-h-[400px]"
                  }`}
                />
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={copyMarkdown}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy MD
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadMarkdown}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download MD
                  </Button>
                </div>
              </div>
            )}

            {showPreview && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>HTML Preview</Label>
                  {!showSource && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsExpanded(!isExpanded)}
                      className="text-xs"
                    >
                      <Maximize2 className="h-3 w-3 mr-1" />
                      {isExpanded ? "Normal" : "Expand"}
                    </Button>
                  )}
                </div>
                <div
                  className={`border rounded-lg p-4 tool-output overflow-y-auto transition-all duration-300 ${
                    !showSource && isExpanded
                      ? "min-h-[600px] max-h-[800px]"
                      : "min-h-[400px] max-h-96"
                  }`}
                >
                  <div
                    className="markdown-preview"
                    dangerouslySetInnerHTML={{ __html: htmlOutput }}
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={copyHtml}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy HTML
                  </Button>
                  <Button variant="outline" size="sm" onClick={downloadHtml}>
                    <Download className="h-4 w-4 mr-2" />
                    Download HTML
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={clearAll}>
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
