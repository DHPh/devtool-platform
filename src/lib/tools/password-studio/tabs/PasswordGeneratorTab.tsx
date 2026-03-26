"use client";

import React, { useState, useMemo } from "react";
import { writeClipboardText } from "@/hooks/use-clipboard";
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
import { RefreshCw, Copy, Eye, EyeOff } from "lucide-react";
import {
  generatePassword,
  generateMultiplePasswords,
  analyzePasswordStrength,
  getDefaultPasswordOptions,
  PasswordOptions,
  PasswordGenerationResult,
} from "@/lib/utils/password";
import {
  PasswordStrengthMeter,
  PasswordGeneratorControls,
  PasswordList,
} from "../components";

interface PasswordGeneratorTabProps {
  initialOptions?: PasswordOptions;
}

export function PasswordGeneratorTab({
  initialOptions,
}: PasswordGeneratorTabProps) {
  const [options, setOptions] = useState<PasswordOptions>(
    initialOptions || getDefaultPasswordOptions()
  );
  const [currentPassword, setCurrentPassword] = useState("");
  const [showPassword, setShowPassword] = useState(true);
  const [generatedPasswords, setGeneratedPasswords] = useState<
    PasswordGenerationResult[]
  >([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateCount, setGenerateCount] = useState(1);

  // Analyze current password strength
  const passwordStrength = useMemo(() => {
    if (!currentPassword) {
      return {
        score: 0,
        level: "Very Weak" as const,
        entropy: 0,
        estimatedCrackTime: "Instant",
        feedback: ["Enter a password to analyze"],
        characteristics: {
          hasUppercase: false,
          hasLowercase: false,
          hasNumbers: false,
          hasSymbols: false,
          hasRepeats: false,
          hasSequential: false,
          hasCommonPatterns: false,
        },
      };
    }
    return analyzePasswordStrength(currentPassword);
  }, [currentPassword]);

  const handleGeneratePassword = () => {
    setIsGenerating(true);

    try {
      // Validate that at least one character type is selected
      if (
        !options.includeUppercase &&
        !options.includeLowercase &&
        !options.includeNumbers &&
        !options.includeSymbols
      ) {
        throw new Error("Please select at least one character type");
      }

      if (generateCount === 1) {
        const password = generatePassword(options);
        setCurrentPassword(password);

        const result: PasswordGenerationResult = {
          password,
          strength: analyzePasswordStrength(password),
          generatedAt: new Date(),
          options: { ...options },
        };

        setGeneratedPasswords((prev) => [result, ...prev.slice(0, 9)]); // Keep last 10
      } else {
        const results = generateMultiplePasswords(options, generateCount);
        setGeneratedPasswords((prev) => [...results, ...prev].slice(0, 50)); // Keep last 50

        if (results.length > 0) {
          setCurrentPassword(results[0].password);
        }
      }
    } catch (error) {
      console.error("Password generation failed:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyPassword = () => {
    if (currentPassword) {
      void writeClipboardText(currentPassword);
    }
  };

  const handleClearHistory = () => {
    setGeneratedPasswords([]);
  };

  const handleManualPasswordChange = (value: string) => {
    setCurrentPassword(value);
  };

  return (
    <div className="space-y-6">
      {/* Current Password Display */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Current Password</CardTitle>
          <CardDescription>
            Your generated or manually entered password
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Password</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="currentPassword"
                  type={showPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => handleManualPasswordChange(e.target.value)}
                  placeholder="Generated password will appear here..."
                  className="font-mono pr-20"
                />
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPassword(!showPassword)}
                    className="h-6 w-6 p-0"
                  >
                    {showPassword ? (
                      <EyeOff className="h-3 w-3" />
                    ) : (
                      <Eye className="h-3 w-3" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyPassword}
                    disabled={!currentPassword}
                    className="h-6 w-6 p-0"
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
                <option value={1}>1 password</option>
                <option value={5}>5 passwords</option>
                <option value={10}>10 passwords</option>
                <option value={25}>25 passwords</option>
              </select>
            </div>
            <Button
              onClick={handleGeneratePassword}
              disabled={isGenerating}
              className="flex items-center gap-2"
            >
              <RefreshCw
                className={`h-4 w-4 ${isGenerating ? "animate-spin" : ""}`}
              />
              Generate
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Generator Controls and Strength Meter */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PasswordGeneratorControls
          options={options}
          onOptionsChange={setOptions}
          onGenerate={handleGeneratePassword}
          isGenerating={isGenerating}
        />

        <PasswordStrengthMeter strength={passwordStrength} />
      </div>

      {/* Generated Passwords History */}
      <PasswordList
        passwords={generatedPasswords}
        onClearAll={handleClearHistory}
        title="Password History"
      />
    </div>
  );
}
