"use client";

import React, { useRef, useState } from "react";
import { toast } from "sonner";
import { triggerBlobDownload, useObjectUrls } from "@/hooks/use-object-urls";
import {
  extractZip,
  inspectZip,
  type ZipEntryInfo,
} from "@/lib/processors/archive-core";
import { formatFileSize } from "@/lib/processors/file-core";
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
}

type ArchiveEntry = ZipEntryInfo;

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
  file: File;
  type: "zip";
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const archiveInputRef = useRef<HTMLInputElement>(null);
  const filesInputRef = useRef<HTMLInputElement>(null);
  const { createObjectUrl, revokeObjectUrl } = useObjectUrls();

  const handleArchiveUpload = async (files: FileList | null) => {
    if (!files) return;

    setIsProcessing(true);
    setProgress(0);
    setErrorMessage(null);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        if (!file.name.toLowerCase().endsWith(".zip")) {
          throw new Error(`"${file.name}" is not a ZIP file.`);
        }
        const entries = await inspectZip(await file.arrayBuffer());
        const processedArchive: ProcessedArchive = {
          id: `${Date.now()}-${i}`,
          name: file.name,
          size: file.size,
          entries,
          file,
          type: "zip",
        };

        setArchives((prev) => [...prev, processedArchive]);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : `Could not read "${file.name}".`);
      }
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
      const { default: JSZip } = await import("jszip");
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
          level: compressionLevel,
        },
      });

      setProgress(95);

      // Create download link
      triggerBlobDownload(zipBlob, `${archiveName}.zip`);

      setProgress(100);

      // Clear files after creation
      setFilesToCompress([]);
      setArchiveName("archive");

      // Show success message
      toast.success(
        `Archive "${archiveName}.zip" created successfully and downloaded!`
      );
    } catch (error) {
      console.error("Error creating archive:", error);
      toast.error("Error creating archive. Please try again.");
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
      setErrorMessage(null);
      const files = await extractZip(await archive.file.arrayBuffer());
      setProgress(70);

      archive.extractedFiles?.forEach((file) => {
        revokeObjectUrl(file.url);
      });
      const extractedFiles = files.map((file): ExtractedFile => {
        const blob = new Blob([new Uint8Array(file.data)], { type: "application/octet-stream" });
        const url = createObjectUrl(blob);
        return { name: file.path, size: file.size, type: blob.type, url, blob };
      });

      setArchives((prev) =>
        prev.map((item) =>
          item.id === archiveId ? { ...item, extractedFiles, isExtracted: true } : item
        )
      );
      setProgress(100);
      setTimeout(() => setProgress(0), 1000);
    } catch (error) {
      console.error("Error extracting archive:", error);
      setErrorMessage(error instanceof Error ? error.message : "Could not extract this ZIP archive.");
    }

    setIsProcessing(false);
  };

  const downloadArchive = (archive: ProcessedArchive) => {
    triggerBlobDownload(archive.file, archive.name);
  };

  const removeArchive = (archiveId: string) => {
    setArchives((prev) => {
      const archive = prev.find((item) => item.id === archiveId);
      archive?.extractedFiles?.forEach((file) => {
        revokeObjectUrl(file.url);
      });
      return prev.filter((item) => item.id !== archiveId);
    });
  };

  const removeFileToCompress = (fileId: string) => {
    setFilesToCompress((prev) => prev.filter((file) => file.id !== fileId));
  };

  const downloadExtractedFile = (file: ExtractedFile) => {
    const link = document.createElement("a");
    link.href = file.url;
    link.download = file.name.split("/").at(-1) ?? "download";
    link.click();
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
            Inspect, extract, and create ZIP archives locally in your browser
          </p>
        </div>

        {errorMessage && (
          <div role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {errorMessage}
          </div>
        )}

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
                  Upload ZIP files to inspect and extract their real contents
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  className={cn(
                    "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                    "hover:border-primary/50 hover:bg-primary/5"
                  )}
                  onClick={() => archiveInputRef.current?.click()}
                  role="button"
                  tabIndex={0}
                  aria-label="Choose ZIP archive files"
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      archiveInputRef.current?.click();
                    }
                  }}
                >
                  <Archive className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg font-medium">Upload Archive Files</p>
                  <p className="text-sm text-muted-foreground">
                    Click to select one or more ZIP files
                  </p>
                  <input
                    ref={archiveInputRef}
                    type="file"
                    accept=".zip,application/zip"
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
                                  aria-label={`Download archive ${archive.name}`}
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
                                  aria-label={`Remove archive ${archive.name}`}
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

                        {archive.isExtracted && archive.extractedFiles && (
                          <div className="rounded border p-3">
                            <p className="text-sm font-medium mb-2">Extracted files:</p>
                            <div className="space-y-1 max-h-40 overflow-y-auto">
                              {archive.extractedFiles.map((file) => (
                                <div key={file.name} className="flex items-center gap-2 text-sm">
                                  <File className="h-3 w-3 text-gray-500" />
                                  <span className="flex-1 truncate">{file.name}</span>
                                  <span className="text-muted-foreground">{formatFileSize(file.size)}</span>
                                  <Button size="sm" variant="ghost" onClick={() => downloadExtractedFile(file)} aria-label={`Download extracted file ${file.name}`}>
                                    <Download className="h-3 w-3" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
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
                    role="button"
                    tabIndex={0}
                    aria-label="Choose files to add to archive"
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        filesInputRef.current?.click();
                      }
                    }}
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
                                    aria-label={`Remove ${file.name}`}
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
