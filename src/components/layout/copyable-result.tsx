"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Check, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

interface CopyableResultProps {
  value: string;
  placeholder?: string;
  label?: string;
  copyLabel?: string;
  successMessage?: string;
  readOnly?: boolean;
  rows?: number;
  className?: string;
  showCopyButton?: boolean;
  showToggleVisibility?: boolean;
  fontFamily?: "mono" | "sans";
  onValueChange?: (value: string) => void;
}

export function CopyableResult({
  value,
  placeholder = "Result will appear here...",
  label,
  copyLabel = "Copy",
  successMessage = "Copied to clipboard!",
  readOnly = true,
  rows = 6,
  className = "",
  showCopyButton = true,
  showToggleVisibility = false,
  fontFamily = "mono",
  onValueChange,
}: CopyableResultProps) {
  const [copied, setCopied] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  const handleCopy = async () => {
    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);
      toast.success(successMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Header with label and controls */}
      {(label || showCopyButton || showToggleVisibility) && (
        <div className="flex items-center justify-between">
          {label && (
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              {label}
            </label>
          )}
          <div className="flex gap-2">
            {showToggleVisibility && (
              <Button
                onClick={toggleVisibility}
                variant="ghost"
                size="sm"
                className="h-8 px-2"
              >
                {isVisible ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            )}
            {showCopyButton && value && (
              <Button
                onClick={handleCopy}
                variant="ghost"
                size="sm"
                className="h-8 px-2"
                disabled={!value}
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                <span className="ml-1 text-xs">
                  {copied ? "Copied!" : copyLabel}
                </span>
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Result textarea */}
      <Textarea
        value={isVisible ? value : "•".repeat(value.length)}
        onChange={(e) => onValueChange?.(e.target.value)}
        placeholder={placeholder}
        readOnly={readOnly}
        rows={rows}
        className={`resize-none ${
          fontFamily === "mono" ? "font-mono text-sm" : ""
        } ${!readOnly ? "cursor-text" : "cursor-default"}`}
      />
    </div>
  );
}

interface CopyableCodeBlockProps {
  code: string;
  language?: string;
  label?: string;
  className?: string;
}

export function CopyableCodeBlock({
  code,
  language = "text",
  label,
  className = "",
}: CopyableCodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success("Code copied to clipboard!");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between bg-muted px-4 py-2 rounded-t-md border">
        {label && (
          <span className="text-sm font-medium text-muted-foreground">
            {label}
          </span>
        )}
        <div className="flex items-center gap-2">
          {language && (
            <span className="text-xs text-muted-foreground uppercase">
              {language}
            </span>
          )}
          <Button
            onClick={handleCopy}
            variant="ghost"
            size="sm"
            className="h-6 px-2"
          >
            {copied ? (
              <Check className="h-3 w-3 text-green-600" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </Button>
        </div>
      </div>

      {/* Code content */}
      <pre className="bg-muted/50 border border-t-0 rounded-b-md p-4 overflow-x-auto">
        <code className="text-sm font-mono">{code}</code>
      </pre>
    </div>
  );
}
