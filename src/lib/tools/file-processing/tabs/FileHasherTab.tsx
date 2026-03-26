"use client";

import React, { useState, useRef } from "react";
import { writeClipboardText } from "@/hooks/use-clipboard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Upload,
  Hash,
  Copy,
  Check,
  Shield,
  Trash2,
  FileText,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  hashFileContent,
  type FileHashAlgorithm,
} from "@/lib/processors";

interface HashedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  hashes: {
    md5?: string;
    sha1?: string;
    sha256?: string;
    sha512?: string;
  };
  isHashing: boolean;
  error?: string;
}

const HASH_ALGORITHMS = [
  { key: "md5", name: "MD5", description: "128-bit hash (legacy)" },
  { key: "sha1", name: "SHA-1", description: "160-bit hash (legacy)" },
  { key: "sha256", name: "SHA-256", description: "256-bit hash (recommended)" },
  { key: "sha512", name: "SHA-512", description: "512-bit hash (most secure)" },
] as const;

export default function FileHasherTab() {
  const [files, setFiles] = useState<HashedFile[]>([]);
  const [selectedAlgorithms, setSelectedAlgorithms] = useState<FileHashAlgorithm[]>([
    "sha256",
  ]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [copiedHash, setCopiedHash] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files) return;

    const newFiles: HashedFile[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      const hashedFile: HashedFile = {
        id: Date.now().toString() + i,
        file,
        name: file.name,
        size: file.size,
        hashes: {},
        isHashing: false,
      };

      newFiles.push(hashedFile);
    }

    setFiles((prev) => [...prev, ...newFiles]);
  };

  const hashFile = async (fileId: string) => {
    const file = files.find((f) => f.id === fileId);
    if (!file) return;

    setFiles((prev) =>
      prev.map((f) =>
        f.id === fileId ? { ...f, isHashing: true, hashes: {} } : f
      )
    );

    const hashes: HashedFile["hashes"] = {};

    try {
      for (let i = 0; i < selectedAlgorithms.length; i++) {
        const algorithm = selectedAlgorithms[i];
        setProgress((i / selectedAlgorithms.length) * 100);

        const hash = await hashFileContent(
          file.file,
          algorithm,
        );
        hashes[algorithm as keyof HashedFile["hashes"]] = hash;
      }

      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileId
            ? { ...f, isHashing: false, hashes, error: undefined }
            : f
        )
      );
    } catch (err) {
      console.error("Hash generation error:", err);
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileId
            ? { ...f, isHashing: false, error: "Hash generation failed" }
            : f
        )
      );
    }

    setProgress(0);
  };

  const hashAllFiles = async () => {
    setIsProcessing(true);
    const filesToHash = files.filter(
      (f) => Object.keys(f.hashes).length === 0 && !f.isHashing
    );

    for (let i = 0; i < filesToHash.length; i++) {
      await hashFile(filesToHash[i].id);
      setProgress(((i + 1) / filesToHash.length) * 100);
    }

    setIsProcessing(false);
    setProgress(0);
  };

  const copyHash = (hash: string, algorithm: string) => {
    void writeClipboardText(hash);
    setCopiedHash(`${algorithm}:${hash}`);
    setTimeout(() => setCopiedHash(""), 2000);
  };

  const exportHashes = (file: HashedFile) => {
    const hashData = Object.entries(file.hashes)
      .filter(([, hash]) => hash)
      .map(([algorithm, hash]) => `${algorithm.toUpperCase()}: ${hash}`)
      .join("\n");

    const content = `File: ${file.name}\nSize: ${formatFileSize(
      file.size
    )}\n\nHashes:\n${hashData}`;

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${file.name}.hashes.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const removeFile = (fileId: string) => {
    setFiles((prev) => prev.filter((file) => file.id !== fileId));
  };

  const toggleAlgorithm = (algorithm: FileHashAlgorithm) => {
    setSelectedAlgorithms((prev) =>
      prev.includes(algorithm)
        ? prev.filter((a) => a !== algorithm)
        : [...prev, algorithm]
    );
  };

  // Helper function for future hash verification feature
  // const verifyHash = (inputHash: string, fileHash: string): boolean => {
  //   return inputHash.toLowerCase().trim() === fileHash.toLowerCase().trim();
  // };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-2">File Hasher</h2>
          <p className="text-muted-foreground">
            Generate and verify file checksums using various hash algorithms
          </p>
        </div>

        <Tabs defaultValue="generate" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="generate">Generate Hashes</TabsTrigger>
            <TabsTrigger value="verify">Verify Hashes</TabsTrigger>
          </TabsList>

          <TabsContent value="generate" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Upload & Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Upload Files & Settings</CardTitle>
                  <CardDescription>
                    Upload files and select hash algorithms
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Algorithm Selection */}
                  <div>
                    <h4 className="font-medium mb-3">Hash Algorithms</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {HASH_ALGORITHMS.map((algo) => (
                        <div
                          key={algo.key}
                          className={cn(
                            "border rounded-lg p-3 cursor-pointer transition-colors",
                            selectedAlgorithms.includes(algo.key)
                              ? "border-primary bg-primary/5"
                              : "hover:border-primary/50"
                          )}
                          onClick={() => toggleAlgorithm(algo.key)}
                        >
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={selectedAlgorithms.includes(algo.key)}
                              onChange={() => toggleAlgorithm(algo.key)}
                              className="rounded"
                            />
                            <div>
                              <p className="font-medium text-sm">{algo.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {algo.description}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
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

                  {/* Hash All Button */}
                  {files.length > 0 && (
                    <Button
                      onClick={hashAllFiles}
                      disabled={isProcessing || selectedAlgorithms.length === 0}
                      className="w-full"
                    >
                      <Hash className="h-4 w-4 mr-2" />
                      {isProcessing ? "Hashing All Files..." : "Hash All Files"}
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Processing Status</CardTitle>
                  <CardDescription>Track file hashing progress</CardDescription>
                </CardHeader>
                <CardContent>
                  {files.length > 0 ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-green-600">
                            {
                              files.filter(
                                (f) => Object.keys(f.hashes).length > 0
                              ).length
                            }
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Completed
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-blue-600">
                            {files.filter((f) => f.isHashing).length}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Processing
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-gray-600">
                            {
                              files.filter(
                                (f) =>
                                  Object.keys(f.hashes).length === 0 &&
                                  !f.isHashing
                              ).length
                            }
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Pending
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-red-600">
                            {files.filter((f) => f.error).length}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Failed
                          </p>
                        </div>
                      </div>

                      {(isProcessing || files.some((f) => f.isHashing)) && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span>{Math.round(progress)}%</span>
                          </div>
                          <Progress value={progress} className="w-full" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground">
                      <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
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
                        className="border rounded-lg p-4 space-y-4"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <FileText className="h-8 w-8 text-blue-500" />
                            <div>
                              <p className="font-medium">{file.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {formatFileSize(file.size)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {!file.isHashing &&
                              Object.keys(file.hashes).length === 0 && (
                                <Button
                                  size="sm"
                                  onClick={() => hashFile(file.id)}
                                  disabled={selectedAlgorithms.length === 0}
                                >
                                  <Hash className="h-4 w-4 mr-1" />
                                  Hash
                                </Button>
                              )}
                            {Object.keys(file.hashes).length > 0 && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => exportHashes(file)}
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Export hashes</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => removeFile(file.id)}
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

                        {file.isHashing && (
                          <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">
                              Generating hashes...
                            </p>
                            <Progress value={progress} className="w-full" />
                          </div>
                        )}

                        {file.error && (
                          <div className="text-sm text-red-600 bg-red-50 dark:bg-red-950 p-2 rounded">
                            {file.error}
                          </div>
                        )}

                        {Object.keys(file.hashes).length > 0 && (
                          <div className="space-y-3">
                            {Object.entries(file.hashes).map(
                              ([algorithm, hash]) =>
                                hash && (
                                  <div key={algorithm} className="space-y-2">
                                    <div className="flex items-center justify-between">
                                      <Badge variant="secondary">
                                        {algorithm.toUpperCase()}
                                      </Badge>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() =>
                                              copyHash(hash, algorithm)
                                            }
                                            className="h-6 p-1"
                                          >
                                            {copiedHash ===
                                            `${algorithm}:${hash}` ? (
                                              <Check className="h-3 w-3 text-green-500" />
                                            ) : (
                                              <Copy className="h-3 w-3" />
                                            )}
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>
                                            {copiedHash ===
                                            `${algorithm}:${hash}`
                                              ? "Copied!"
                                              : "Copy hash"}
                                          </p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </div>
                                    <div className="bg-muted rounded p-2 font-mono text-xs break-all">
                                      {hash}
                                    </div>
                                  </div>
                                )
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="verify" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Hash Verification</CardTitle>
                <CardDescription>
                  Upload a file and compare its hash with a known value
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center text-muted-foreground py-8">
                  <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Hash verification feature coming soon...</p>
                  <p className="text-sm mt-2">
                    This will allow you to verify file integrity by comparing
                    generated hashes with known good values.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  );
}
