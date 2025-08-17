"use client";

import React, { useState, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  Download,
  RefreshCw,
  FileText,
  Trash2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ConversionFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  status: "pending" | "converting" | "completed" | "error";
  targetFormat: string;
  convertedUrl?: string;
  convertedBlob?: Blob;
  error?: string;
}

const FILE_FORMATS = {
  documents: [
    { value: "pdf", label: "PDF", mime: "application/pdf" },
    {
      value: "docx",
      label: "DOCX",
      mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    },
    { value: "txt", label: "TXT", mime: "text/plain" },
    { value: "rtf", label: "RTF", mime: "application/rtf" },
  ],
  images: [
    { value: "jpeg", label: "JPEG", mime: "image/jpeg" },
    { value: "png", label: "PNG", mime: "image/png" },
    { value: "webp", label: "WebP", mime: "image/webp" },
    { value: "gif", label: "GIF", mime: "image/gif" },
    { value: "bmp", label: "BMP", mime: "image/bmp" },
    { value: "svg", label: "SVG", mime: "image/svg+xml" },
  ],
  audio: [
    { value: "mp3", label: "MP3", mime: "audio/mpeg" },
    { value: "wav", label: "WAV", mime: "audio/wav" },
    { value: "ogg", label: "OGG", mime: "audio/ogg" },
    { value: "m4a", label: "M4A", mime: "audio/mp4" },
  ],
  video: [
    { value: "mp4", label: "MP4", mime: "video/mp4" },
    { value: "webm", label: "WebM", mime: "video/webm" },
    { value: "avi", label: "AVI", mime: "video/x-msvideo" },
    { value: "mov", label: "MOV", mime: "video/quicktime" },
  ],
};

