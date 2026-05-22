"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Settings } from "lucide-react";
import { PasswordOptions } from "@/lib/utils/password";

interface PasswordGeneratorControlsProps {
  options: PasswordOptions;
  onOptionsChange: (options: PasswordOptions) => void;
  onGenerate?: () => void;
  isGenerating?: boolean;
}

export function PasswordGeneratorControls({
  options,
  onOptionsChange,
}: PasswordGeneratorControlsProps) {
  const handleOptionChange = (
    key: keyof PasswordOptions,
    value: boolean | number | string
  ) => {
    onOptionsChange({
      ...options,
      [key]: value,
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          <CardTitle className="text-lg">Generator Settings</CardTitle>
        </div>
        <CardDescription>
          Customize your password generation options
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Password Length */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="length">Password Length</Label>
            <span className="text-sm font-medium bg-muted px-2 py-1 rounded">
              {options.length} characters
            </span>
          </div>
          <Slider
            id="length"
            min={4}
            max={128}
            step={1}
            value={[options.length]}
            onValueChange={(value) => handleOptionChange("length", value[0])}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>4</span>
            <span>64</span>
            <span>128</span>
          </div>
        </div>

        {/* Character Types */}
        <div className="space-y-3">
          <Label>Character Types</Label>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="uppercase"
                checked={options.includeUppercase}
                onChange={(e) =>
                  handleOptionChange("includeUppercase", e.target.checked)
                }
                className="h-4 w-4 rounded border-input accent-primary"
              />
              <Label htmlFor="uppercase" className="text-sm cursor-pointer">
                Uppercase (A-Z)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="lowercase"
                checked={options.includeLowercase}
                onChange={(e) =>
                  handleOptionChange("includeLowercase", e.target.checked)
                }
                className="h-4 w-4 rounded border-input accent-primary"
              />
              <Label htmlFor="lowercase" className="text-sm cursor-pointer">
                Lowercase (a-z)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="numbers"
                checked={options.includeNumbers}
                onChange={(e) =>
                  handleOptionChange("includeNumbers", e.target.checked)
                }
                className="h-4 w-4 rounded border-input accent-primary"
              />
              <Label htmlFor="numbers" className="text-sm cursor-pointer">
                Numbers (0-9)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="symbols"
                checked={options.includeSymbols}
                onChange={(e) =>
                  handleOptionChange("includeSymbols", e.target.checked)
                }
                className="h-4 w-4 rounded border-input accent-primary"
              />
              <Label htmlFor="symbols" className="text-sm cursor-pointer">
                Symbols (!@#$...)
              </Label>
            </div>
          </div>
        </div>

        {/* Advanced Options */}
        <div className="space-y-3">
          <Label>Advanced Options</Label>
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="excludeSimilar"
                checked={options.excludeSimilar}
                onChange={(e) =>
                  handleOptionChange("excludeSimilar", e.target.checked)
                }
                className="h-4 w-4 rounded border-input accent-primary"
              />
              <Label
                htmlFor="excludeSimilar"
                className="text-sm cursor-pointer"
              >
                Exclude similar characters (il1Lo0O)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="excludeAmbiguous"
                checked={options.excludeAmbiguous}
                onChange={(e) =>
                  handleOptionChange("excludeAmbiguous", e.target.checked)
                }
                className="h-4 w-4 rounded border-input accent-primary"
              />
              <Label
                htmlFor="excludeAmbiguous"
                className="text-sm cursor-pointer"
              >
                Exclude ambiguous characters ({}[]()...)
              </Label>
            </div>
          </div>
        </div>

        {/* Custom Symbols */}
        {options.includeSymbols && (
          <div className="space-y-2">
            <Label htmlFor="customSymbols">Custom Symbols (optional)</Label>
            <Input
              id="customSymbols"
              value={options.customSymbols || ""}
              onChange={(e) =>
                handleOptionChange("customSymbols", e.target.value)
              }
              placeholder="!@#$%^&*()_+-=[]{}|;:,.<>?"
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">
              Leave empty to use default symbols
            </p>
          </div>
        )}

        {/* Exclude Characters */}
        <div className="space-y-2">
          <Label htmlFor="excludeCharacters">Exclude Specific Characters</Label>
          <Input
            id="excludeCharacters"
            value={options.excludeCharacters || ""}
            onChange={(e) =>
              handleOptionChange("excludeCharacters", e.target.value)
            }
            placeholder="Characters to exclude from generation"
            className="font-mono"
          />
          <p className="text-xs text-muted-foreground">
            Enter characters you want to exclude from your password
          </p>
        </div>

        {/* Validation */}
        {!options.includeUppercase &&
          !options.includeLowercase &&
          !options.includeNumbers &&
          !options.includeSymbols && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-300">
                You must select at least one character type to generate a
                password.
              </p>
            </div>
          )}
      </CardContent>
    </Card>
  );
}
