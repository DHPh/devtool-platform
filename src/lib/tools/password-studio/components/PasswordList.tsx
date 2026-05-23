"use client";

import React, { useState } from "react";
import { copyToClipboard } from "@/hooks/use-clipboard";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Copy, Eye, EyeOff, Download, Trash2 } from "lucide-react";
import { LockKeyIcon as LockKey } from "@phosphor-icons/react/LockKey";
import { PasswordGenerationResult } from "@/lib/utils/password";

interface PasswordListProps {
  passwords: PasswordGenerationResult[];
  onClearAll: () => void;
  title?: string;
  showStrength?: boolean;
}

export function PasswordList({
  passwords,
  onClearAll,
  title = "Generated Passwords",
  showStrength = true,
}: PasswordListProps) {
  const [hiddenPasswords, setHiddenPasswords] = useState<Set<number>>(
    new Set()
  );

  const handleCopyPassword = (password: string) => {
    void copyToClipboard(password, "Password copied to clipboard!");
  };

  const togglePasswordVisibility = (index: number) => {
    const newHidden = new Set(hiddenPasswords);
    if (newHidden.has(index)) {
      newHidden.delete(index);
    } else {
      newHidden.add(index);
    }
    setHiddenPasswords(newHidden);
  };

  const handleDownloadPasswords = () => {
    const content = passwords
      .map(
        (result, index) =>
          `Password ${index + 1}: ${result.password} (Strength: ${
            result.strength.level
          })`
      )
      .join("\n");

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "generated-passwords.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStrengthColor = (level: string) => {
    switch (level) {
      case "Very Strong":
        return "bg-green-600";
      case "Strong":
        return "bg-green-500";
      case "Good":
        return "bg-yellow-500";
      case "Fair":
        return "bg-orange-500";
      case "Weak":
        return "bg-red-500";
      case "Very Weak":
        return "bg-red-600";
      default:
        return "bg-gray-500";
    }
  };

  if (passwords.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
          <CardDescription>No passwords generated yet</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <LockKey
              aria-hidden="true"
              weight="duotone"
              className="mx-auto mb-2.5 h-9 w-9 text-muted-foreground/60"
            />
            <p>Click &quot;Generate&quot; to create secure passwords</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription>
              {passwords.length} password{passwords.length !== 1 ? "s" : ""}{" "}
              generated
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {passwords.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadPasswords}
                className="flex items-center gap-2"
              >
                <Download className="h-3 w-3" />
                Download
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={onClearAll}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-3 w-3" />
              Clear
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-[500px] overflow-y-auto">
          {passwords.map((result, index) => {
            const isHidden = hiddenPasswords.has(index);
            const displayPassword = isHidden
              ? "•".repeat(result.password.length)
              : result.password;

            return (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-mono text-sm break-all">
                      {displayPassword}
                    </span>
                    {showStrength && (
                      <Badge
                        variant="secondary"
                        className={`text-xs text-white ${getStrengthColor(
                          result.strength.level
                        )}`}
                      >
                        {result.strength.level}
                      </Badge>
                    )}
                  </div>
                  {showStrength && (
                    <div className="text-xs text-muted-foreground">
                      Length: {result.password.length} • Entropy:{" "}
                      {result.strength.entropy.toFixed(1)} bits • Crack time:{" "}
                      {result.strength.estimatedCrackTime}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1 ml-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => togglePasswordVisibility(index)}
                    className="h-8 w-8 p-0"
                    aria-label={hiddenPasswords.has(index) ? `Show password ${index + 1}` : `Hide password ${index + 1}`}
                  >
                    {isHidden ? (
                      <Eye className="h-3 w-3" />
                    ) : (
                      <EyeOff className="h-3 w-3" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopyPassword(result.password)}
                    className="h-8 w-8 p-0"
                    aria-label={`Copy password ${index + 1}`}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