export default function FileConverterTab() {
  const [files, setFiles] = useState<ConversionFile[]>([]);
  const [defaultTargetFormat, setDefaultTargetFormat] = useState<string>("pdf");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const convertImage = async (
    file: File,
    targetFormat: string
  ): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;

        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }

        ctx.drawImage(img, 0, 0);

        // Determine output format and quality
        let mimeType = targetFormat;
        const quality = 0.9;

        if (targetFormat === "image/jpeg" || targetFormat === "image/jpg") {
          mimeType = "image/jpeg";
        } else if (targetFormat === "image/png") {
          mimeType = "image/png";
        } else if (targetFormat === "image/webp") {
          mimeType = "image/webp";
        }

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error("Failed to convert image"));
            }
          },
          mimeType,
          quality
        );
      };

      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = URL.createObjectURL(file);
    });
  };

  const getFileCategory = (file: File): string => {
    if (file.type.startsWith("image/")) return "images";
    if (file.type.startsWith("audio/")) return "audio";
    if (file.type.startsWith("video/")) return "video";
    return "documents";
  };

  const getTargetMimeType = (targetFormat: string): string => {
    // If it's already a MIME type, return it
    if (targetFormat.includes("/")) return targetFormat;

    // Convert extension to MIME type
    const extensionToMime: { [key: string]: string } = {
      pdf: "application/pdf",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      txt: "text/plain",
      rtf: "application/rtf",
      jpeg: "image/jpeg",
      jpg: "image/jpeg",
      png: "image/png",
      webp: "image/webp",
      gif: "image/gif",
      bmp: "image/bmp",
      svg: "image/svg+xml",
      mp3: "audio/mpeg",
      wav: "audio/wav",
      ogg: "audio/ogg",
      m4a: "audio/mp4",
      mp4: "video/mp4",
      webm: "video/webm",
      avi: "video/x-msvideo",
      mov: "video/quicktime",
      json: "application/json",
    };

    return extensionToMime[targetFormat] || `application/${targetFormat}`;
  };

  const getCompatibleFormats = (file: File) => {
    const category = getFileCategory(file);
    return FILE_FORMATS[category as keyof typeof FILE_FORMATS] || [];
  };

  const isConversionSupported = (
    sourceType: string,
    targetFormat: string
  ): boolean => {
    const targetMimeType = getTargetMimeType(targetFormat);

    // Image to image conversions are supported
    if (
      sourceType.startsWith("image/") &&
      targetMimeType.startsWith("image/")
    ) {
      return true;
    }

    // Text/JSON conversions are supported
    if (
      (sourceType === "text/plain" && targetMimeType === "application/json") ||
      (sourceType === "application/json" && targetMimeType === "text/plain") ||
      (sourceType.startsWith("text/") && targetMimeType === "text/plain")
    ) {
      return true;
    }

    // Same format (no conversion needed)
    if (sourceType.includes(targetFormat)) {
      return true;
    }

    return false;
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files) return;

    const newFiles: ConversionFile[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      const conversionFile: ConversionFile = {
        id: Date.now().toString() + i,
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        status: "pending",
        targetFormat: defaultTargetFormat,
      };

      newFiles.push(conversionFile);
    }

    setFiles((prev) => [...prev, ...newFiles]);
  };

  const updateTargetFormat = (fileId: string, format: string) => {
    setFiles((prev) =>
      prev.map((file) =>
        file.id === fileId ? { ...file, targetFormat: format } : file
      )
    );
  };

  const convertFile = async (fileId: string) => {
    const file = files.find((f) => f.id === fileId);
    if (!file) return;

    setFiles((prev) =>
      prev.map((f) => (f.id === fileId ? { ...f, status: "converting" } : f))
    );

    try {
      let convertedBlob: Blob;

      // Convert file extension to MIME type for processing
      const targetMimeType = getTargetMimeType(file.targetFormat);

      // Check if it's an image conversion we can handle
      if (
        file.file.type.startsWith("image/") &&
        targetMimeType.startsWith("image/")
      ) {
        convertedBlob = await convertImage(file.file, targetMimeType);
      } else if (
        file.file.type === "text/plain" &&
        (file.targetFormat === "json" || targetMimeType === "application/json")
      ) {
        // Convert text to JSON
        const text = await file.file.text();
        const jsonData = {
          content: text,
          convertedAt: new Date().toISOString(),
          originalFilename: file.file.name,
        };
        convertedBlob = new Blob([JSON.stringify(jsonData, null, 2)], {
          type: "application/json",
        });
      } else if (
        file.file.type === "application/json" &&
        (file.targetFormat === "txt" || targetMimeType === "text/plain")
      ) {
        // Convert JSON to text
        const text = await file.file.text();
        const jsonData = JSON.parse(text);
        const textContent = JSON.stringify(jsonData, null, 2);
        convertedBlob = new Blob([textContent], { type: "text/plain" });
      } else if (
        file.file.type.startsWith("text/") &&
        (file.targetFormat === "txt" || targetMimeType === "text/plain")
      ) {
        // Text to text conversion (e.g., different encoding)
        const text = await file.file.text();
        convertedBlob = new Blob([text], { type: "text/plain" });
      } else if (
        file.targetFormat === file.file.name.split(".").pop()?.toLowerCase()
      ) {
        // Same format - just copy
        convertedBlob = file.file.slice();
      } else {
        // For unsupported conversions, throw an error instead of creating corrupted files
        throw new Error(
          `Conversion from ${file.file.type} to ${file.targetFormat} is not supported. Supported conversions: Image formats (JPEG, PNG, WebP, GIF, BMP), Text to JSON, JSON to Text.`
        );
      }

      const convertedUrl = URL.createObjectURL(convertedBlob);

      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileId
            ? { ...f, status: "completed", convertedUrl, convertedBlob }
            : f
        )
      );
    } catch (err) {
      console.error("Conversion error:", err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Conversion failed. Please try a different format or check if the file is valid.";
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileId
            ? {
                ...f,
                status: "error",
                error: errorMessage,
              }
            : f
        )
      );
    }
  };

  const convertAllFiles = async () => {
    setIsProcessing(true);
    const pendingFiles = files.filter((f) => f.status === "pending");

    for (const file of pendingFiles) {
      await convertFile(file.id);
    }

    setIsProcessing(false);
  };

  const downloadFile = (file: ConversionFile) => {
    if (!file.convertedUrl) return;

    const link = document.createElement("a");
    link.href = file.convertedUrl;

    // Get proper file extension based on target format
    let extension = "";

    // First check if it's already a file extension (like "pdf", "jpg", etc.)
    if (!file.targetFormat.includes("/")) {
      extension = file.targetFormat;
    } else {
      // It's a MIME type, so map it to extension
      const formatMap: { [key: string]: string } = {
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/webp": "webp",
        "image/gif": "gif",
        "image/bmp": "bmp",
        "image/svg+xml": "svg",
        "application/json": "json",
        "text/plain": "txt",
        "application/pdf": "pdf",
        "text/csv": "csv",
        "application/xml": "xml",
        "text/xml": "xml",
        "application/zip": "zip",
        "audio/mpeg": "mp3",
        "audio/wav": "wav",
        "audio/ogg": "ogg",
        "audio/mp4": "m4a",
        "video/mp4": "mp4",
        "video/webm": "webm",
        "video/x-msvideo": "avi",
        "video/quicktime": "mov",
      };

      extension =
        formatMap[file.targetFormat] ||
        file.targetFormat.split("/")[1] ||
        "bin";
    }

    const baseName = file.name.split(".")[0];
    link.download = `converted_${baseName}.${extension}`;
    link.click();
  };

  const removeFile = (fileId: string) => {
    setFiles((prev) => prev.filter((file) => file.id !== fileId));
  };

  const getStatusIcon = (status: ConversionFile["status"]) => {
    switch (status) {
      case "pending":
        return <RefreshCw className="h-4 w-4 text-muted-foreground" />;
      case "converting":
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <RefreshCw className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: ConversionFile["status"]) => {
    switch (status) {
      case "pending":
        return "secondary";
      case "converting":
        return "default";
      case "completed":
        return "default";
      case "error":
        return "destructive";
      default:
        return "secondary";
    }
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-2">File Converter</h2>
          <p className="text-muted-foreground">
            Convert between different file formats
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Upload & Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Upload & Convert</CardTitle>
              <CardDescription>
                Upload files and configure conversion settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Default Target Format */}
              <div>
                <Label className="text-sm font-medium">
                  Default Target Format
                </Label>
                <Select
                  value={defaultTargetFormat}
                  onValueChange={setDefaultTargetFormat}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Documents</SelectLabel>
                      {FILE_FORMATS.documents.map((format) => (
                        <SelectItem key={format.value} value={format.value}>
                          {format.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel>Images</SelectLabel>
                      {FILE_FORMATS.images.map((format) => (
                        <SelectItem key={format.value} value={format.value}>
                          {format.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel>Audio</SelectLabel>
                      {FILE_FORMATS.audio.map((format) => (
                        <SelectItem key={format.value} value={format.value}>
                          {format.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel>Video</SelectLabel>
                      {FILE_FORMATS.video.map((format) => (
                        <SelectItem key={format.value} value={format.value}>
                          {format.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              {/* File Upload */}
              <div
                className={cn(
                  "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                  "hover:border-primary/50 hover:bg-primary/5"
                )}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium">Upload Files</p>
                <p className="text-sm text-muted-foreground">
                  Click to select or drag and drop files
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={(e) => handleFileSelect(e.target.files)}
                  className="hidden"
                />
              </div>

              {/* Convert All Button */}
              {files.length > 0 && (
                <Button
                  onClick={convertAllFiles}
                  disabled={
                    isProcessing || files.every((f) => f.status !== "pending")
                  }
                  className="w-full"
                >
                  {isProcessing ? "Converting..." : "Convert All Files"}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Conversion Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Conversion Status</CardTitle>
              <CardDescription>
                Track your file conversion progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              {files.length > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">
                        {files.filter((f) => f.status === "completed").length}
                      </p>
                      <p className="text-sm text-muted-foreground">Completed</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">
                        {files.filter((f) => f.status === "converting").length}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Converting
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-600">
                        {files.filter((f) => f.status === "pending").length}
                      </p>
                      <p className="text-sm text-muted-foreground">Pending</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-red-600">
                        {files.filter((f) => f.status === "error").length}
                      </p>
                      <p className="text-sm text-muted-foreground">Failed</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No files uploaded yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Files List */}
        {files.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Files ({files.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="border rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(file.status)}
                        <div>
                          <p className="font-medium">{file.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatFileSize(file.size)} •{" "}
                            {file.type || "Unknown type"}
                          </p>
                        </div>
                      </div>
                      <Badge variant={getStatusColor(file.status)}>
                        {file.status}
                      </Badge>
                    </div>

                    {file.status === "error" && file.error && (
                      <div className="text-sm text-red-600 bg-red-50 dark:bg-red-950 p-2 rounded">
                        {file.error}
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div>
                          <Label className="text-xs">Target Format</Label>
                          <Select
                            value={file.targetFormat}
                            onValueChange={(value) =>
                              updateTargetFormat(file.id, value)
                            }
                            disabled={file.status !== "pending"}
                          >
                            <SelectTrigger className="w-32 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {getCompatibleFormats(file.file).map((format) => {
                                const isSupported = isConversionSupported(
                                  file.file.type,
                                  format.value
                                );
                                return (
                                  <SelectItem
                                    key={format.value}
                                    value={format.value}
                                    className={
                                      !isSupported
                                        ? "text-muted-foreground"
                                        : ""
                                    }
                                  >
                                    {format.label}
                                    {!isSupported && " (not supported)"}
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {(file.status === "pending" ||
                          file.status === "converting") && (
                          <Button
                            size="sm"
                            onClick={() => convertFile(file.id)}
                            disabled={file.status === "converting"}
                          >
                            <RefreshCw className="h-4 w-4 mr-1" />
                            {file.status === "converting"
                              ? "Converting..."
                              : "Convert"}
                          </Button>
                        )}
                        {file.status === "completed" && file.convertedUrl && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => downloadFile(file)}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Download converted file</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => removeFile(file.id)}
                              disabled={file.status === "converting"}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Remove file</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </TooltipProvider>
  );
}
