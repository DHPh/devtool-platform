"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
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

type ConversionOutcome =
  | { ok: true; value: string }
  | { ok: false; error: string };

export default function UrlEncoder() {
  const [input, setInput] = useState(
    "https://example.com/search?q=hello world&lang=en"
  );
  const [activeTab, setActiveTab] = useState("converter");
  const [plusAsSpace, setPlusAsSpace] = useState(true);

  const encodeUrl = (text: string): ConversionOutcome => {
    try {
      return { ok: true, value: encodeUrlComponent(text) };
    } catch {
      return { ok: false, error: "Invalid input (lone surrogate or malformed UTF-16 sequence)" };
    }
  };

  const decodeUrl = (text: string): ConversionOutcome => {
    try {
      const normalized = plusAsSpace ? text.replace(/\+/g, " ") : text;
      return { ok: true, value: decodeUrlComponent(normalized) };
    } catch {
      return { ok: false, error: "Invalid percent-encoding sequence in input" };
    }
  };

  const safelyEncodeFullUrl = (text: string): ConversionOutcome => {
    try {
      return { ok: true, value: encodeFullUrl(text) };
    } catch {
      return { ok: false, error: "Invalid URL characters (malformed UTF-16 sequence)" };
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
    setActiveTab("converter");
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
              <div className="flex items-center justify-between gap-4">
                <Label htmlFor="input" className="text-sm font-medium">Input</Label>
                <div className="flex items-center gap-2">
                  <Switch
                    id="plus-as-space"
                    checked={plusAsSpace}
                    onCheckedChange={setPlusAsSpace}
                  />
                  <Label htmlFor="plus-as-space" className="text-xs text-muted-foreground cursor-pointer">
                    Treat + as space when decoding
                  </Label>
                </div>
              </div>
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
                status={encoded.ok ? "info" : "error"}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={!encoded.ok}
                    onClick={() => encoded.ok && swapInputOutput(encoded.value)}
                    className="h-8"
                  >
                    <ArrowRightLeft className="h-4 w-4 mr-1" />
                    Use as Input
                  </Button>
                </div>
                {encoded.ok ? (
                  <CopyableResult
                    value={encoded.value}
                    fontFamily="mono"
                    rows={2}
                  />
                ) : (
                  <p role="alert" className="text-sm text-destructive">{encoded.error}</p>
                )}
              </ResultCard>

              {/* URL Decoded */}
              <ResultCard
                title="URL Decoded (decodeURIComponent)"
                description="Decodes percent-encoded characters back to their original form"
                status={decoded.ok ? "info" : "error"}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={!decoded.ok}
                    onClick={() => decoded.ok && swapInputOutput(decoded.value)}
                    className="h-8"
                  >
                    <ArrowRightLeft className="h-4 w-4 mr-1" />
                    Use as Input
                  </Button>
                </div>
                {decoded.ok ? (
                  <CopyableResult
                    value={decoded.value}
                    fontFamily="mono"
                    rows={2}
                  />
                ) : (
                  <p role="alert" className="text-sm text-destructive">{decoded.error}</p>
                )}
              </ResultCard>

              {/* Full URL Encoding */}
              <ResultCard
                title="Full URL Encoded (encodeURI)"
                description="Preserves URL structure, only encodes characters that are not valid in URLs"
                status={fullUrlEncoded.ok ? "info" : "error"}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={!fullUrlEncoded.ok}
                    onClick={() => fullUrlEncoded.ok && swapInputOutput(fullUrlEncoded.value)}
                    className="h-8"
                  >
                    <ArrowRightLeft className="h-4 w-4 mr-1" />
                    Use as Input
                  </Button>
                </div>
                {fullUrlEncoded.ok ? (
                  <CopyableResult
                    value={fullUrlEncoded.value}
                    fontFamily="mono"
                    rows={2}
                  />
                ) : (
                  <p role="alert" className="text-sm text-destructive">{fullUrlEncoded.error}</p>
                )}
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
