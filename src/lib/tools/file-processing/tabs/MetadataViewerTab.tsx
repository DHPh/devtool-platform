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
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Upload,
  Eye,
  Download,
  Trash2,
  Image as ImageIcon,
  FileText,
  Music,
  Video,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FileMetadata {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  lastModified: Date;
  metadata: {
    basic: {
      name: string;
      size: string;
      type: string;
      lastModified: string;
      extension: string;
    };
    image?: {
      dimensions?: string;
    };
    audio?: {
      duration?: string;
      title?: string;
    };
    video?: {
      duration?: string;
      resolution?: string;
    };
    document?: {
      title?: string;
      pages?: number;
    };
  };
  isLoading: boolean;
  error?: string;
}

export default function MetadataViewerTab() {
  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileMetadata | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileCategory = (mimeType: string): string => {
    if (mimeType.startsWith("image/")) return "image";
    if (mimeType.startsWith("audio/")) return "audio";
    if (mimeType.startsWith("video/")) return "video";
    if (
      mimeType.includes("pdf") ||
      mimeType.includes("document") ||
      mimeType.includes("text")
    )
      return "document";
    return "unknown";
  };

  const getFileIcon = (category: string) => {
    switch (category) {
      case "image":
        return <ImageIcon className="h-5 w-5" />;
      case "document":
        return <FileText className="h-5 w-5" />;
      case "audio":
        return <Music className="h-5 w-5" />;
      case "video":
        return <Video className="h-5 w-5" />;
      default:
        return <Info className="h-5 w-5" />;
    }
  };

  const extractMetadata = async (
    file: File
  ): Promise<FileMetadata["metadata"]> => {
    // Basic metadata that's always available
    const basic = {
      name: file.name,
      size: formatFileSize(file.size),
      type: file.type || "Unknown",
      lastModified: new Date(file.lastModified).toLocaleString(),
      extension: file.name.split(".").pop()?.toUpperCase() || "Unknown",
    };

    const category = getFileCategory(file.type);
    const metadata: FileMetadata["metadata"] = { basic };

    try {
      if (category === "image" && file.type.startsWith("image/")) {
        // Extract real image dimensions
        const img = new Image();
        const url = URL.createObjectURL(file);

        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = url;
        });

        metadata.image = {
          dimensions: `${img.width} × ${img.height}`,
        };

        URL.revokeObjectURL(url);
      } else if (category === "audio" && file.type.startsWith("audio/")) {
        // Extract audio duration
        const audio = new Audio();
        const url = URL.createObjectURL(file);

        try {
          await new Promise((resolve, reject) => {
            const timeout = setTimeout(
              () => reject(new Error("Timeout")),
              3000
            );
            audio.addEventListener("loadedmetadata", () => {
              clearTimeout(timeout);
              resolve(undefined);
            });
            audio.addEventListener("error", () => {
              clearTimeout(timeout);
              reject(new Error("Cannot load audio"));
            });
            audio.src = url;
          });

          const duration = audio.duration;
          const minutes = Math.floor(duration / 60);
          const seconds = Math.floor(duration % 60);

          metadata.audio = {
            duration: `${minutes}:${seconds.toString().padStart(2, "0")}`,
            title: file.name.replace(/\.[^/.]+$/, ""),
          };
        } catch {
          metadata.audio = {
            duration: "Unknown",
            title: file.name.replace(/\.[^/.]+$/, ""),
          };
        }

        URL.revokeObjectURL(url);
      } else if (category === "video" && file.type.startsWith("video/")) {
        // Extract video info
        const video = document.createElement("video");
        const url = URL.createObjectURL(file);

        try {
          await new Promise((resolve, reject) => {
            const timeout = setTimeout(
              () => reject(new Error("Timeout")),
              3000
            );
            video.addEventListener("loadedmetadata", () => {
              clearTimeout(timeout);
              resolve(undefined);
            });
            video.addEventListener("error", () => {
              clearTimeout(timeout);
              reject(new Error("Cannot load video"));
            });
            video.src = url;
          });

          const duration = video.duration;
          const minutes = Math.floor(duration / 60);
          const seconds = Math.floor(duration % 60);

          metadata.video = {
            duration: `${minutes}:${seconds.toString().padStart(2, "0")}`,
            resolution: `${video.videoWidth} × ${video.videoHeight}`,
          };
        } catch {
          metadata.video = {
            duration: "Unknown",
            resolution: "Unknown",
          };
        }

        URL.revokeObjectURL(url);
      } else if (category === "document") {
        metadata.document = {
          title: file.name.replace(/\.[^/.]+$/, ""),
          pages: 1,
        };
      }
    } catch {
      // If metadata extraction fails, we'll just have basic info
    }

    return metadata;
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files) return;

    const newFiles: FileMetadata[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      const newFile: FileMetadata = {
        id: Date.now() + i + Math.random().toString(36).substr(2, 9),
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: new Date(file.lastModified),
        metadata: {
          basic: {
            name: "",
            size: "",
            type: "",
            lastModified: "",
            extension: "",
          },
        },
        isLoading: true,
      };

      newFiles.push(newFile);
    }

    setFiles((prev) => [...prev, ...newFiles]);

    // Process metadata extraction for each file
    for (const newFile of newFiles) {
      try {
        const metadata = await extractMetadata(newFile.file);

        setFiles((prev) =>
          prev.map((f) =>
            f.id === newFile.id
              ? {
                  ...f,
                  metadata,
                  isLoading: false,
                }
              : f
          )
        );
      } catch {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === newFile.id
              ? {
                  ...f,
                  isLoading: false,
                  error: "Failed to extract metadata",
                }
              : f
          )
        );
      }
    }
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
    if (selectedFile?.id === id) {
      setSelectedFile(null);
    }
  };

  const exportMetadata = (file: FileMetadata) => {
    const dataStr = JSON.stringify(file.metadata, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${file.name}_metadata.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* File Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Eye className="h-5 w-5 mr-2" />
              Metadata Viewer
            </CardTitle>
            <CardDescription>
              Extract and view detailed metadata from your files including
              dimensions, duration, and basic file information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className={cn(
                "border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6",
                "hover:border-gray-400 dark:hover:border-gray-500 transition-colors cursor-pointer"
              )}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => handleFileSelect(e.target.files)}
                accept="*/*"
              />
              <div className="text-center">
                <Upload className="h-10 w-10 mx-auto text-gray-400 mb-4" />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Click to upload files or drag and drop
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  Supports all file types
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* File List */}
        {files.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Files */}
            <Card>
              <CardHeader>
                <CardTitle>Files ({files.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {files.map((file) => (
                    <div
                      key={file.id}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg border cursor-pointer",
                        "hover:bg-gray-50 dark:hover:bg-gray-800",
                        selectedFile?.id === file.id &&
                          "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800"
                      )}
                      onClick={() => setSelectedFile(file)}
                    >
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <div className="text-gray-500">
                          {getFileIcon(getFileCategory(file.type))}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {file.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(file.size)} •{" "}
                            {file.type || "Unknown type"}
                          </p>
                          {file.isLoading && (
                            <div className="flex items-center mt-1">
                              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse mr-1"></div>
                              <span className="text-xs text-blue-600">
                                Extracting metadata...
                              </span>
                            </div>
                          )}
                          {file.error && (
                            <Badge
                              variant="destructive"
                              className="mt-1 text-xs"
                            >
                              {file.error}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {!file.isLoading && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  exportMetadata(file);
                                }}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Export metadata as JSON</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeFile(file.id);
                              }}
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
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Metadata Display */}
            <Card>
              <CardHeader>
                <CardTitle>Metadata</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedFile ? (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {/* Basic Information */}
                    <Card className="mb-4">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center text-lg">
                          <Info className="h-5 w-5" />
                          <span className="ml-2">Basic Information</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {Object.entries(selectedFile.metadata.basic).map(
                            ([key, value]) => (
                              <div key={key} className="space-y-1">
                                <dt className="text-sm font-medium text-muted-foreground capitalize">
                                  {key.replace(/([A-Z])/g, " $1").trim()}
                                </dt>
                                <dd className="text-sm font-mono">
                                  {String(value)}
                                </dd>
                              </div>
                            )
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Image Metadata */}
                    {selectedFile.metadata.image && (
                      <Card className="mb-4">
                        <CardHeader className="pb-3">
                          <CardTitle className="flex items-center text-lg">
                            <ImageIcon className="h-5 w-5" />
                            <span className="ml-2">Image Properties</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {Object.entries(selectedFile.metadata.image).map(
                              ([key, value]) => (
                                <div key={key} className="space-y-1">
                                  <dt className="text-sm font-medium text-muted-foreground capitalize">
                                    {key.replace(/([A-Z])/g, " $1").trim()}
                                  </dt>
                                  <dd className="text-sm font-mono">
                                    {String(value)}
                                  </dd>
                                </div>
                              )
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Audio Metadata */}
                    {selectedFile.metadata.audio && (
                      <Card className="mb-4">
                        <CardHeader className="pb-3">
                          <CardTitle className="flex items-center text-lg">
                            <Music className="h-5 w-5" />
                            <span className="ml-2">Audio Properties</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {Object.entries(selectedFile.metadata.audio).map(
                              ([key, value]) => (
                                <div key={key} className="space-y-1">
                                  <dt className="text-sm font-medium text-muted-foreground capitalize">
                                    {key.replace(/([A-Z])/g, " $1").trim()}
                                  </dt>
                                  <dd className="text-sm font-mono">
                                    {String(value)}
                                  </dd>
                                </div>
                              )
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Video Metadata */}
                    {selectedFile.metadata.video && (
                      <Card className="mb-4">
                        <CardHeader className="pb-3">
                          <CardTitle className="flex items-center text-lg">
                            <Video className="h-5 w-5" />
                            <span className="ml-2">Video Properties</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {Object.entries(selectedFile.metadata.video).map(
                              ([key, value]) => (
                                <div key={key} className="space-y-1">
                                  <dt className="text-sm font-medium text-muted-foreground capitalize">
                                    {key.replace(/([A-Z])/g, " $1").trim()}
                                  </dt>
                                  <dd className="text-sm font-mono">
                                    {String(value)}
                                  </dd>
                                </div>
                              )
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Document Metadata */}
                    {selectedFile.metadata.document && (
                      <Card className="mb-4">
                        <CardHeader className="pb-3">
                          <CardTitle className="flex items-center text-lg">
                            <FileText className="h-5 w-5" />
                            <span className="ml-2">Document Properties</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {Object.entries(selectedFile.metadata.document).map(
                              ([key, value]) => (
                                <div key={key} className="space-y-1">
                                  <dt className="text-sm font-medium text-muted-foreground capitalize">
                                    {key.replace(/([A-Z])/g, " $1").trim()}
                                  </dt>
                                  <dd className="text-sm font-mono">
                                    {String(value)}
                                  </dd>
                                </div>
                              )
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Select a file to view its metadata</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
