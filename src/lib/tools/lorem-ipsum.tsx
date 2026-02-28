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
import {
  ToolHeader,
  QuickActions,
  ResultCard,
  CopyableResult,
} from "@/components/layout";
import {
  generateLoremIpsum,
  type LoremIpsumUnit,
} from "@/lib/processors/lorem";

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
  const [type, setType] = useState<LoremIpsumUnit>("paragraphs");
  const [startWithLorem, setStartWithLorem] = useState(true);
  const [generated, setGenerated] = useState("");

  const generateLorem = () => {
    setGenerated(generateLoremIpsum({ count, unit: type, startWithLorem }));
  };

  const presets: Array<{ name: string; type: LoremIpsumUnit; count: number }> = [
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
              <Select
                value={type}
                onValueChange={(value: LoremIpsumUnit) => setType(value)}
              >
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
