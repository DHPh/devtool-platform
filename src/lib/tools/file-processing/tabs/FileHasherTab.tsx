"use client";

import { readDroppedFiles } from "../file-drop";

import React, { useState, useRef } from "react";
import { copyToClipboard } from "@/hooks/use-clipboard";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  formatFileSize,
  type FileHashAlgorithm,
} from "@/lib/processors/file-core";
import { hashFileInWorker } from "@/lib/workers/compute-client";

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

function VerifyChecksum() {
  const [file, setFile] = useState<File | null>(null);
  const [expected, setExpected] = useState("");
  const [message, setMessage] = useState("");
  const [statusKind, setStatusKind] = useState<"idle" | "match" | "mismatch" | "error">("idle");
  const [checking, setChecking] = useState(false);
  const verifyInputRef = useRef<HTMLInputElement>(null);
  const revision = useRef(0);

  function resetResult() {
    revision.current++;
    setChecking(false);
    setMessage("");
    setStatusKind("idle");
  }

  function applyDroppedFile(files: FileList | null) {
    const nextFile = files?.[0] ?? null;
    if (!nextFile) return;
    resetResult();
    setFile(nextFile);
  }

  async function verify() {
    if (!file) return;
    const rawExpected = expected.trim();
    const firstToken = rawExpected.split(/\s+/)[0] ?? "";
    const value = firstToken.toLowerCase();
    const lengths: Record<number, FileHashAlgorithm> = { 32: "md5", 40: "sha1", 64: "sha256", 128: "sha512" };
    const algorithm = lengths[value.length];
    if (!algorithm || !/^[0-9a-f]+$/.test(value)) {
      setStatusKind("error");
      setMessage("Enter a hexadecimal MD5, SHA-1, SHA-256 or SHA-512 checksum.");
      return;
    }
    const request = ++revision.current;
    setChecking(true);
    setMessage("");
    setStatusKind("idle");
    try {
      const result = await hashFileInWorker(file, algorithm);
      if (request === revision.current) {
        if (!result.ok) {
          setStatusKind("error");
          setMessage(result.error);
        } else if (result.value.toLowerCase() === value) {
          setStatusKind("match");
          setMessage("Checksums match.");
        } else {
          setStatusKind("mismatch");
          setMessage("Checksums do not match.");
        }
      }
    } catch {
      if (request === revision.current) {
        setStatusKind("error");
        setMessage("Could not read or hash the file.");
      }
    } finally {
      if (request === revision.current) setChecking(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="verify-checksum-file">File to verify</Label>
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
            "hover:border-primary/50 hover:bg-primary/5",
            file && "border-primary/40 bg-primary/5",
          )}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => applyDroppedFile(readDroppedFiles(event))}
          onClick={() => verifyInputRef.current?.click()}
          role="button"
          tabIndex={0}
          aria-label="Choose file to verify checksum"
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              verifyInputRef.current?.click();
            }
          }}
        >
          <Upload className="h-7 w-7 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm font-medium">
            {file ? `${file.name} (${formatFileSize(file.size)})` : "Click to choose or drag and drop a file"}
          </p>
        </div>
        <Input
          id="verify-checksum-file"
          ref={verifyInputRef}
          type="file"
          onChange={(event) => {
            resetResult();
            setFile(event.target.files?.[0] ?? null);
            event.target.value = "";
          }}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="verify-checksum-expected">Expected checksum</Label>
        <Input
          id="verify-checksum-expected"
          className="font-mono"
          placeholder="Paste MD5, SHA-1, SHA-256, SHA-512 hash or sha256sum line"
          value={expected}
          onChange={(event) => {
            resetResult();
            setExpected(event.target.value);
          }}
        />
      </div>
      <Button disabled={!file || !expected.trim() || checking} onClick={() => void verify()}>
        {checking ? "Verifying..." : "Verify checksum"}
      </Button>
      <p
        role="status"
        className={cn(
          "text-sm font-medium min-h-5",
          statusKind === "match" && "text-green-600 dark:text-green-400",
          (statusKind === "mismatch" || statusKind === "error") && "text-destructive",
        )}
      >
        {message}
      </p>
    </div>
  );
}

export default function FileHasherTab() {
  const [files, setFiles] = useState<HashedFile[]>([]);
  const [selectedAlgorithms, setSelectedAlgorithms] = useState<FileHashAlgorithm[]>([
    "sha256",
  ]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [copiedHash, setCopiedHash] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (files: FileList | null) => {
    if (!files) return;

    const newFiles: HashedFile[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      const hashedFile: HashedFile = {
        id: crypto.randomUUID(),
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

        const hashed = await hashFileInWorker(file.file, algorithm);
        if (!hashed.ok) {
          throw new Error(hashed.error);
        }
        hashes[algorithm as keyof HashedFile["hashes"]] = hashed.value;
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

  const needsHashing = (file: HashedFile) =>
    selectedAlgorithms.length > 0 &&
    selectedAlgorithms.some((algo) => !file.hashes[algo]);

  const hashAllFiles = async () => {
    setIsProcessing(true);
    const filesToHash = files.filter((f) => needsHashing(f) && !f.isHashing);

    for (let i = 0; i < filesToHash.length; i++) {
      await hashFile(filesToHash[i].id);
      setProgress(((i + 1) / filesToHash.length) * 100);
    }

    setIsProcessing(false);
    setProgress(0);
  };

  const copyHash = async (hash: string, algorithm: string) => {
    const ok = await copyToClipboard(
      hash,
      `${algorithm.toUpperCase()} hash copied to clipboard`,
    );
    if (ok) {
      setCopiedHash(`${algorithm}:${hash}`);
      setTimeout(() => setCopiedHash(""), 2000);
    }
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
                        <label
                          key={algo.key}
                          className={cn(
                            "border rounded-lg p-3 cursor-pointer transition-colors",
                            selectedAlgorithms.includes(algo.key)
                              ? "border-primary bg-primary/5"
                              : "hover:border-primary/50"
                          )}
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
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* File Upload */}
                  <div
                    className={cn(
                      "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                      "hover:border-primary/50 hover:bg-primary/5"
                    )}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => handleFileSelect(readDroppedFiles(event))}
                    onClick={() => fileInputRef.current?.click()}
                    role="button"
                    tabIndex={0}
                    aria-label="Choose files to hash"
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        fileInputRef.current?.click();
                      }
                    }}
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
                      onChange={(e) => {
                        void handleFileSelect(e.target.files);
                        e.target.value = "";
                      }}
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
                                (f) => Object.keys(f.hashes).length > 0 && !needsHashing(f)
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
                                (f) => needsHashing(f) && !f.isHashing
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
                            {!file.isHashing && needsHashing(file) && (
                              <Button
                                size="sm"
                                onClick={() => hashFile(file.id)}
                                disabled={selectedAlgorithms.length === 0}
                              >
                                <Hash className="h-4 w-4 mr-1" />
                                {Object.keys(file.hashes).length > 0 ? "Re-hash" : "Hash"}
                              </Button>
                            )}
                            {Object.keys(file.hashes).length > 0 && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => exportHashes(file)}
                                    aria-label={`Export hashes for ${file.name}`}
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
                                  aria-label={`Remove ${file.name}`}
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
                <VerifyChecksum />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  );
}
