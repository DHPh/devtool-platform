"use client";

import React, { useState } from "react";
import { copyToClipboard } from "@/hooks/use-clipboard";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { RefreshCw, Copy, Eye, EyeOff, Settings, ShieldCheck } from "lucide-react";
import {
  generatePassphrase,
  generateMultiplePassphrases,
  getDefaultPassphraseOptions,
  getAvailableSeparators,
  PassphraseOptions,
  PassphraseResult,
} from "@/lib/utils/password";

interface PassphraseGeneratorTabProps {
  initialOptions?: PassphraseOptions;
  onAnalyzePassword?: (password: string) => void;
}

export function PassphraseGeneratorTab({
  initialOptions,
  onAnalyzePassword,
}: PassphraseGeneratorTabProps) {
  const [options, setOptions] = useState<PassphraseOptions>(
    initialOptions || getDefaultPassphraseOptions()
  );
  const [currentPassphrase, setCurrentPassphrase] = useState("");
  const [showPassphrase, setShowPassphrase] = useState(true);
  const [generatedPassphrases, setGeneratedPassphrases] = useState<
    PassphraseResult[]
  >([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateCount, setGenerateCount] = useState(1);
  const [errorMessage, setErrorMessage] = useState("");

  const separators = getAvailableSeparators();

  const handleOptionChange = (
    key: keyof PassphraseOptions,
    value: boolean | number | string
  ) => {
    setErrorMessage("");
    setOptions((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleGeneratePassphrase = () => {
    setIsGenerating(true);
    setErrorMessage("");

    try {
      if (generateCount === 1) {
        const result = generatePassphrase(options);
        setCurrentPassphrase(result.passphrase);
        setGeneratedPassphrases((prev) => [result, ...prev.slice(0, 9)]); // Keep last 10
      } else {
        const results = generateMultiplePassphrases(options, generateCount);
        setGeneratedPassphrases((prev) => [...results, ...prev].slice(0, 50)); // Keep last 50

        if (results.length > 0) {
          setCurrentPassphrase(results[0].passphrase);
        }
      }
    } catch (error) {
      const msg =
        error instanceof Error
          ? error.message
          : "Passphrase generation failed";
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyPassphrase = () => {
    if (currentPassphrase) {
      void copyToClipboard(
        currentPassphrase,
        "Passphrase copied to clipboard!",
      );
    }
  };

  const handleClearHistory = () => {
    setGeneratedPassphrases([]);
  };

  return (
    <div className="space-y-6">
      {/* Current Passphrase Display */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Current Passphrase</CardTitle>
          <CardDescription>
            Your generated passphrase using random words
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassphrase">Passphrase</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="currentPassphrase"
                  type={showPassphrase ? "text" : "password"}
                  value={currentPassphrase}
                  readOnly
                  placeholder="Generated passphrase will appear here..."
                  className="font-mono pr-20"
                />
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPassphrase(!showPassphrase)}
                    className="h-6 w-6 p-0"
                    aria-label={showPassphrase ? "Hide generated passphrase" : "Show generated passphrase"}
                  >
                    {showPassphrase ? (
                      <EyeOff className="h-3 w-3" />
                    ) : (
                      <Eye className="h-3 w-3" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyPassphrase}
                    disabled={!currentPassphrase}
                    className="h-6 w-6 p-0"
                    aria-label="Copy generated passphrase"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Generate Controls */}
          <div className="flex sm:items-center items-start sm:flex-row flex-col gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="generateCount" className="text-sm">
                Generate:
              </Label>
              <select
                id="generateCount"
                value={generateCount}
                onChange={(e) => setGenerateCount(parseInt(e.target.value))}
                className="px-3 py-1 border border-input bg-background rounded-md text-sm"
              >
                <option value={1}>1 passphrase</option>
                <option value={5}>5 passphrases</option>
                <option value={10}>10 passphrases</option>
                <option value={25}>25 passphrases</option>
              </select>
            </div>
            <Button
              onClick={handleGeneratePassphrase}
              disabled={isGenerating}
              className="flex items-center gap-2"
            >
              <RefreshCw
                className={`h-4 w-4 ${isGenerating ? "animate-spin" : ""}`}
              />
              Generate
            </Button>
            {onAnalyzePassword && currentPassphrase && (
              <Button
                type="button"
                variant="outline"
                onClick={() => onAnalyzePassword(currentPassphrase)}
                className="flex items-center gap-2"
              >
                <ShieldCheck className="h-4 w-4" />
                Analyze
              </Button>
            )}
          </div>
          {errorMessage && (
            <p role="alert" className="text-xs text-destructive">
              {errorMessage}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Passphrase Options */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            <CardTitle className="text-lg">Passphrase Settings</CardTitle>
          </div>
          <CardDescription>
            Customize your passphrase generation options
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Word Count */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="wordCount">Number of Words</Label>
              <span className="text-sm font-medium bg-muted px-2 py-1 rounded">
                {options.wordCount} words
              </span>
            </div>
            <Slider
              id="wordCount"
              min={2}
              max={8}
              step={1}
              value={[options.wordCount]}
              onValueChange={(value) =>
                handleOptionChange("wordCount", value[0])
              }
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>2</span>
              <span>4</span>
              <span>6</span>
              <span>8</span>
            </div>
          </div>

          {/* Separator */}
          <div className="space-y-2">
            <Label htmlFor="separator">Word Separator</Label>
            <select
              id="separator"
              value={options.separator}
              onChange={(e) => handleOptionChange("separator", e.target.value)}
              className="w-full px-3 py-2 border border-input bg-background rounded-md"
            >
              {separators.map((sep) => (
                <option key={sep} value={sep}>
                  {sep === " " ? "Space" : sep === "" ? "None" : sep}
                </option>
              ))}
            </select>
          </div>

          {/* Word Length Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minWordLength">Min Word Length</Label>
              <Input
                id="minWordLength"
                type="number"
                min={3}
                max={10}
                value={options.minWordLength}
                onChange={(e) => {
                  const parsed = parseInt(e.target.value, 10);
                  if (Number.isNaN(parsed)) return;
                  const nextMin = Math.max(3, Math.min(10, parsed));
                  setErrorMessage("");
                  setOptions((prev) => ({
                    ...prev,
                    minWordLength: nextMin,
                    maxWordLength: Math.max(nextMin, prev.maxWordLength),
                  }));
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxWordLength">Max Word Length</Label>
              <Input
                id="maxWordLength"
                type="number"
                min={3}
                max={10}
                value={options.maxWordLength}
                onChange={(e) => {
                  const parsed = parseInt(e.target.value, 10);
                  if (Number.isNaN(parsed)) return;
                  const nextMax = Math.max(3, Math.min(10, parsed));
                  setErrorMessage("");
                  setOptions((prev) => ({
                    ...prev,
                    minWordLength: Math.min(prev.minWordLength, nextMax),
                    maxWordLength: nextMax,
                  }));
                }}
              />
            </div>
          </div>

          {/* Enhancement Options */}
          <div className="space-y-3">
            <Label>Enhancement Options</Label>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="capitalizeWords"
                  checked={options.capitalizeWords}
                  onChange={(e) =>
                    handleOptionChange("capitalizeWords", e.target.checked)
                  }
                  className="h-4 w-4 rounded border-input accent-primary"
                />
                <Label
                  htmlFor="capitalizeWords"
                  className="text-sm cursor-pointer"
                >
                  Capitalize first letter of each word
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="includeNumbers"
                  checked={options.includeNumbers}
                  onChange={(e) =>
                    handleOptionChange("includeNumbers", e.target.checked)
                  }
                  className="h-4 w-4 rounded border-input accent-primary"
                />
                <Label
                  htmlFor="includeNumbers"
                  className="text-sm cursor-pointer"
                >
                  Add numbers to words (word123)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="includeSymbols"
                  checked={options.includeSymbols}
                  onChange={(e) =>
                    handleOptionChange("includeSymbols", e.target.checked)
                  }
                  className="h-4 w-4 rounded border-input accent-primary"
                />
                <Label
                  htmlFor="includeSymbols"
                  className="text-sm cursor-pointer"
                >
                  Add symbols to words (word!)
                </Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Generated Passphrases History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Passphrase History</CardTitle>
              <CardDescription>
                {generatedPassphrases.length} passphrase
                {generatedPassphrases.length !== 1 ? "s" : ""} generated
              </CardDescription>
            </div>
            {generatedPassphrases.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearHistory}
                className="flex items-center gap-2"
              >
                Clear
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {generatedPassphrases.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <div className="text-4xl mb-2">🔗</div>
              <p>Generate passphrases to see them here</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {generatedPassphrases.map((result, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-sm break-all mb-1">
                      {result.passphrase}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Words: {result.words.join(", ")} • Entropy:{" "}
                      {result.entropy.toFixed(1)} bits • Strength:{" "}
                      {result.strength} • Crack time:{" "}
                      {result.estimatedCrackTime}
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      void copyToClipboard(
                        result.passphrase,
                        "Passphrase copied to clipboard!",
                      )
                    }
                    aria-label={`Copy passphrase history item ${index + 1}`}
                    className="h-8 w-8 p-0 ml-3"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
