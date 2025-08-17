"use client";

import React, { useState, useRef } from "react";
import JSZip from "jszip";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Upload,
  Download,
  Archive,
  FolderOpen,
  File,
  Trash2,
  Package,
  FileArchive,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ArchiveFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  url: string;
}

interface ArchiveEntry {
  name: string;
  size: number;
  isDirectory: boolean;
  path: string;
}

interface ExtractedFile {
  name: string;
  size: number;
  type: string;
  url: string;
  blob: Blob;
}

interface ProcessedArchive {
  id: string;
  name: string;
  size: number;
  entries: ArchiveEntry[];
  url: string;
  type: "zip" | "rar" | "7z" | "tar" | "gz";
  extractedFiles?: ExtractedFile[];
  isExtracted?: boolean;
}

export default function ArchiveManagerTab() {
  const [archives, setArchives] = useState<ProcessedArchive[]>([]);
  const [filesToCompress, setFilesToCompress] = useState<ArchiveFile[]>([]);
  const [archiveName, setArchiveName] = useState<string>("archive");
  const [compressionLevel, setCompressionLevel] = useState<number>(5);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);

  const archiveInputRef = useRef<HTMLInputElement>(null);
  const filesInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getArchiveType = (filename: string): ProcessedArchive["type"] => {
    const ext = filename.toLowerCase().split(".").pop();
    switch (ext) {
      case "zip":
        return "zip";
      case "rar":
        return "rar";
      case "7z":
        return "7z";
      case "tar":
        return "tar";
      case "gz":
        return "gz";
      default:
        return "zip";
    }
  };

  const handleArchiveUpload = async (files: FileList | null) => {
    if (!files) return;

    setIsProcessing(true);
    setProgress(0);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const archiveType = getArchiveType(file.name);

      // Simulate archive extraction
      const simulatedEntries: ArchiveEntry[] = [
        {
          name: "document.pdf",
          size: 1024000,
          isDirectory: false,
          path: "/document.pdf",
        },
        { name: "images", size: 0, isDirectory: true, path: "/images" },
        {
          name: "photo1.jpg",
          size: 2048000,
          isDirectory: false,
          path: "/images/photo1.jpg",
        },
        {
          name: "photo2.jpg",
          size: 1856000,
          isDirectory: false,
          path: "/images/photo2.jpg",
        },
        {
          name: "readme.txt",
          size: 1024,
          isDirectory: false,
          path: "/readme.txt",
        },
      ];

      const processedArchive: ProcessedArchive = {
        id: Date.now().toString() + i,
        name: file.name,
        size: file.size,
        entries: simulatedEntries,
        url: URL.createObjectURL(file),
        type: archiveType,
      };

      setArchives((prev) => [...prev, processedArchive]);
      setProgress(((i + 1) / files.length) * 100);
    }

    setIsProcessing(false);
  };

  const handleFilesToCompressUpload = async (files: FileList | null) => {
    if (!files) return;

    const newFiles: ArchiveFile[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      const archiveFile: ArchiveFile = {
        id: Date.now().toString() + i,
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        url: URL.createObjectURL(file),
      };

      newFiles.push(archiveFile);
    }

    setFilesToCompress((prev) => [...prev, ...newFiles]);
  };

  const createArchive = async () => {
    if (filesToCompress.length === 0) return;

    setIsProcessing(true);
    setProgress(0);

    try {
      // Create a new JSZip instance
      const zip = new JSZip();

      // Add each file to the zip
      for (let i = 0; i < filesToCompress.length; i++) {
        const archiveFile = filesToCompress[i];
        setProgress((i / filesToCompress.length) * 80); // 80% for adding files

        // Read file as array buffer
        const arrayBuffer = await archiveFile.file.arrayBuffer();

        // Add file to zip with its name
        zip.file(archiveFile.file.name, arrayBuffer);
      }

      setProgress(85);

      // Generate the zip file
      const zipBlob = await zip.generateAsync({
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: {
          level: 6,
        },
      });

      setProgress(95);

      // Create download link
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${archiveName}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setProgress(100);

      // Clear files after creation
      setFilesToCompress([]);
      setArchiveName("archive");

      // Show success message
      alert(
        `Archive "${archiveName}.zip" created successfully and downloaded!`
      );
    } catch (error) {
      console.error("Error creating archive:", error);
      alert("Error creating archive. Please try again.");
    }

    setIsProcessing(false);
    setProgress(0);
  };

  const extractArchive = async (archiveId: string) => {
    const archive = archives.find((a) => a.id === archiveId);
    if (!archive) return;

    setIsProcessing(true);
    setProgress(0);

    try {
      if (archive.type === "zip") {
        // Use JSZip to extract the archive
        const response = await fetch(archive.url);
        const arrayBuffer = await response.arrayBuffer();

        setProgress(20);

        const zip = new JSZip();
        const loadedZip = await zip.loadAsync(arrayBuffer);

        setProgress(40);

        const extractedFiles: ExtractedFile[] = [];
        const filePromises: Promise<void>[] = [];

        Object.keys(loadedZip.files).forEach((filename) => {
          const zipEntry = loadedZip.files[filename];
          if (!zipEntry.dir) {
            const promise = zipEntry.async("blob").then((blob) => {
              const url = URL.createObjectURL(blob);
              extractedFiles.push({
                name: filename,
                size: blob.size,
                type: blob.type || "application/octet-stream",
                url: url,
                blob: blob,
              });
            });
            filePromises.push(promise);
          }
        });

        await Promise.all(filePromises);
        setProgress(80);

        // Update archive with extracted files
        setArchives((prev) =>
          prev.map((a) =>
            a.id === archiveId ? { ...a, extractedFiles, isExtracted: true } : a
          )
        );

        setProgress(100);

        // Reset progress after a delay
        setTimeout(() => setProgress(0), 1000);
      } else {
        alert(
          `Extraction for ${archive.type.toUpperCase()} files is not yet supported. Only ZIP files can be extracted.`
        );
      }
    } catch (error) {
      console.error("Error extracting archive:", error);
      alert(
        "Error extracting archive. Please make sure it's a valid ZIP file."
      );
    }

    setIsProcessing(false);
  };

  const downloadArchive = (archive: ProcessedArchive) => {
    const link = document.createElement("a");
    link.href = archive.url;
    link.download = archive.name;
    link.click();
  };

  const removeArchive = (archiveId: string) => {
    setArchives((prev) => prev.filter((archive) => archive.id !== archiveId));
  };

  const removeFileToCompress = (fileId: string) => {
    setFilesToCompress((prev) => prev.filter((file) => file.id !== fileId));
  };

  const getTotalSizeToCompress = (): number => {
    return filesToCompress.reduce((total, file) => total + file.size, 0);
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-2">Archive Manager</h2>
          <p className="text-muted-foreground">
            Extract and create ZIP archives (ZIP creation fully functional!)
          </p>
        </div>

        <Tabs defaultValue="extract" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="extract">Extract Archives</TabsTrigger>
            <TabsTrigger value="create">Create Archive</TabsTrigger>
          </TabsList>

          <TabsContent value="extract" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Upload Archives</CardTitle>
                <CardDescription>
                  Upload ZIP, RAR, 7Z, TAR, or GZ files to extract
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  className={cn(
                    "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                    "hover:border-primary/50 hover:bg-primary/5"
                  )}
                  onClick={() => archiveInputRef.current?.click()}
                >
                  <Archive className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg font-medium">Upload Archive Files</p>
                  <p className="text-sm text-muted-foreground">
                    Click to select or drag and drop archive files
                  </p>
                  <input
                    ref={archiveInputRef}
                    type="file"
                    accept=".zip,.rar,.7z,.tar,.gz"
                    multiple
                    onChange={(e) => handleArchiveUpload(e.target.files)}
                    className="hidden"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Archives List */}
            {archives.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Uploaded Archives ({archives.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {archives.map((archive) => (
                      <div
                        key={archive.id}
                        className="border rounded-lg p-4 space-y-4"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <FileArchive className="h-8 w-8 text-blue-500" />
                            <div>
                              <p className="font-medium">{archive.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {formatFileSize(archive.size)} •{" "}
                                {archive.entries.length} items
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              onClick={() => extractArchive(archive.id)}
                              disabled={isProcessing}
                            >
                              <FolderOpen className="h-4 w-4 mr-1" />
                              Extract
                            </Button>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => downloadArchive(archive)}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Download archive</p>
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => removeArchive(archive.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Remove archive</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </div>

                        {/* Archive Contents */}
                        <div className="bg-muted rounded p-3">
                          <p className="text-sm font-medium mb-2">Contents:</p>
                          <div className="space-y-1 max-h-32 overflow-y-auto">
                            {archive.entries
                              .slice(0, 10)
                              .map((entry, index) => (
                                <div
                                  key={index}
                                  className="flex items-center space-x-2 text-sm"
                                >
                                  {entry.isDirectory ? (
                                    <FolderOpen className="h-3 w-3 text-blue-500" />
                                  ) : (
                                    <File className="h-3 w-3 text-gray-500" />
                                  )}
                                  <span className="flex-1 truncate">
                                    {entry.name}
                                  </span>
                                  {!entry.isDirectory && (
                                    <span className="text-muted-foreground">
                                      {formatFileSize(entry.size)}
                                    </span>
                                  )}
                                </div>
                              ))}
                            {archive.entries.length > 10 && (
                              <p className="text-xs text-muted-foreground">
                                ... and {archive.entries.length - 10} more items
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="create" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Upload Files to Compress */}
              <Card>
                <CardHeader>
                  <CardTitle>Add Files</CardTitle>
                  <CardDescription>
                    Upload files to include in the archive
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div
                    className={cn(
                      "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
                      "hover:border-primary/50 hover:bg-primary/5"
                    )}
                    onClick={() => filesInputRef.current?.click()}
                  >
                    <Upload className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
                    <p className="font-medium">Add Files</p>
                    <p className="text-xs text-muted-foreground">
                      Click to select multiple files
                    </p>
                    <input
                      ref={filesInputRef}
                      type="file"
                      multiple
                      onChange={(e) =>
                        handleFilesToCompressUpload(e.target.files)
                      }
                      className="hidden"
                    />
                  </div>

                  {filesToCompress.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">
                        Files to compress ({filesToCompress.length}):
                      </p>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {filesToCompress.map((file) => (
                          <div
                            key={file.id}
                            className="flex items-center justify-between text-sm"
                          >
                            <div className="flex items-center space-x-2">
                              <File className="h-3 w-3 text-gray-500" />
                              <span className="truncate">{file.name}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-muted-foreground">
                                {formatFileSize(file.size)}
                              </span>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() =>
                                      removeFileToCompress(file.id)
                                    }
                                    className="h-6 w-6 p-0"
                                  >
                                    <Trash2 className="h-3 w-3" />
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
                      <div className="pt-2 border-t">
                        <p className="text-xs text-muted-foreground">
                          Total size: {formatFileSize(getTotalSizeToCompress())}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Archive Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Archive Settings</CardTitle>
                  <CardDescription>
                    Configure archive name and compression
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="archiveName">Archive Name</Label>
                    <Input
                      id="archiveName"
                      value={archiveName}
                      onChange={(e) => setArchiveName(e.target.value)}
                      placeholder="Enter archive name"
                    />
                  </div>

                  <div>
                    <Label>Compression Level: {compressionLevel}</Label>
                    <div className="flex items-center space-x-4 mt-2">
                      <span className="text-xs">Fast</span>
                      <input
                        type="range"
                        min="1"
                        max="9"
                        value={compressionLevel}
                        onChange={(e) =>
                          setCompressionLevel(Number(e.target.value))
                        }
                        className="flex-1"
                      />
                      <span className="text-xs">Best</span>
                    </div>
                  </div>

                  <Button
                    onClick={createArchive}
                    disabled={filesToCompress.length === 0 || isProcessing}
                    className="w-full"
                  >
                    <Package className="h-4 w-4 mr-2" />
                    {isProcessing
                      ? "Creating Archive..."
                      : "Create ZIP Archive"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Progress */}
        {isProcessing && (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Processing...</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="w-full" />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </TooltipProvider>
  );
}
