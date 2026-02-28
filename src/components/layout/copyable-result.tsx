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
  textareaClassName?: string;
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
  textareaClassName = "",
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

  const copiedLabel = copyLabel.replace(/^Copy\s+/i, "");
  const copiedAriaLabel = `${copiedLabel.charAt(0).toUpperCase()}${copiedLabel.slice(1)} copied`;

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Header with label and controls */}
      {(label || showCopyButton || showToggleVisibility) && (
        <div className="flex items-center justify-between">
          {label && (
            <span className="text-sm font-medium leading-none">{label}</span>
          )}
          <div className="flex gap-2">
            {showToggleVisibility && (
              <Button
                type="button"
                onClick={toggleVisibility}
                variant="ghost"
                size="sm"
                className="h-8 px-2"
                aria-label={isVisible ? "Hide result" : "Show result"}
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
                type="button"
                onClick={handleCopy}
                variant="ghost"
                size="sm"
                className="h-8 px-2"
                disabled={!value}
                aria-label={
                  copied ? copiedAriaLabel : copyLabel
                }
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
        aria-label={label ?? "Result"}
        readOnly={readOnly}
        rows={rows}
        className={`resize-none ${
          fontFamily === "mono" ? "font-mono text-sm" : ""
        } ${!readOnly ? "cursor-text" : "cursor-default"} ${textareaClassName}`}
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
            type="button"
            onClick={handleCopy}
            variant="ghost"
            size="sm"
            className="h-6 px-2"
            disabled={!code}
            aria-label={copied ? "Code copied" : "Copy code"}
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
