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

  const htmlEntities: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
    " ": "&nbsp;",
    "©": "&copy;",
    "®": "&reg;",
    "™": "&trade;",
    "€": "&euro;",
    "£": "&pound;",
    "¥": "&yen;",
    "§": "&sect;",
    "¶": "&para;",
  };

  const reverseEntities = Object.fromEntries(
    Object.entries(htmlEntities).map(([key, value]) => [value, key])
  );

  const encodeHtml = (text: string) => {
    return text.replace(/[&<>"']/g, (match) => htmlEntities[match] || match);
  };

  const decodeHtml = (text: string) => {
    return text.replace(/&[#\w]+;/g, (entity) => {
      if (reverseEntities[entity]) {
        return reverseEntities[entity];
      }

      // Handle numeric entities
      if (entity.startsWith("&#")) {
        const num = entity.slice(2, -1);
        const code = num.startsWith("x")
          ? parseInt(num.slice(1), 16)
          : parseInt(num, 10);
        return String.fromCharCode(code);
      }

      return entity;
    });
  };

  const encoded = encodeHtml(input);
  const decoded = decodeHtml(input);

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${type} copied to clipboard!`);
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  const swapInputOutput = (text: string) => {
    setInput(text);
  };

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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>HTML Entities Encoder/Decoder</CardTitle>
          <CardDescription>
            Convert special characters to HTML entities and vice versa
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="converter" className="w-full">
            <TabsList className="w-full flex flex-row">
              <TabsTrigger value="converter">Converter</TabsTrigger>
              <TabsTrigger value="examples">Examples</TabsTrigger>
            </TabsList>

            <TabsContent value="converter" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="input">Input</Label>
                <Textarea
                  id="input"
                  placeholder="Enter text or HTML..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="grid gap-4">
                {/* HTML Encoded */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">HTML Encoded</CardTitle>
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
                            copyToClipboard(encoded, "Encoded text")
                          }
                          className="h-8 w-8 p-0"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="max-h-40 overflow-auto">
                      <div className="p-3 bg-muted rounded-md">
                        <code className="text-sm break-all">{encoded}</code>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* HTML Decoded */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">HTML Decoded</CardTitle>
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
                            copyToClipboard(decoded, "Decoded text")
                          }
                          className="h-8 w-8 p-0"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="max-h-40 overflow-auto">
                      <div className="p-3 bg-muted rounded-md">
                        <code className="text-sm break-all">{decoded}</code>
                      </div>
                    </div>
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
                        <div className="p-2 bg-muted rounded-md mt-1 max-h-20 overflow-auto">
                          <code className="text-sm break-all">
                            {example.original}
                          </code>
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Encoded:</Label>
                        <div className="p-2 bg-muted rounded-md mt-1 max-h-20 overflow-auto">
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
