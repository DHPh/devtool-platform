"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowRightLeft, Link } from "lucide-react";
import {
  ToolHeader,
  QuickActions,
  ResultCard,
  CopyableResult,
} from "@/components/layout";
import {
  decodeUrlComponent,
  encodeFullUrl,
  encodeUrlComponent,
} from "@/lib/processors/url";

export const metadata = {
  id: "url-encoder",
  name: "URL Encoder/Decoder",
  description: "Encode and decode URLs and URI components",
  category: "Encoding & Decoding",
  tags: ["url", "encode", "decode", "uri"],
  path: "/tools/url-encoder",
  icon: "🔗",
};

export default function UrlEncoder() {
  const [input, setInput] = useState(
    "https://example.com/search?q=hello world&lang=en"
  );
  const [activeTab, setActiveTab] = useState("converter");

  const encodeUrl = (text: string): string => {
    try {
      return encodeUrlComponent(text);
    } catch {
      return "Invalid input";
    }
  };

  const decodeUrl = (text: string) => {
    try {
      return decodeUrlComponent(text);
    } catch {
      return "Invalid encoded URL";
    }
  };

  const safelyEncodeFullUrl = (text: string) => {
    try {
      return encodeFullUrl(text);
    } catch {
      return "Invalid URL";
    }
  };

  const swapInputOutput = (encoded: string) => {
    setInput(encoded);
  };

  const encoded = encodeUrl(input);
  const decoded = decodeUrl(input);
  const fullUrlEncoded = safelyEncodeFullUrl(input);

  const sampleData = {
    urlWithSpaces: "https://example.com/hello world",
    queryParams: "search?q=cats & dogs",
    specialChars: "path/to/file name & other.txt",
    unicode: "café/résumé.pdf"
  };

  const clearInput = () => {
    setInput("");
  };

  const loadSample = (key: keyof typeof sampleData) => {
    setInput(sampleData[key]);
  };

  const tryExample = (example: string) => {
    setInput(example);
    setActiveTab("converter");
  };

  const examples = [
    {
      name: "URL with Spaces",
      original: "https://example.com/hello world",
      encoded: "https://example.com/hello%20world",
    },
    {
      name: "Query Parameters",
      original: "search?q=cats & dogs", 
      encoded: "search?q=cats%20%26%20dogs",
    },
    {
      name: "Special Characters",
      original: "path/to/file name & other.txt",
      encoded: "path%2Fto%2Ffile%20name%20%26%20other.txt",
    },
    {
      name: "Unicode Characters",
      original: "café/résumé.pdf",
      encoded: "caf%C3%A9%2Fr%C3%A9sum%C3%A9.pdf",
    },
  ];

  return (
    <div className="space-y-6">
      <ToolHeader
        title="URL Encoder/Decoder"
        description="Encode and decode URLs and URI components for safe transmission"
        icon={Link}
      />

      <QuickActions
        actions={[
          {
            id: "url-spaces",
            label: "URL with Spaces",
            onClick: () => loadSample("urlWithSpaces"),
          },
          {
            id: "query-params", 
            label: "Query Parameters",
            onClick: () => loadSample("queryParams"),
          },
          {
            id: "special-chars",
            label: "Special Characters", 
            onClick: () => loadSample("specialChars"),
          },
          {
            id: "unicode",
            label: "Unicode",
            onClick: () => loadSample("unicode"),
          },
          {
            id: "clear",
            label: "Clear",
            onClick: clearInput,
            variant: "outline" as const,
          },
        ]}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="converter">Converter</TabsTrigger>
          <TabsTrigger value="examples">Examples</TabsTrigger>
        </TabsList>

        <TabsContent value="converter" className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="input" className="text-sm font-medium">Input</Label>
              <Textarea
                id="input"
                placeholder="Enter URL or text to encode/decode..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={3}
                className="mt-2"
              />
            </div>

            <div className="grid gap-4">
              {/* URL Component Encoding */}
              <ResultCard
                title="URL Component Encoded (encodeURIComponent)"
                description="Encodes all characters except: A-Z a-z 0-9 - _ . ! ~ * ' ( )"
                status="info"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => swapInputOutput(encoded)}
                    className="h-8"
                  >
                    <ArrowRightLeft className="h-4 w-4 mr-1" />
                    Use as Input
                  </Button>
                </div>
                <CopyableResult
                  value={encoded}
                  fontFamily="mono"
                  rows={2}
                />
              </ResultCard>

              {/* URL Decoded */}
              <ResultCard
                title="URL Decoded (decodeURIComponent)"
                description="Decodes percent-encoded characters back to their original form"
                status="info"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => swapInputOutput(decoded)}
                    className="h-8"
                  >
                    <ArrowRightLeft className="h-4 w-4 mr-1" />
                    Use as Input
                  </Button>
                </div>
                <CopyableResult
                  value={decoded}
                  fontFamily="mono"
                  rows={2}
                />
              </ResultCard>

              {/* Full URL Encoding */}
              <ResultCard
                title="Full URL Encoded (encodeURI)"
                description="Preserves URL structure, only encodes characters that are not valid in URLs"
                status="info"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => swapInputOutput(fullUrlEncoded)}
                    className="h-8"
                  >
                    <ArrowRightLeft className="h-4 w-4 mr-1" />
                    Use as Input
                  </Button>
                </div>
                <CopyableResult
                  value={fullUrlEncoded}
                  fontFamily="mono"
                  rows={2}
                />
              </ResultCard>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="examples" className="space-y-4">
          <div className="grid gap-4">
            {examples.map((example, index) => (
              <ResultCard
                key={index}
                title={example.name}
                status="info"
              >
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium">Original:</Label>
                    <CopyableResult
                      value={example.original}
                      fontFamily="mono"
                      rows={1}
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Encoded:</Label>
                    <CopyableResult
                      value={example.encoded}
                      fontFamily="mono"
                      rows={1}
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => tryExample(example.original)}
                  >
                    Try This Example
                  </Button>
                </div>
              </ResultCard>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
