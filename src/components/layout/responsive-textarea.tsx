"use client";

import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Upload, X } from "lucide-react";
import { useState, useRef } from "react";

interface ResponsiveTextAreaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  minHeight?: number;
  maxHeight?: number;
  showCharacterCount?: boolean;
  showWordCount?: boolean;
  showLineCount?: boolean;
  allowFileUpload?: boolean;
  acceptedFileTypes?: string;
  onFileUpload?: (content: string) => void;
  className?: string;
  resize?: "none" | "vertical" | "horizontal" | "both";
}

export function ResponsiveTextArea({
  value,
  onChange,
  placeholder,
  readOnly = false,
  minHeight = 300,
  maxHeight,
  showCharacterCount = true,
  showWordCount = false,
  showLineCount = false,
  allowFileUpload = false,
  acceptedFileTypes = ".txt,.json,.html,.css,.js,.md",
  onFileUpload,
  className = "",
  resize = "vertical",
}: ResponsiveTextAreaProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (onFileUpload) {
        onFileUpload(content);
      } else {
        onChange(content);
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (!allowFileUpload || readOnly) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (allowFileUpload && !readOnly) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const clearContent = () => {
    onChange("");
  };

  const characterCount = value.length;
  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;
  const lineCount = value.split("\n").length;

  const heightStyle = {
    minHeight: `${minHeight}px`,
    maxHeight: maxHeight ? `${maxHeight}px` : undefined,
    resize: resize,
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="relative">
        {allowFileUpload && !readOnly && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept={acceptedFileTypes}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
              }}
              className="hidden"
            />
            <div className="flex gap-2 mb-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload File
              </Button>
              {value && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={clearContent}
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              )}
            </div>
          </>
        )}

        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          readOnly={readOnly}
          style={heightStyle}
          className={`font-mono text-sm transition-colors ${
            isDragging ? "border-blue-500 bg-blue-50" : ""
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        />

        {isDragging && (
          <div className="absolute inset-0 bg-blue-500/10 border-2 border-dashed border-blue-500 rounded-md flex items-center justify-center">
            <p className="text-blue-600 font-medium">Drop file here</p>
          </div>
        )}
      </div>

      {(showCharacterCount || showWordCount || showLineCount) && (
        <div className="flex gap-4 text-xs text-muted-foreground">
          {showCharacterCount && <span>Characters: {characterCount}</span>}
          {showWordCount && <span>Words: {wordCount}</span>}
          {showLineCount && <span>Lines: {lineCount}</span>}
        </div>
      )}
    </div>
  );
}
