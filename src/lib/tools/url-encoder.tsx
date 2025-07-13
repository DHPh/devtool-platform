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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, ArrowRightLeft } from "lucide-react";
import { toast } from "sonner";

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

  const encodeUrl = (text: string) => {
    try {
      return encodeURIComponent(text);
    } catch {
      return "Invalid input";
    }
  };

  const decodeUrl = (text: string) => {
    try {
      return decodeURIComponent(text);
    } catch {
      return "Invalid encoded URL";
    }
  };

  const encodeFullUrl = (text: string) => {
    try {
      return encodeURI(text);
    } catch {
      return "Invalid URL";
    }
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${type} copied to clipboard!`);
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  const swapInputOutput = (encoded: string) => {
    setInput(encoded);
  };

  const encoded = encodeUrl(input);
  const decoded = decodeUrl(input);
  const fullUrlEncoded = encodeFullUrl(input);

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
      <Card>
        <CardHeader>
          <CardTitle>URL Encoder/Decoder</CardTitle>
          <CardDescription>
            Encode and decode URLs and URI components for safe transmission
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="converter" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="converter">Converter</TabsTrigger>
              <TabsTrigger value="examples">Examples</TabsTrigger>
            </TabsList>

            <TabsContent value="converter" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="input">Input</Label>
                <Textarea
                  id="input"
                  placeholder="Enter URL or text to encode/decode..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="grid gap-4">
                {/* URL Component Encoding */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        URL Component Encoded (encodeURIComponent)
                      </CardTitle>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => swapInputOutput(encoded)}
                          className="h-8 w-8 p-0"
                        >
                          <ArrowRightLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            copyToClipboard(encoded, "Encoded URL")
                          }
                          className="h-8 w-8 p-0"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="p-3 bg-muted rounded-md">
                      <code className="text-sm break-all">{encoded}</code>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      Encodes all characters except: A-Z a-z 0-9 - _ . ! ~ *
                      &apos; ( )
                    </p>
                  </CardContent>
                </Card>

                {/* URL Decoded */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        URL Decoded (decodeURIComponent)
                      </CardTitle>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => swapInputOutput(decoded)}
                          className="h-8 w-8 p-0"
                        >
                          <ArrowRightLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            copyToClipboard(decoded, "Decoded URL")
                          }
                          className="h-8 w-8 p-0"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="p-3 bg-muted rounded-md">
                      <code className="text-sm break-all">{decoded}</code>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      Decodes percent-encoded characters back to their original
                      form
                    </p>
                  </CardContent>
                </Card>

                {/* Full URL Encoding */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        Full URL Encoded (encodeURI)
                      </CardTitle>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => swapInputOutput(fullUrlEncoded)}
                          className="h-8 w-8 p-0"
                        >
                          <ArrowRightLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            copyToClipboard(fullUrlEncoded, "Full URL Encoded")
                          }
                          className="h-8 w-8 p-0"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="p-3 bg-muted rounded-md">
                      <code className="text-sm break-all">
                        {fullUrlEncoded}
                      </code>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      Preserves URL structure, only encodes characters that are
                      not valid in URLs
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="examples" className="space-y-4">
              <div className="grid gap-4">
                {examples.map((example, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle className="text-lg">{example.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium">Original:</Label>
                        <div className="p-2 bg-muted rounded-md mt-1">
                          <code className="text-sm break-all">
                            {example.original}
                          </code>
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Encoded:</Label>
                        <div className="p-2 bg-muted rounded-md mt-1">
                          <code className="text-sm break-all">
                            {example.encoded}
                          </code>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setInput(example.original)}
                      >
                        Try This Example
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
