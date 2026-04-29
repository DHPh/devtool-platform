"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Eye, EyeOff } from "lucide-react";
import { CopyButton } from "./copy-button";
import { CodeEditor, type CodeLanguage } from "@/components/code-editor";
import { cn } from "@/lib/utils";

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
  language?: CodeLanguage;
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
  language,
  onValueChange,
}: CopyableResultProps) {
  const [isVisible, setIsVisible] = useState(true);

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };
  const copiedSubject = copyLabel.replace(/^Copy\s+/i, "");
  const copiedAriaLabel = copiedSubject
    ? `${copiedSubject.charAt(0).toUpperCase()}${copiedSubject.slice(1)} copied`
    : "Copied";

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
            {showCopyButton && (
              <CopyButton
                value={value}
                label={copyLabel}
                copiedLabel={copiedAriaLabel}
                successMessage={successMessage}
                className="h-8 px-2 text-xs"
              />
            )}
          </div>
        </div>
      )}

      {/* Result editor / textarea */}
      {language && isVisible ? (
        <CodeEditor
          value={value}
          onChange={onValueChange}
          language={language}
          placeholder={placeholder}
          readOnly={readOnly}
          rows={rows}
          aria-label={label ?? "Result"}
          showToolbar={true}
          showCopyButton={false}
          showClearButton={false}
          editorClassName={textareaClassName}
        />
      ) : (
        <Textarea
          value={isVisible ? value : "•".repeat(value.length)}
          onChange={(e) => onValueChange?.(e.target.value)}
          placeholder={placeholder}
          aria-label={label ?? "Result"}
          readOnly={readOnly}
          rows={rows}
          spellCheck={fontFamily === "mono" ? false : undefined}
          className={`resize-none ${
            fontFamily === "mono" ? "font-mono text-sm" : ""
          } ${!readOnly ? "cursor-text" : "cursor-default"} ${textareaClassName}`}
        />
      )}
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
          <CopyButton
            value={code}
            label="Copy code"
            copiedLabel="Code copied"
            successMessage="Code copied to clipboard!"
            className="h-6 px-2"
            showText={false}
          />
        </div>
      </div>

      {/* Code content */}
      <pre className="bg-muted/50 border border-t-0 rounded-b-md p-4 overflow-x-auto">
        <code className="text-sm font-mono">{code}</code>
      </pre>
    </div>
  );
}

export interface CopyableResultGridItem {
  id: string;
  label: string;
  value: string;
  rows?: number;
  tone?: "default" | "success" | "warning" | "error";
}

export function CopyableResultGrid({
  items,
  className,
}: {
  items: CopyableResultGridItem[];
  className?: string;
}) {
  return (
    <div className={cn("grid gap-3 sm:grid-cols-2", className)}>
      {items.map((item) => (
        <div
          key={item.id}
          className={cn(
            "rounded-md border bg-muted/20 p-3",
            item.tone === "success" && "border-green-500/30 bg-green-500/5",
            item.tone === "warning" && "border-orange-500/30 bg-orange-500/5",
            item.tone === "error" &&
              "border-destructive/30 bg-destructive/5",
          )}
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-sm font-medium">{item.label}</span>
            <CopyButton
              value={item.value}
              label={`Copy ${item.label}`}
              copiedLabel={`${item.label} copied`}
              showText={false}
              className="h-7 w-7 p-0"
            />
          </div>
          {item.rows && item.rows > 1 ? (
            <Textarea
              value={item.value}
              readOnly
              rows={item.rows}
              spellCheck={false}
              aria-label={item.label}
              className="resize-none font-mono text-sm"
            />
          ) : (
            <output className="block break-all font-mono text-sm">
              {item.value}
            </output>
          )}
        </div>
      ))}
    </div>
  );
}
