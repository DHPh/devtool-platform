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
  const [minInput, setMinInput] = useState("1");
  const [maxInput, setMaxInput] = useState("100");
  const [countInput, setCountInput] = useState("10");
  const [allowDuplicates, setAllowDuplicates] = useState(true);
  const [decimalInput, setDecimalInput] = useState("0");
  const [format, setFormat] = useState<NumberOutputFormat>("decimal");

  const parsedDecimalPlaces = (() => {
    const parsed = parseInt(decimalInput, 10);
    return Number.isNaN(parsed) ? 0 : Math.max(0, Math.min(10, parsed));
  })();

  const effectiveFormat: NumberOutputFormat =
    parsedDecimalPlaces > 0 ? "decimal" : format;

  const formatForDisplay = (num: number) =>
    effectiveFormat === "decimal" && parsedDecimalPlaces > 0
      ? num.toFixed(parsedDecimalPlaces)
      : formatGeneratedNumber(num, effectiveFormat);

  const runGeneration = (overrides?: {
    min?: number;
    max?: number;
    count?: number;
    allowDuplicates?: boolean;
    decimalPlaces?: number;
  }) => {
    const resolvedMin = overrides?.min ?? Number(minInput);
    const resolvedMax = overrides?.max ?? Number(maxInput);
    const resolvedCount = overrides?.count ?? parseInt(countInput, 10);
    const resolvedDecimals =
      overrides?.decimalPlaces ?? parsedDecimalPlaces;
    const resolvedDuplicates = overrides?.allowDuplicates ?? allowDuplicates;

    if (
      !Number.isFinite(resolvedMin) ||
      !Number.isFinite(resolvedMax) ||
      minInput.trim() === "" ||
      maxInput.trim() === ""
    ) {
      toast.error("Please enter valid minimum and maximum numbers");
      return;
    }
    if (!Number.isInteger(resolvedCount) || resolvedCount < 1 || resolvedCount > 1000) {
      toast.error("Count must be an integer between 1 and 1000");
      return;
    }

    const result = generateNumberBatch({
      min: resolvedMin,
      max: resolvedMax,
      count: resolvedCount,
      allowDuplicates: resolvedDuplicates,
      decimalPlaces: resolvedDecimals,
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
    newCount: number,
    options?: { allowDuplicates?: boolean; decimalPlaces?: number },
  ) => {
    setMinInput(String(newMin));
    setMaxInput(String(newMax));
    setCountInput(String(newCount));
    if (options?.allowDuplicates !== undefined) {
      setAllowDuplicates(options.allowDuplicates);
    }
    if (options?.decimalPlaces !== undefined) {
      setDecimalInput(String(options.decimalPlaces));
    }
    runGeneration({
      min: newMin,
      max: newMax,
      count: newCount,
      allowDuplicates: options?.allowDuplicates ?? allowDuplicates,
      decimalPlaces: options?.decimalPlaces ?? parsedDecimalPlaces,
    });
  };

  const copyNumbers = async () => {
    const formattedNumbers = generatedNumbers.map((num) => formatForDisplay(num));
    try {
      await writeClipboardText(formattedNumbers.join("\n"));
      toast.success("Numbers copied to clipboard!");
    } catch {
      // Error toast is already surfaced by writeClipboardText
    }
  };

  const copyNumber = async (number: number) => {
    const formatted = formatForDisplay(number);
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
    const formattedNumbers = generatedNumbers.map((num) => formatForDisplay(num));
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
    () => calculateNumberStats(generatedNumbers, parsedDecimalPlaces),
    [generatedNumbers, parsedDecimalPlaces],
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
            onClick: () =>
              generateQuickRange(1, 6, 6, { allowDuplicates: true, decimalPlaces: 0 }),
            variant: "outline" as const,
          },
          {
            id: "lottery",
            label: "Lottery (1-49)",
            onClick: () =>
              generateQuickRange(1, 49, 6, { allowDuplicates: false, decimalPlaces: 0 }),
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
                    step="any"
                    value={minInput}
                    onChange={(e) => setMinInput(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="max">Maximum</Label>
                  <Input
                    id="max"
                    type="number"
                    step="any"
                    value={maxInput}
                    onChange={(e) => setMaxInput(e.target.value)}
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
                  value={countInput}
                  onChange={(e) => setCountInput(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="decimal-places">Decimal Places</Label>
                <Input
                  id="decimal-places"
                  type="number"
                  min="0"
                  max="10"
                  value={decimalInput}
                  onChange={(e) => setDecimalInput(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="format">Number Format</Label>
                <Select
                  value={effectiveFormat}
                  onValueChange={(value) =>
                    setFormat(value as NumberOutputFormat)
                  }
                  disabled={parsedDecimalPlaces > 0}
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
                {parsedDecimalPlaces > 0 && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Binary, Hex, and Octal output require 0 decimal places.
                  </p>
                )}
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
                    const formatted = formatForDisplay(number);
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
