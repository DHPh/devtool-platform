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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Copy, Download, FileText, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import {
  ToolContainer,
  ResponsiveTextArea,
  ActionButtons,
  SettingsPanel,
  FormField,
  ModeTabs,
} from "@/components/layout";

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
  const [activeTab, setActiveTab] = useState("input");
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);

  const validateHtml = (html: string) => {
    const newErrors: string[] = [];
    const newWarnings: string[] = [];

    // Basic HTML validation
    const openTags: string[] = [];
    const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^<>]*>/g;
    const voidElements = [
      "area",
      "base",
      "br",
      "col",
      "embed",
      "hr",
      "img",
      "input",
      "link",
      "meta",
      "param",
      "source",
      "track",
      "wbr",
    ];

    let match;
    while ((match = tagRegex.exec(html)) !== null) {
      const fullTag = match[0];
      const tagName = match[1].toLowerCase();

      if (fullTag.startsWith("</")) {
        // Closing tag
        const lastOpenTag = openTags.pop();
        if (!lastOpenTag || lastOpenTag !== tagName) {
          newErrors.push(`Mismatched closing tag: ${fullTag}`);
        }
      } else if (!fullTag.endsWith("/>") && !voidElements.includes(tagName)) {
        // Opening tag (not self-closing and not void)
        openTags.push(tagName);
      }
    }

    // Check for unclosed tags
    openTags.forEach((tag) => {
      newErrors.push(`Unclosed tag: <${tag}>`);
    });

    // Check for common issues
    if (html.includes("<img") && !html.includes("alt=")) {
      newWarnings.push("Images should have alt attributes for accessibility");
    }

    if (html.includes("<a") && html.includes('href="#"')) {
      newWarnings.push('Avoid using href="#" for links');
    }

    setErrors(newErrors);
    setWarnings(newWarnings);
  };

  const formatHtml = () => {
    if (!input.trim()) {
      setOutput("");
      setErrors([]);
      setWarnings([]);
      return;
    }

    try {
      validateHtml(input);

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
        } else if (token.trim()) {
          // Text content
          const trimmedToken = token.trim();
          if (trimmedToken) {
            result.push(trimmedToken);
          }
        }
      }

      let finalResult = result.join("").trim();

      // Clean up extra newlines
      finalResult = finalResult.replace(/\n\s*\n/g, "\n");

      setOutput(finalResult);
      toast.success("HTML formatted successfully!");
    } catch {
      toast.error("Error formatting HTML");
      setOutput("");
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard!");
    } catch {
      toast.error("Failed to copy");
    }
  };

  const downloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("File downloaded!");
  };

  const exampleHtmls = [
    {
      name: "Basic HTML",
      content: `<div><h1>Title</h1><p>This is a paragraph with <strong>bold</strong> and <em>italic</em> text.</p><ul><li>Item 1</li><li>Item 2</li></ul></div>`,
    },
    {
      name: "HTML Form",
      content: `<form><div><label for="name">Name:</label><input type="text" id="name" required></div><div><label for="email">Email:</label><input type="email" id="email" required></div><button type="submit">Submit</button></form>`,
    },
    {
      name: "HTML Table",
      content: `<table><thead><tr><th>Name</th><th>Age</th><th>City</th></tr></thead><tbody><tr><td>John</td><td>30</td><td>New York</td></tr><tr><td>Jane</td><td>25</td><td>London</td></tr></tbody></table>`,
    },
  ];

  const tabOptions = [
    { value: "input", label: "Input" },
    { value: "output", label: "Formatted" },
  ];

  return (
    <ToolContainer
      title="HTML Formatter"
      description="Format and beautify HTML code with proper indentation and validation"
    >
      <ModeTabs
        value={activeTab}
        onValueChange={setActiveTab}
        options={tabOptions}
      />

      {activeTab === "input" ? (
        <Card>
          <CardHeader>
            <CardTitle>HTML Input</CardTitle>
            <CardDescription>
              Enter your HTML code to format and validate
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ResponsiveTextArea
              placeholder="Enter your HTML code here...
Example: <div><p>Hello World</p></div>"
              value={input}
              onChange={setInput}
              minHeight={300}
              showCharacterCount={true}
              showLineCount={true}
            />

            <div className="flex gap-2 flex-wrap">
              {exampleHtmls.map((example, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => setInput(example.content)}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  {example.name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Formatted Output
              <ActionButtons
                buttons={[
                  {
                    icon: Copy,
                    label: "Copy",
                    onClick: () => copyToClipboard(output),
                    disabled: !output,
                  },
                  {
                    icon: Download,
                    label: "Download",
                    onClick: () => downloadFile(output, "formatted.html"),
                    disabled: !output,
                  },
                ]}
              />
            </CardTitle>
            <CardDescription>
              Your formatted and validated HTML code
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveTextArea
              value={output}
              onChange={() => {}} // Read-only
              placeholder="Formatted HTML will appear here..."
              minHeight={300}
              readOnly={true}
              showCharacterCount={true}
              showLineCount={true}
            />

            {/* Validation Results */}
            {(errors.length > 0 || warnings.length > 0) && (
              <div className="mt-4 space-y-2">
                {errors.length > 0 && (
                  <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded">
                    <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-medium mb-2">
                      <AlertTriangle className="h-4 w-4" />
                      Errors Found:
                    </div>
                    <ul className="text-sm space-y-1">
                      {errors.map((error, index) => (
                        <li
                          key={index}
                          className="text-red-600 dark:text-red-400"
                        >
                          • {error}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {warnings.length > 0 && (
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded">
                    <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400 font-medium mb-2">
                      <AlertTriangle className="h-4 w-4" />
                      Warnings:
                    </div>
                    <ul className="text-sm space-y-1">
                      {warnings.map((warning, index) => (
                        <li
                          key={index}
                          className="text-yellow-600 dark:text-yellow-400"
                        >
                          • {warning}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Settings */}
      <SettingsPanel title="Formatting Options">
        <FormField
          label="Indent Size"
          description="Number of spaces or tabs for indentation"
        >
          <Select value={indentSize} onValueChange={setIndentSize}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2">2</SelectItem>
              <SelectItem value="4">4</SelectItem>
              <SelectItem value="6">6</SelectItem>
              <SelectItem value="8">8</SelectItem>
            </SelectContent>
          </Select>
        </FormField>

        <FormField
          label="Indent Type"
          description="Use spaces or tabs for indentation"
        >
          <Select value={indentType} onValueChange={setIndentType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="spaces">Spaces</SelectItem>
              <SelectItem value="tabs">Tabs</SelectItem>
            </SelectContent>
          </Select>
        </FormField>

        <div className="pt-4">
          <Button onClick={formatHtml} className="w-full">
            Format HTML
          </Button>
        </div>
      </SettingsPanel>

      {/* Features */}
      <Card>
        <CardHeader>
          <CardTitle>Features</CardTitle>
          <CardDescription>What this HTML formatter can do</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <h4 className="font-medium text-green-600">✅ Formatting</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Proper indentation</li>
                <li>• Clean whitespace</li>
                <li>• Consistent structure</li>
                <li>• Customizable indent size</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-blue-600">🔍 Validation</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Tag matching</li>
                <li>• Unclosed tag detection</li>
                <li>• Accessibility warnings</li>
                <li>• Best practice suggestions</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </ToolContainer>
  );
}
