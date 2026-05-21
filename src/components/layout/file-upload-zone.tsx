"use client";

import { useCallback, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, File, Upload, X } from "lucide-react";
import { toast } from "sonner";

interface FileUploadZoneProps {
  onFileSelect: (content: string, fileName: string) => void;
  onClear?: () => void;
  acceptedTypes?: string[];
  maxSizeInMB?: number;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function FileUploadZone({
  onFileSelect,
  onClear,
  acceptedTypes = [".txt", ".json", ".csv", ".html", ".css", ".js", ".md"],
  maxSizeInMB = 5,
  placeholder = "Drag and drop a file here, or click to select",
  className = "",
  disabled = false,
}: FileUploadZoneProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const validateFile = useCallback(
    (file: File): string | null => {
      if (file.size > maxSizeInMB * 1024 * 1024) {
        return `File size must be less than ${maxSizeInMB}MB`;
      }

      const fileExtension = `.${file.name.split(".").pop()?.toLowerCase()}`;
      if (acceptedTypes.length > 0 && !acceptedTypes.includes(fileExtension)) {
        return `File type ${fileExtension} is not supported. Accepted types: ${acceptedTypes.join(
          ", ",
        )}`;
      }

      return null;
    },
    [maxSizeInMB, acceptedTypes],
  );

  const processFile = useCallback(
    async (file: File) => {
      const error = validateFile(file);
      if (error) {
        toast.error(error);
        return;
      }

      setIsLoading(true);
      setSelectedFile(file);

      try {
        const content = await file.text();
        onFileSelect(content, file.name);
        toast.success(`File "${file.name}" loaded successfully`);
      } catch {
        toast.error("Failed to read file");
        setSelectedFile(null);
      } finally {
        setIsLoading(false);
      }
    },
    [onFileSelect, validateFile],
  );

  const openFilePicker = () => {
    if (disabled || isLoading) return;
    inputRef.current?.click();
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      if (disabled) return;

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        void processFile(files[0]);
      }
    },
    [disabled, processFile],
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled) {
        setIsDragOver(true);
      }
    },
    [disabled],
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      void processFile(files[0]);
    }
    e.target.value = "";
  };

  const clearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
    setIsLoading(false);
    onClear?.();
  };

  const isPromptInteractive = !disabled && !selectedFile;

  return (
    <div className={className}>
      <Card
        role={isPromptInteractive ? "button" : undefined}
        tabIndex={isPromptInteractive ? 0 : undefined}
        aria-label={isPromptInteractive ? placeholder : undefined}
        onClick={() => {
          if (isPromptInteractive) {
            openFilePicker();
          }
        }}
        onKeyDown={(e) => {
          if (isPromptInteractive && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            openFilePicker();
          }
        }}
        className={`
          transition-all duration-200 border-2 border-dashed
          ${isPromptInteractive ? "cursor-pointer" : ""}
          ${
            isDragOver
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25"
          }
          ${
            disabled
              ? "opacity-50 cursor-not-allowed"
              : "hover:border-primary/50"
          }
          ${
            selectedFile
              ? "border-green-500 bg-green-50 dark:bg-green-950/20"
              : ""
          }
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <CardContent className="p-6">
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            onChange={handleFileInput}
            accept={acceptedTypes.join(",")}
            className="hidden"
            disabled={disabled}
          />

          {selectedFile ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-md">
                  <File className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="font-medium text-sm">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              {!isLoading && (
                <Button
                  type="button"
                  onClick={clearFile}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  aria-label="Remove selected file"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ) : (
            <div className="text-center">
              <div className="mx-auto mb-4 p-3 bg-muted rounded-full w-fit">
                <Upload className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium mb-1">{placeholder}</p>
              <p className="text-xs text-muted-foreground mb-4">
                Supported formats: {acceptedTypes.join(", ")} • Max size:{" "}
                {maxSizeInMB}MB
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={disabled}
                onClick={(e) => {
                  e.stopPropagation();
                  openFilePicker();
                }}
              >
                Choose File
              </Button>
            </div>
          )}

          {isLoading && (
            <div className="mt-4 text-center">
              <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
                Processing file...
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-2 text-xs text-muted-foreground">
        <div className="flex items-start gap-1">
          <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
          <span>
            Upload a file or paste content directly into the editor below.
          </span>
        </div>
      </div>
    </div>
  );
}
