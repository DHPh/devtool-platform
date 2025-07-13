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
import { Copy, Download, FileText } from "lucide-react";
import { toast } from "sonner";

export const metadata = {
  id: "html-formatter",
  name: "HTML Formatter",
  description: "Format and beautify HTML code with proper indentation",
  category: "Text & Format",
  tags: ["html", "formatter", "beautify", "indent"],
  path: "/tools/html-formatter",
  icon: "🌐",
};

export default function HtmlFormatter() {
  const [input, setInput] = useState(
    "<div><p>Hello World</p><span>Unformatted HTML</span></div>"
  );
  const [output, setOutput] = useState("");
  const [indentSize, setIndentSize] = useState("2");
  const [indentType, setIndentType] = useState("spaces");

  const formatHtml = () => {
    if (!input.trim()) {
      setOutput("");
      return;
    }

    try {
      const indent =
        indentType === "spaces" ? " ".repeat(parseInt(indentSize)) : "\t";
      let formatted = input;
      let level = 0;

      // Remove extra whitespace but preserve content
      formatted = formatted.replace(/>\s+</g, "><");

      // Split into tokens
      const tokens = formatted
        .split(/(<\/?[^>]*>)/)
        .filter((token) => token.length > 0);
      const result: string[] = [];

      for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];

        if (token.startsWith("<")) {
          // HTML tag
          const isClosing = token.startsWith("</");
          const isSelfClosing = token.endsWith("/>");
          const isVoidElement =
            /^<(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr|!doctype|!DOCTYPE)/i.test(
              token
            );

          if (isClosing) {
            level = Math.max(0, level - 1);
            result.push(`\n${indent.repeat(level)}${token}`);
          } else if (isSelfClosing || isVoidElement) {
            result.push(`\n${indent.repeat(level)}${token}`);
          } else {
            result.push(`\n${indent.repeat(level)}${token}`);
            level++;
          }
        } else {
          // Text content
          const trimmed = token.trim();
          if (trimmed) {
            result.push(trimmed);
          }
        }
      }

      // Join and clean up
      formatted = result.join("").trim();

      // Clean up extra newlines
      formatted = formatted.replace(/\n\s*\n/g, "\n");

      setOutput(formatted);
    } catch {
      toast.error("Error formatting HTML");
      setOutput("Error: Invalid HTML");
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(output);
      toast.success("Formatted HTML copied to clipboard!");
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  const downloadHtml = () => {
    const blob = new Blob([output], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "formatted.html";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("HTML file downloaded!");
  };

  const minifyHtml = () => {
    if (!input.trim()) {
      setOutput("");
      return;
    }

    try {
      let minified = input;
      // Remove HTML comments (but preserve conditional comments)
      minified = minified.replace(/<!--(?!\[if|<!\[endif)[\s\S]*?-->/g, "");
      // Remove extra whitespace between tags
      minified = minified.replace(/>\s+</g, "><");
      // Remove whitespace from the beginning and end of tags
      minified = minified.replace(/>\s+/g, ">");
      minified = minified.replace(/\s+</g, "<");
      // Compress whitespace within text content
      minified = minified.replace(/\s+/g, " ");
      // Remove leading/trailing whitespace
      minified = minified.trim();

      setOutput(minified);
    } catch {
      toast.error("Error minifying HTML");
      setOutput("Error: Invalid HTML");
    }
  };

  const validateHtml = () => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for unclosed tags
    const openTags = input.match(/<[^\/!][^>]*>/g) || [];
    const closeTags = input.match(/<\/[^>]*>/g) || [];

    const openTagNames = openTags
      .map((tag) => tag.match(/<(\w+)/)?.[1])
      .filter(Boolean);
    const closeTagNames = closeTags
      .map((tag) => tag.match(/<\/(\w+)/)?.[1])
      .filter(Boolean);

    openTagNames.forEach((tag) => {
      if (
        tag &&
        !closeTagNames.includes(tag) &&
        !["img", "br", "hr", "input", "meta", "link"].includes(tag)
      ) {
        warnings.push(`Unclosed tag: ${tag}`);
      }
    });

    // Check for basic HTML structure
    if (!input.includes("<html") && !input.includes("<HTML")) {
      warnings.push("Missing <html> tag");
    }

    if (!input.includes("<head") && !input.includes("<HEAD")) {
      warnings.push("Missing <head> tag");
    }

    if (!input.includes("<body") && !input.includes("<BODY")) {
      warnings.push("Missing <body> tag");
    }

    return { errors, warnings };
  };

  const { errors, warnings } = validateHtml();

  const examples = [
    {
      name: "Basic HTML",
      code: "<div><p>Hello World</p><span>Example</span></div>",
    },
    {
      name: "HTML Document",
      code: "<!DOCTYPE html><html><head><title>Test</title></head><body><h1>Hello</h1><p>World</p></body></html>",
    },
    {
      name: "Form Example",
      code: '<form><input type="text" name="name"><button type="submit">Submit</button></form>',
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>HTML Formatter</CardTitle>
          <CardDescription>
            Format, beautify, and minify HTML code with customizable indentation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between min-h-[2.5rem]">
                <Label htmlFor="input">HTML Input</Label>
                <div className="flex gap-2 w-[140px] justify-end">
                  {/* Placeholder để maintain symmetry */}
                </div>
              </div>

              <div className="space-y-2">
                <Textarea
                  id="input"
                  placeholder="Paste your HTML here..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  rows={12}
                  className="font-mono text-sm tool-input textarea-enhanced"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Indent Size</Label>
                  <Select value={indentSize} onValueChange={setIndentSize}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1</SelectItem>
                      <SelectItem value="2">2</SelectItem>
                      <SelectItem value="4">4</SelectItem>
                      <SelectItem value="8">8</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Indent Type</Label>
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

              <div className="flex gap-2">
                <Button onClick={formatHtml} className="flex-1">
                  <FileText className="h-4 w-4 mr-2" />
                  Format HTML
                </Button>
                <Button
                  onClick={minifyHtml}
                  variant="outline"
                  className="flex-1"
                >
                  Minify
                </Button>
              </div>

              <div className="space-y-2">
                <Label>Examples</Label>
                <div className="grid gap-2">
                  {examples.map((example) => (
                    <Button
                      key={example.name}
                      variant="outline"
                      size="sm"
                      onClick={() => setInput(example.code)}
                      className="justify-start text-xs"
                    >
                      {example.name}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Output Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between min-h-[2.5rem]">
                <Label>Formatted Output</Label>
                <div className="flex gap-2 w-[140px] justify-end">
                  {output ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={copyToClipboard}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={downloadHtml}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </>
                  ) : (
                    // Invisible placeholder buttons để maintain layout
                    <div className="invisible flex gap-2">
                      <Button variant="outline" size="sm">
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div className="relative">
                <Textarea
                  value={output}
                  readOnly
                  placeholder="Formatted HTML will appear here..."
                  rows={12}
                  className="font-mono text-sm tool-output textarea-enhanced"
                />
                {output && (
                  <div className="absolute top-2 right-2">
                    <Badge variant="secondary" className="text-xs">
                      {output.split("\n").length} lines
                    </Badge>
                  </div>
                )}
              </div>

              {/* Validation Results */}
              {(errors.length > 0 || warnings.length > 0) && (
                <div className="space-y-2">
                  {errors.length > 0 && (
                    <div className="space-y-1">
                      <Label className="text-red-500">Errors:</Label>
                      <div className="flex flex-wrap gap-1">
                        {errors.map((error, index) => (
                          <Badge
                            key={index}
                            variant="destructive"
                            className="text-xs"
                          >
                            {error}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {warnings.length > 0 && (
                    <div className="space-y-1">
                      <Label className="text-yellow-500">Warnings:</Label>
                      <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                        {warnings.map((warning, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="text-xs border-yellow-500"
                          >
                            {warning}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {output && (
                <div className="text-xs text-muted-foreground">
                  Output: {output.split("\n").length} lines, {output.length}{" "}
                  characters
                </div>
              )}

              {/* Spacer để match với examples section */}
              <div className="h-[140px]"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
