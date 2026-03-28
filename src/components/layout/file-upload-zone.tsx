"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, File, X, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface FileUploadZoneProps {
  onFileSelect: (content: string, fileName: string) => void;
  acceptedTypes?: string[];
  maxSizeInMB?: number;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function FileUploadZone({
  onFileSelect,
  acceptedTypes = [".txt", ".json", ".csv", ".html", ".css", ".js", ".md"],
  maxSizeInMB = 5,
  placeholder = "Drag and drop a file here, or click to select",
  className = "",
  disabled = false,
}: FileUploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const validateFile = useCallback(
    (file: File): string | null => {
      // Check file size
      if (file.size > maxSizeInMB * 1024 * 1024) {
        return `File size must be less than ${maxSizeInMB}MB`;
      }

      // Check file type
      const fileExtension = `.${file.name.split(".").pop()?.toLowerCase()}`;
      if (acceptedTypes.length > 0 && !acceptedTypes.includes(fileExtension)) {
        return `File type ${fileExtension} is not supported. Accepted types: ${acceptedTypes.join(
          ", "
        )}`;
      }

      return null;
    },
    [maxSizeInMB, acceptedTypes]
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
    [onFileSelect, validateFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      if (disabled) return;

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        processFile(files[0]);
      }
    },
    [disabled, processFile]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled) {
        setIsDragOver(true);
      }
    },
    [disabled]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
    // Reset input
    e.target.value = "";
  };

  const clearFile = () => {
    setSelectedFile(null);
    setIsLoading(false);
  };

  return (
    <div className={className}>
      <Card
        className={`
          transition-all duration-200 cursor-pointer border-2 border-dashed
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
          {selectedFile ? (
            // File selected state
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
            // Upload prompt state
            <div className="text-center">
              <div className="mx-auto mb-4 p-3 bg-muted rounded-full w-fit">
                <Upload className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium mb-1">{placeholder}</p>
              <p className="text-xs text-muted-foreground mb-4">
                Supported formats: {acceptedTypes.join(", ")} • Max size:{" "}
                {maxSizeInMB}MB
              </p>
              <input
                type="file"
                onChange={handleFileInput}
                accept={acceptedTypes.join(",")}
                className="hidden"
                id="file-upload"
                disabled={disabled}
              />
              <Button asChild variant="outline" size="sm" disabled={disabled}>
                <label htmlFor="file-upload" className="cursor-pointer">
                  Choose File
                </label>
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

      {/* File type help */}
      <div className="mt-2 text-xs text-muted-foreground">
        <div className="flex items-start gap-1">
          <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
          <span>
            Upload a file or paste content directly into the input field above.
          </span>
        </div>
      </div>
    </div>
  );
}
