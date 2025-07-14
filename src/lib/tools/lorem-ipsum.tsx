"use client";

import { useState } from "react";
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
import { RefreshCw, FileText } from "lucide-react";
import { toast } from "sonner";
import {
  ToolHeader,
  QuickActions,
  ResultCard,
  CopyableResult,
} from "@/components/layout";

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
      <ToolHeader
        title="Lorem Ipsum Generator"
        description="Generate placeholder text for your designs and mockups"
        icon={FileText}
      />

      <QuickActions
        actions={presets.map((preset) => ({
          id: preset.name.toLowerCase().replace(/\s+/g, "-"),
          label: preset.name,
          onClick: () => {
            setCount(preset.count);
            setType(preset.type);
          },
        }))}
      />

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Settings Section */}
        <div className="space-y-4">
          <ResultCard
            title="Generator Settings"
            description="Configure your lorem ipsum generation options"
            status="info"
          >
            <div className="space-y-4">
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
          </ResultCard>
        </div>

        {/* Output Section */}
        <div>
          <ResultCard
            title="Generated Text"
            description="Your generated lorem ipsum text"
            status={generated ? "success" : "info"}
            onCopy={generated ? () => copyToClipboard() : undefined}
            copyLabel="Copy Text"
          >
            <CopyableResult
              value={generated}
              placeholder="Generated lorem ipsum will appear here..."
              fontFamily="mono"
              rows={12}
            />
            {generated && (
              <div className="text-xs text-muted-foreground mt-2">
                Generated: {generated.split(" ").length} words,{" "}
                {generated.split(".").length - 1} sentences
              </div>
            )}
          </ResultCard>
        </div>
      </div>
    </div>
  );
}
