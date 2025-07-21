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
import { RegexFlags } from "@/lib/utils/regex/regex-tester";

interface RegexFlagsControlsProps {
  flags: RegexFlags;
  onChange: (flags: RegexFlags) => void;
}

const FLAG_DESCRIPTIONS = {
  global: "Find all matches (g)",
  ignoreCase: "Case insensitive (i)",
  multiline: "Multiline mode (m)",
  dotAll: "Dot matches newlines (s)",
  unicode: "Unicode mode (u)",
  sticky: "Sticky matching (y)",
};

export function RegexFlagsControls({
  flags,
  onChange,
}: RegexFlagsControlsProps) {
  const handleFlagChange = (flag: keyof RegexFlags, checked: boolean) => {
    onChange({
      ...flags,
      [flag]: checked,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Regex Flags</CardTitle>
        <CardDescription>
          Configure how the regex pattern should be executed
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(FLAG_DESCRIPTIONS).map(([flag, description]) => (
            <div key={flag} className="flex items-center space-x-2">
              <input
                type="checkbox"
                id={flag}
                checked={flags[flag as keyof RegexFlags]}
                onChange={(e) =>
                  handleFlagChange(flag as keyof RegexFlags, e.target.checked)
                }
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <Label
                htmlFor={flag}
                className="text-sm font-medium leading-none cursor-pointer"
              >
                {description}
              </Label>
            </div>
          ))}
        </div>

        <div className="mt-4 p-3 bg-muted rounded-lg">
          <div className="text-sm font-medium mb-1">Current flags string:</div>
          <code className="text-sm">
            /
            {Object.entries(flags)
              .filter(([, enabled]) => enabled)
              .map(([flag]) => {
                switch (flag) {
                  case "global":
                    return "g";
                  case "ignoreCase":
                    return "i";
                  case "multiline":
                    return "m";
                  case "dotAll":
                    return "s";
                  case "unicode":
                    return "u";
                  case "sticky":
                    return "y";
                  default:
                    return "";
                }
              })
              .join("")}
            /
          </code>
        </div>
      </CardContent>
    </Card>
  );
}
