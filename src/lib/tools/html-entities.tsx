"use client";

import { useState } from "react";
import { Code, ArrowRightLeft } from "lucide-react";
import { toast } from "sonner";
import {
  ToolHeader,
  QuickActions,
  ResultCard,
  CopyableResult,
  ResponsiveTextArea,
  ModeTabs,
} from "@/components/layout";
import { Button } from "@/components/ui/button";
import { decodeHtmlEntities, encodeHtmlEntities } from "@/lib/processors";

export const metadata = {
  id: "html-entities",
  name: "HTML Entities",
  description: "Encode and decode HTML entities",
  category: "Encoding & Decoding",
  tags: ["html", "entities", "encode", "decode"],
  path: "/tools/html-entities",
  icon: "🏷️",
};

export default function HtmlEntities() {
  const [input, setInput] = useState(
    '<div class="example">Hello & "World"</div>'
  );

  const encoded = encodeHtmlEntities(input);
  const decoded = decodeHtmlEntities(input);

  const examples = [
    {
      name: "Basic HTML",
      original: '<p>Hello & welcome to "our" website</p>',
      encoded:
        "&lt;p&gt;Hello &amp; welcome to &quot;our&quot; website&lt;/p&gt;",
    },
    {
      name: "Special Characters",
      original: "Copyright © 2024, Price: €100",
      encoded: "Copyright &copy; 2024, Price: &euro;100",
    },
    {
      name: "Quotes & Apostrophes", 
      original: `"Hello", he said, 'It's working!'`,
      encoded: "&quot;Hello&quot;, he said, &#39;It&#39;s working!&#39;",
    },
  ];

  const swapInputOutput = (output: string) => {
    setInput(output);
    toast.success("Swapped input and output!");
  };

  const loadExample = (example: string) => {
    setInput(example);
    toast.success("Example loaded!");
  };

  const clearAll = () => {
    setInput("");
  };

  return (
    <div className="space-y-6">
      <ToolHeader
        title="HTML Entities"
        description="Encode and decode HTML entities for special characters"
        icon={Code}
      />

      <QuickActions
        actions={[
          {
            id: "swap",
            label: "Swap",
            onClick: () => swapInputOutput(encoded),
            disabled: !encoded,
            variant: "outline" as const,
          },
          {
            id: "clear",
            label: "Clear All",
            onClick: clearAll,
            variant: "outline" as const,
          },
          ...examples.map((example, index) => ({
            id: `example-${index}`,
            label: example.name,
            onClick: () => loadExample(example.original),
            variant: "outline" as const,
          })),
        ]}
      />

      <ModeTabs
        value="converter"
        onValueChange={() => {}}
        options={[
          {
            value: "converter",
            label: "Converter",
            description: "Convert between text and HTML entities",
          },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Input Text</label>
            <ResponsiveTextArea
              value={input}
              onChange={setInput}
              placeholder="Enter text or HTML..."
              minHeight={200}
              showCharacterCount={true}
            />
          </div>
        </div>

        {/* Output */}
        <div className="space-y-4">
          {/* HTML Encoded */}
          <ResultCard
            title="HTML Encoded"
            description="Special characters converted to HTML entities"
            status={encoded ? "success" : "info"}
          >
            <div className="space-y-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => swapInputOutput(encoded)}
                disabled={!encoded}
                className="mb-2"
              >
                <ArrowRightLeft className="h-4 w-4 mr-2" />
                Use as Input
              </Button>
              <CopyableResult
                value={encoded}
                placeholder="HTML encoded text will appear here..."
                fontFamily="mono"
                rows={6}
              />
            </div>
          </ResultCard>

          {/* HTML Decoded */}
          <ResultCard
            title="HTML Decoded"
            description="HTML entities converted back to special characters"
            status={decoded ? "success" : "info"}
          >
            <div className="space-y-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => swapInputOutput(decoded)}
                disabled={!decoded}
                className="mb-2"
              >
                <ArrowRightLeft className="h-4 w-4 mr-2" />
                Use as Input
              </Button>
              <CopyableResult
                value={decoded}
                placeholder="HTML decoded text will appear here..."
                fontFamily="mono"
                rows={6}
              />
            </div>
          </ResultCard>
        </div>
      </div>

      {/* Examples */}
      <ResultCard
        title="Common HTML Entities"
        status="info"
        description="Examples of frequently used HTML entities"
      >
        <div className="space-y-4">
          {examples.map((example, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium">{example.name}</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadExample(example.original)}
                >
                  Try Example
                </Button>
              </div>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Original:</p>
                  <div className="p-2 bg-muted rounded text-sm font-mono">
                    {example.original}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Encoded:</p>
                  <div className="p-2 bg-muted rounded text-sm font-mono">
                    {example.encoded}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ResultCard>

      {/* Information */}
      <ResultCard
        title="About HTML Entities"
        status="info"
        description="Learn about HTML entities and their usage"
      >
        <div className="space-y-4 text-sm text-muted-foreground">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="font-medium mb-2">Common Entities</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>&amp;lt; = &lt; (less than)</li>
                <li>&amp;gt; = &gt; (greater than)</li>
                <li>&amp;amp; = &amp; (ampersand)</li>
                <li>&amp;quot; = &quot; (quotation mark)</li>
                <li>&amp;copy; = © (copyright)</li>
              </ul>
            </div>
            <div>
              <p className="font-medium mb-2">Use Cases</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Display HTML tags as text</li>
                <li>Prevent XSS attacks</li>
                <li>Email content encoding</li>
                <li>XML/XHTML compliance</li>
              </ul>
            </div>
          </div>
          <p className="text-xs bg-muted p-2 rounded">
            <strong>Note:</strong> Always encode user input when displaying HTML to prevent security vulnerabilities.
          </p>
        </div>
      </ResultCard>
    </div>
  );
}
