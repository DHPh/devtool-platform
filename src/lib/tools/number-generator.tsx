"use client";

import { useMemo, useState } from "react";
import { writeClipboardText } from "@/hooks/use-clipboard";
import { Copy, Dices } from "lucide-react";
import { toast } from "sonner";
import {
  QuickActions,
  ResultCard,
  CopyableResult,
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
import {
  calculateNumberStats,
  formatGeneratedNumber,
  generateNumberBatch,
  type NumberOutputFormat,
} from "@/lib/processors/random-generators";

export default function NumberGenerator() {
  const [generatedNumbers, setGeneratedNumbers] = useState<number[]>([]);
  const [min, setMin] = useState(1);
  const [max, setMax] = useState(100);
  const [count, setCount] = useState(10);
  const [allowDuplicates, setAllowDuplicates] = useState(true);
  const [decimalPlaces, setDecimalPlaces] = useState(0);
  const [format, setFormat] = useState<NumberOutputFormat>("decimal");

  const runGeneration = (overrides?: {
    min?: number;
    max?: number;
    count?: number;
  }) => {
    const result = generateNumberBatch({
      min: overrides?.min ?? min,
      max: overrides?.max ?? max,
      count: overrides?.count ?? count,
      allowDuplicates,
      decimalPlaces,
    });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setGeneratedNumbers(result.value);
    toast.success(`Generated ${result.value.length} random numbers!`);
  };

  const generateNumbers = () => {
    runGeneration();
  };

  const generateQuickRange = (
    newMin: number,
    newMax: number,
    newCount?: number,
  ) => {
    setMin(newMin);
    setMax(newMax);
    if (newCount !== undefined) setCount(newCount);
    runGeneration({
      min: newMin,
      max: newMax,
      count: newCount ?? count,
    });
  };

  const copyNumbers = async () => {
    const formattedNumbers = generatedNumbers.map((num) =>
      formatGeneratedNumber(num, format),
    );
    try {
      await writeClipboardText(formattedNumbers.join("\n"));
      toast.success("Numbers copied to clipboard!");
    } catch {
      // Error toast is already surfaced by writeClipboardText
    }
  };

  const copyNumber = async (number: number) => {
    const formatted = formatGeneratedNumber(number, format);
    try {
      await writeClipboardText(formatted);
      toast.success(`${formatted} copied to clipboard!`);
    } catch {
      // Error toast is already surfaced by writeClipboardText
    }
  };

  const clearAll = () => {
    setGeneratedNumbers([]);
  };

  const downloadNumbers = () => {
    const formattedNumbers = generatedNumbers.map((num) =>
      formatGeneratedNumber(num, format),
    );
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

  const stats = useMemo(
    () => calculateNumberStats(generatedNumbers, decimalPlaces),
    [generatedNumbers, decimalPlaces],
  );

  return (
    <div className="space-y-6">
      <QuickActions
        actions={[
          {
            id: "generate",
            label: "Generate Numbers",
            onClick: generateNumbers,
            variant: "default" as const,
          },
          {
            id: "dice",
            label: "Roll Dice (1-6)",
            onClick: () => generateQuickRange(1, 6, 6),
            variant: "outline" as const,
          },
          {
            id: "lottery",
            label: "Lottery (1-49)",
            onClick: () => generateQuickRange(1, 49, 6),
            variant: "outline" as const,
          },
          {
            id: "percentage",
            label: "Percentage (0-100)",
            onClick: () => generateQuickRange(0, 100, 5),
            variant: "outline" as const,
          },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                    onChange={(e) => {
                      const parsed = parseFloat(e.target.value);
                      setMin(Number.isNaN(parsed) ? 0 : parsed);
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="max">Maximum</Label>
                  <Input
                    id="max"
                    type="number"
                    value={max}
                    onChange={(e) => {
                      const parsed = parseFloat(e.target.value);
                      setMax(Number.isNaN(parsed) ? 100 : parsed);
                    }}
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
                  onChange={(e) =>
                    setCount(
                      Math.max(
                        1,
                        Math.min(1000, parseInt(e.target.value, 10) || 1),
                      ),
                    )
                  }
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
                  onChange={(e) =>
                    setDecimalPlaces(
                      Math.max(
                        0,
                        Math.min(10, parseInt(e.target.value, 10) || 0),
                      ),
                    )
                  }
                />
              </div>

              <div>
                <Label htmlFor="format">Number Format</Label>
                <Select
                  value={format}
                  onValueChange={(value) =>
                    setFormat(value as NumberOutputFormat)
                  }
                >
                  <SelectTrigger id="format" aria-label="Number format">
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

              <Button onClick={generateNumbers} className="w-full">
                <Dices className="h-4 w-4 mr-2" />
                Generate Numbers
              </Button>
            </div>
          </ResultCard>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <ResultCard
            title="Generated Numbers"
            description={`${generatedNumbers.length} numbers generated`}
            status={generatedNumbers.length > 0 ? "success" : "info"}
          >
            {generatedNumbers.length > 0 ? (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2 mb-4">
                  <Button size="sm" onClick={() => void copyNumbers()}>
                    Copy All
                  </Button>
                  <Button size="sm" variant="outline" onClick={downloadNumbers}>
                    Download
                  </Button>
                  <Button size="sm" variant="outline" onClick={generateNumbers}>
                    Regenerate
                  </Button>
                  <Button size="sm" variant="outline" onClick={clearAll}>
                    Clear
                  </Button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 max-h-80 overflow-y-auto">
                  {generatedNumbers.map((number, index) => {
                    const formatted = formatGeneratedNumber(number, format);
                    return (
                      <button
                        type="button"
                        key={`${number}-${index}`}
                        className="flex items-center justify-center gap-2 rounded bg-muted p-2 text-center font-mono text-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        onClick={() => void copyNumber(number)}
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
    </div>
  );
}
