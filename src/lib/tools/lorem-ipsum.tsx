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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Copy, RefreshCw } from "lucide-react";
import { TwoColumnToolLayout } from "@/components/layout";
import { toast } from "sonner";

export const metadata = {
  id: "lorem-ipsum",
  name: "Lorem Ipsum Generator",
  description: "Generate placeholder text in various formats",
  category: "Generators",
  tags: ["lorem", "ipsum", "placeholder", "text"],
  path: "/tools/lorem-ipsum",
  icon: "📃",
};

export default function LoremIpsum() {
  const [count, setCount] = useState(3);
  const [type, setType] = useState("paragraphs");
  const [startWithLorem, setStartWithLorem] = useState(true);
  const [generated, setGenerated] = useState("");

  const loremWords = [
    "lorem",
    "ipsum",
    "dolor",
    "sit",
    "amet",
    "consectetur",
    "adipiscing",
    "elit",
    "sed",
    "do",
    "eiusmod",
    "tempor",
    "incididunt",
    "ut",
    "labore",
    "et",
    "dolore",
    "magna",
    "aliqua",
    "enim",
    "ad",
    "minim",
    "veniam",
    "quis",
    "nostrud",
    "exercitation",
    "ullamco",
    "laboris",
    "nisi",
    "aliquip",
    "ex",
    "ea",
    "commodo",
    "consequat",
    "duis",
    "aute",
    "irure",
    "in",
    "reprehenderit",
    "voluptate",
    "velit",
    "esse",
    "cillum",
    "fugiat",
    "nulla",
    "pariatur",
    "excepteur",
    "sint",
    "occaecat",
    "cupidatat",
    "non",
    "proident",
    "sunt",
    "culpa",
    "qui",
    "officia",
    "deserunt",
    "mollit",
    "anim",
    "id",
    "est",
    "laborum",
    "at",
    "vero",
    "eos",
    "accusamus",
    "accusantium",
    "doloremque",
    "laudantium",
    "totam",
    "rem",
    "aperiam",
    "eaque",
    "ipsa",
    "quae",
    "ab",
    "illo",
    "inventore",
    "veritatis",
    "et",
    "quasi",
    "architecto",
    "beatae",
    "vitae",
    "dicta",
    "sunt",
    "explicabo",
  ];

  const generateWords = (wordCount: number): string => {
    const words = [];
    for (let i = 0; i < wordCount; i++) {
      words.push(loremWords[Math.floor(Math.random() * loremWords.length)]);
    }
    return words.join(" ");
  };

  const generateSentence = (): string => {
    const length = Math.floor(Math.random() * 10) + 8; // 8-17 words
    const sentence = generateWords(length);
    return sentence.charAt(0).toUpperCase() + sentence.slice(1) + ".";
  };

  const generateParagraph = (): string => {
    const sentenceCount = Math.floor(Math.random() * 5) + 3; // 3-7 sentences
    const sentences = [];
    for (let i = 0; i < sentenceCount; i++) {
      sentences.push(generateSentence());
    }
    return sentences.join(" ");
  };

  const generateLorem = () => {
    let result = "";

    switch (type) {
      case "words":
        if (startWithLorem && count > 2) {
          result = "Lorem ipsum " + generateWords(count - 2);
        } else {
          result = generateWords(count);
        }
        break;

      case "sentences":
        const sentences = [];
        for (let i = 0; i < count; i++) {
          if (i === 0 && startWithLorem) {
            sentences.push(
              "Lorem ipsum dolor sit amet, consectetur adipiscing elit."
            );
          } else {
            sentences.push(generateSentence());
          }
        }
        result = sentences.join(" ");
        break;

      case "paragraphs":
        const paragraphs = [];
        for (let i = 0; i < count; i++) {
          if (i === 0 && startWithLorem) {
            paragraphs.push(
              "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
            );
          } else {
            paragraphs.push(generateParagraph());
          }
        }
        result = paragraphs.join("\n\n");
        break;
    }

    setGenerated(result);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generated);
      toast.success("Lorem ipsum copied to clipboard!");
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  const presets = [
    { name: "1 Paragraph", type: "paragraphs", count: 1 },
    { name: "3 Paragraphs", type: "paragraphs", count: 3 },
    { name: "5 Paragraphs", type: "paragraphs", count: 5 },
    { name: "50 Words", type: "words", count: 50 },
    { name: "100 Words", type: "words", count: 100 },
    { name: "5 Sentences", type: "sentences", count: 5 },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Lorem Ipsum Generator</CardTitle>
          <CardDescription>
            Generate placeholder text for your designs and mockups
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TwoColumnToolLayout
            leftTitle="Generator Settings"
            leftDescription="Configure your lorem ipsum generation options"
            leftChildren={
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Quick Presets</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {presets.map((preset) => (
                      <Button
                        key={preset.name}
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setCount(preset.count);
                          setType(preset.type);
                        }}
                        className="text-xs"
                      >
                        {preset.name}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="count">Count</Label>
                    <Input
                      id="count"
                      type="number"
                      min="1"
                      max="100"
                      value={count}
                      onChange={(e) => setCount(parseInt(e.target.value) || 1)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type">Type</Label>
                    <Select value={type} onValueChange={setType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="words">Words</SelectItem>
                        <SelectItem value="sentences">Sentences</SelectItem>
                        <SelectItem value="paragraphs">Paragraphs</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="startWithLorem"
                    checked={startWithLorem}
                    onChange={(e) => setStartWithLorem(e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="startWithLorem" className="text-sm">
                    Start with &quot;Lorem ipsum...&quot;
                  </Label>
                </div>

                <Button onClick={generateLorem} className="w-full">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Generate Lorem Ipsum
                </Button>
              </div>
            }
            rightTitle="Generated Text"
            rightDescription="Your generated lorem ipsum text"
            rightActions={
              generated
                ? [
                    {
                      label: "Copy",
                      icon: <Copy className="h-4 w-4" />,
                      onClick: copyToClipboard,
                    },
                  ]
                : undefined
            }
            rightChildren={
              <>
                <Textarea
                  value={generated}
                  readOnly
                  placeholder="Generated lorem ipsum will appear here..."
                  rows={12}
                  className="font-mono text-sm max-h-80 overflow-y-auto"
                />
                {generated && (
                  <div className="text-xs text-muted-foreground mt-2">
                    Generated: {generated.split(" ").length} words,{" "}
                    {generated.split(".").length - 1} sentences
                  </div>
                )}
              </>
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
