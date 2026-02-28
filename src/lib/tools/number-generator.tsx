"use client";

import { useState } from "react";
import { Copy, Hash, Dices } from "lucide-react";
import { toast } from "sonner";
import {
  ToolHeader,
  QuickActions,
  ResultCard,
  CopyableResult,
  StatusIndicator,
} from "@/components/layout";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

export const metadata = {
  id: "number-generator",
  name: "Number Generator",
  description: "Generate random numbers with various options and formats",
  category: "Generators",
  tags: ["number", "generator", "random", "range", "sequence"],
  path: "/tools/number-generator",
  icon: "🔢",
};

export default function NumberGenerator() {
  const [generatedNumbers, setGeneratedNumbers] = useState<number[]>([]);
  const [min, setMin] = useState(1);
  const [max, setMax] = useState(100);
  const [count, setCount] = useState(10);
  const [allowDuplicates, setAllowDuplicates] = useState(true);
  const [decimalPlaces, setDecimalPlaces] = useState(0);
  const [format, setFormat] = useState<"decimal" | "binary" | "hex" | "octal">("decimal");
  const [isGenerating, setIsGenerating] = useState(false);

  const generateNumbers = async () => {
    setIsGenerating(true);
    
    const numbers: number[] = [];
    const usedNumbers = new Set<number>();
    
    for (let i = 0; i < count; i++) {
      let number: number;
      let attempts = 0;
      const maxAttempts = 1000;
      
      do {
        if (decimalPlaces > 0) {
          const range = max - min;
          const random = Math.random() * range + min;
          number = parseFloat(random.toFixed(decimalPlaces));
        } else {
          number = Math.floor(Math.random() * (max - min + 1)) + min;
        }
        attempts++;
      } while (!allowDuplicates && usedNumbers.has(number) && attempts < maxAttempts);
      
      if (attempts >= maxAttempts && !allowDuplicates) {
        toast.error("Cannot generate unique numbers within the given range");
        break;
      }
      
      numbers.push(number);
      if (!allowDuplicates) {
        usedNumbers.add(number);
      }
    }
    
    setGeneratedNumbers(numbers);
    setIsGenerating(false);
    toast.success(`Generated ${numbers.length} random numbers!`);
  };

  const formatNumber = (num: number): string => {
    switch (format) {
      case "binary":
        return `0b${Math.floor(num).toString(2)}`;
      case "hex":
        return `0x${Math.floor(num).toString(16).toUpperCase()}`;
      case "octal":
        return `0o${Math.floor(num).toString(8)}`;
      default:
        return num.toString();
    }
  };

  const copyNumbers = async () => {
    const formattedNumbers = generatedNumbers.map(formatNumber);
    const numbersText = formattedNumbers.join("\n");
    await navigator.clipboard.writeText(numbersText);
    toast.success("Numbers copied to clipboard!");
  };

  const copyNumber = async (number: number) => {
    const formatted = formatNumber(number);
    try {
      await navigator.clipboard.writeText(formatted);
      toast.success(`${formatted} copied to clipboard!`);
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  const generateQuickRange = (newMin: number, newMax: number, newCount?: number) => {
    setMin(newMin);
    setMax(newMax);
    if (newCount) setCount(newCount);
    setTimeout(() => generateNumbers(), 100);
  };

  const regenerate = () => {
    generateNumbers();
  };

  const clearAll = () => {
    setGeneratedNumbers([]);
  };

  const downloadNumbers = () => {
    const formattedNumbers = generatedNumbers.map(formatNumber);
    const content = formattedNumbers.join("\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "random-numbers.txt";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Numbers downloaded!");
  };

  const getStats = () => {
    if (generatedNumbers.length === 0) return null;
    
    const sum = generatedNumbers.reduce((a, b) => a + b, 0);
    const avg = sum / generatedNumbers.length;
    const sortedNumbers = [...generatedNumbers].sort((a, b) => a - b);
    const median = sortedNumbers.length % 2 === 0
      ? (sortedNumbers[sortedNumbers.length / 2 - 1] + sortedNumbers[sortedNumbers.length / 2]) / 2
      : sortedNumbers[Math.floor(sortedNumbers.length / 2)];
    
    return {
      count: generatedNumbers.length,
      sum: sum.toFixed(decimalPlaces),
      average: avg.toFixed(decimalPlaces),
      median: median.toFixed(decimalPlaces),
      min: Math.min(...generatedNumbers).toFixed(decimalPlaces),
      max: Math.max(...generatedNumbers).toFixed(decimalPlaces),
    };
  };

  const stats = getStats();

  return (
    <div className="space-y-6">
      <ToolHeader
        title="Number Generator"
        description="Generate random numbers with various options and formats"
        icon={Hash}
      />

      <QuickActions
        actions={[
          {
            id: "generate",
            label: isGenerating ? "Generating..." : "Generate Numbers",
            onClick: generateNumbers,
            disabled: isGenerating,
            variant: "default" as const,
          },
          {
            id: "dice",
            label: "Roll Dice (1-6)",
            onClick: () => generateQuickRange(1, 6, 6),
            disabled: isGenerating,
            variant: "outline" as const,
          },
          {
            id: "lottery",
            label: "Lottery (1-49)",
            onClick: () => generateQuickRange(1, 49, 6),
            disabled: isGenerating,
            variant: "outline" as const,
          },
          {
            id: "percentage",
            label: "Percentage (0-100)",
            onClick: () => generateQuickRange(0, 100, 5),
            disabled: isGenerating,
            variant: "outline" as const,
          },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings */}
        <div className="space-y-4">
          <ResultCard
            title="Generator Settings"
            description="Configure number generation options"
            status="info"
          >
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="min">Minimum</Label>
                  <Input
                    id="min"
                    type="number"
                    value={min}
                    onChange={(e) => setMin(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label htmlFor="max">Maximum</Label>
                  <Input
                    id="max"
                    type="number"
                    value={max}
                    onChange={(e) => setMax(parseFloat(e.target.value) || 100)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="count">Count</Label>
                <Input
                  id="count"
                  type="number"
                  min="1"
                  max="1000"
                  value={count}
                  onChange={(e) => setCount(Math.max(1, Math.min(1000, parseInt(e.target.value) || 1)))}
                />
              </div>

              <div>
                <Label htmlFor="decimal-places">Decimal Places</Label>
                <Input
                  id="decimal-places"
                  type="number"
                  min="0"
                  max="10"
                  value={decimalPlaces}
                  onChange={(e) => setDecimalPlaces(Math.max(0, Math.min(10, parseInt(e.target.value) || 0)))}
                />
              </div>

              <div>
                <Label htmlFor="format">Number Format</Label>
                <Select value={format} onValueChange={(value) => setFormat(value as typeof format)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="decimal">Decimal</SelectItem>
                    <SelectItem value="binary">Binary</SelectItem>
                    <SelectItem value="hex">Hexadecimal</SelectItem>
                    <SelectItem value="octal">Octal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="allow-duplicates"
                  checked={allowDuplicates}
                  onCheckedChange={setAllowDuplicates}
                />
                <Label htmlFor="allow-duplicates">Allow Duplicates</Label>
              </div>

              <Button onClick={generateNumbers} disabled={isGenerating} className="w-full">
                <Dices className="h-4 w-4 mr-2" />
                {isGenerating ? "Generating..." : "Generate Numbers"}
              </Button>
            </div>
          </ResultCard>
        </div>

        {/* Results */}
        <div className="lg:col-span-2 space-y-4">
          <ResultCard
            title="Generated Numbers"
            description={`${generatedNumbers.length} numbers generated`}
            status={generatedNumbers.length > 0 ? "success" : "info"}
          >
            {isGenerating ? (
              <div className="flex items-center justify-center p-8">
                <StatusIndicator status="loading" message="Generating numbers..." />
              </div>
            ) : generatedNumbers.length > 0 ? (
              <div className="space-y-4">
                <div className="flex gap-2 mb-4">
                  <Button size="sm" onClick={copyNumbers}>
                    Copy All
                  </Button>
                  <Button size="sm" variant="outline" onClick={downloadNumbers}>
                    Download
                  </Button>
                  <Button size="sm" variant="outline" onClick={regenerate}>
                    Regenerate
                  </Button>
                  <Button size="sm" variant="outline" onClick={clearAll}>
                    Clear
                  </Button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 max-h-80 overflow-y-auto">
                  {generatedNumbers.map((number, index) => {
                    const formatted = formatNumber(number);
                    return (
                    <button
                      type="button"
                      key={index}
                      className="flex items-center justify-center gap-2 rounded bg-muted p-2 text-center font-mono text-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      onClick={() => copyNumber(number)}
                      aria-label={`Copy ${formatted}`}
                    >
                      <span>{formatted}</span>
                      <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <CopyableResult
                value=""
                placeholder="Generated numbers will appear here..."
                rows={8}
              />
            )}
          </ResultCard>

          {/* Statistics */}
          {stats && (
            <ResultCard
              title="Statistics"
              description="Statistical analysis of generated numbers"
              status="info"
            >
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="font-medium">Count</p>
                  <p className="text-muted-foreground">{stats.count}</p>
                </div>
                <div>
                  <p className="font-medium">Sum</p>
                  <p className="text-muted-foreground">{stats.sum}</p>
                </div>
                <div>
                  <p className="font-medium">Average</p>
                  <p className="text-muted-foreground">{stats.average}</p>
                </div>
                <div>
                  <p className="font-medium">Median</p>
                  <p className="text-muted-foreground">{stats.median}</p>
                </div>
                <div>
                  <p className="font-medium">Min</p>
                  <p className="text-muted-foreground">{stats.min}</p>
                </div>
                <div>
                  <p className="font-medium">Max</p>
                  <p className="text-muted-foreground">{stats.max}</p>
                </div>
              </div>
            </ResultCard>
          )}
        </div>
      </div>

      {/* Information */}
      <ResultCard
        title="About Number Generation"
        status="info"
        description="Learn about different number formats and use cases"
      >
        <div className="space-y-4 text-sm text-muted-foreground">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="font-medium mb-2">Number Formats</p>
              <ul className="list-disc pl-4 space-y-1">
                <li><strong>Decimal:</strong> Standard base-10 numbers</li>
                <li><strong>Binary:</strong> Base-2 numbers (0b prefix)</li>
                <li><strong>Hexadecimal:</strong> Base-16 numbers (0x prefix)</li>
                <li><strong>Octal:</strong> Base-8 numbers (0o prefix)</li>
              </ul>
            </div>
            <div>
              <p className="font-medium mb-2">Use Cases</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Testing and simulation data</li>
                <li>Gaming and random events</li>
                <li>Statistical sampling</li>
                <li>Password and ID generation</li>
              </ul>
            </div>
          </div>
          <p className="text-xs bg-muted p-2 rounded">
            <strong>Note:</strong> Numbers are generated using JavaScript&apos;s Math.random() function, which is suitable for most use cases but not cryptographically secure.
          </p>
        </div>
      </ResultCard>
    </div>
  );
}
