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
import { Progress } from "@/components/ui/progress";
import {
  Upload,
  Copy,
  Trash2,
  Search,
  AlertTriangle,
  HardDrive,
  FileText,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DuplicateFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  hash: string;
  lastModified: Date;
  url: string;
  selected: boolean;
}

interface DuplicateGroup {
  hash: string;
  files: DuplicateFile[];
  totalSize: number;
  wastedSpace: number;
}

export default function DuplicateFinderTab() {
  const [files, setFiles] = useState<DuplicateFile[]>([]);
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([]);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Simple hash generation (in production, use crypto.subtle or crypto-js)
  const generateFileHash = async (file: File): Promise<string> => {
    // Simulate hash generation based on file content
    const content = await file.arrayBuffer();
    const hash = Array.from(new Uint8Array(content))
      .slice(0, 32) // Use first 32 bytes for demo
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return hash;
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files) return;

    const newFiles: DuplicateFile[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      const duplicateFile: DuplicateFile = {
        id: Date.now().toString() + i,
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        hash: "",
        lastModified: new Date(file.lastModified),
        url: URL.createObjectURL(file),
        selected: false,
      };

      newFiles.push(duplicateFile);
    }

    setFiles((prev) => [...prev, ...newFiles]);
  };

  const scanForDuplicates = async () => {
    if (files.length === 0) return;

    setIsScanning(true);
    setProgress(0);
    setDuplicateGroups([]);

    // Generate hashes for all files
    const filesWithHashes: DuplicateFile[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setProgress((i / files.length) * 50); // First 50% for hashing

      try {
        const hash = await generateFileHash(file.file);
        filesWithHashes.push({ ...file, hash });
      } catch (error) {
        console.error("Error hashing file:", error);
        filesWithHashes.push({ ...file, hash: "error" });
      }
    }

    setFiles(filesWithHashes);

    // Group files by hash
    const hashGroups: { [hash: string]: DuplicateFile[] } = {};

    filesWithHashes.forEach((file) => {
      if (file.hash && file.hash !== "error") {
        if (!hashGroups[file.hash]) {
          hashGroups[file.hash] = [];
        }
        hashGroups[file.hash].push(file);
      }
    });

    // Filter groups with duplicates
    const duplicateGroups: DuplicateGroup[] = [];

    Object.entries(hashGroups).forEach(([hash, groupFiles], index) => {
      setProgress(50 + (index / Object.keys(hashGroups).length) * 50); // Second 50% for grouping

      if (groupFiles.length > 1) {
        const totalSize = groupFiles.reduce((sum, file) => sum + file.size, 0);
        const wastedSpace = totalSize - groupFiles[0].size; // Size that could be saved

        duplicateGroups.push({
          hash,
          files: groupFiles.sort((a, b) => a.name.localeCompare(b.name)),
          totalSize,
          wastedSpace,
        });
      }
    });

    setDuplicateGroups(
      duplicateGroups.sort((a, b) => b.wastedSpace - a.wastedSpace)
    );
    setIsScanning(false);
    setProgress(0);
  };

  const toggleFileSelection = (fileId: string) => {
    setSelectedFiles((prev) =>
      prev.includes(fileId)
        ? prev.filter((id) => id !== fileId)
        : [...prev, fileId]
    );
  };

  const selectAllInGroup = (
    group: DuplicateGroup,
    keepFirst: boolean = true
  ) => {
    const filesToSelect = keepFirst ? group.files.slice(1) : group.files;
    const fileIds = filesToSelect.map((f) => f.id);

    setSelectedFiles((prev) => {
      const filtered = prev.filter(
        (id) => !group.files.some((f) => f.id === id)
      );
      return [...filtered, ...fileIds];
    });
  };

  const selectAllDuplicates = (keepFirst: boolean = true) => {
    const allDuplicateIds: string[] = [];

    duplicateGroups.forEach((group) => {
      const filesToSelect = keepFirst ? group.files.slice(1) : group.files;
      allDuplicateIds.push(...filesToSelect.map((f) => f.id));
    });

    setSelectedFiles(allDuplicateIds);
  };

  const deleteSelectedFiles = () => {
    const remainingFiles = files.filter(
      (file) => !selectedFiles.includes(file.id)
    );
    setFiles(remainingFiles);
    setSelectedFiles([]);

    // Recalculate duplicate groups
    const updatedGroups = duplicateGroups
      .map((group) => ({
        ...group,
        files: group.files.filter((file) => !selectedFiles.includes(file.id)),
      }))
      .filter((group) => group.files.length > 1);

    setDuplicateGroups(updatedGroups);
  };

  const getTotalWastedSpace = (): number => {
    return duplicateGroups.reduce(
      (total, group) => total + group.wastedSpace,
      0
    );
  };

  const getSelectedFileSize = (): number => {
    return files
      .filter((file) => selectedFiles.includes(file.id))
      .reduce((total, file) => total + file.size, 0);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2">Duplicate Finder</h2>
        <p className="text-muted-foreground">
          Find and remove duplicate files to free up storage space
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upload & Scan */}
        <Card>
          <CardHeader>
            <CardTitle>Upload & Scan</CardTitle>
            <CardDescription>
              Upload files to scan for duplicates
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
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
                Click to select or drag and drop files to scan
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={(e) => handleFileSelect(e.target.files)}
                className="hidden"
              />
            </div>

            {/* Scan Button */}
            {files.length > 0 && (
              <Button
                onClick={scanForDuplicates}
                disabled={isScanning}
                className="w-full"
              >
                <Search className="h-4 w-4 mr-2" />
                {isScanning
                  ? "Scanning..."
                  : `Scan ${files.length} Files for Duplicates`}
              </Button>
            )}

            {/* Progress */}
            {isScanning && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Scanning for duplicates...</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="w-full" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Scan Results</CardTitle>
            <CardDescription>Summary of duplicate files found</CardDescription>
          </CardHeader>
          <CardContent>
            {duplicateGroups.length > 0 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-600">
                      {duplicateGroups.length}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Duplicate Groups
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-orange-600">
                      {duplicateGroups.reduce(
                        (sum, group) => sum + group.files.length,
                        0
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Duplicate Files
                    </p>
                  </div>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <HardDrive className="h-5 w-5 text-red-500" />
                    <p className="text-lg font-bold text-red-600">
                      {formatFileSize(getTotalWastedSpace())}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Wasted Storage Space
                  </p>
                </div>

                {selectedFiles.length > 0 && (
                  <div className="border-t pt-4">
                    <div className="text-center">
                      <p className="font-medium">
                        {selectedFiles.length} files selected
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatFileSize(getSelectedFileSize())} will be freed
                      </p>
                    </div>
                    <Button
                      onClick={deleteSelectedFiles}
                      variant="destructive"
                      className="w-full mt-3"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Selected Files
                    </Button>
                  </div>
                )}
              </div>
            ) : files.length > 0 && !isScanning ? (
              <div className="text-center text-green-600 py-8">
                <div className="text-4xl mb-4">🎉</div>
                <p className="font-medium">No Duplicates Found!</p>
                <p className="text-sm text-muted-foreground mt-2">
                  All {files.length} files are unique.
                </p>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <Copy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Upload files to start scanning for duplicates</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      {duplicateGroups.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => selectAllDuplicates(true)}
              >
                Select All Duplicates (Keep First)
              </Button>
              <Button
                variant="outline"
                onClick={() => selectAllDuplicates(false)}
              >
                Select All Duplicates
              </Button>
              <Button variant="outline" onClick={() => setSelectedFiles([])}>
                Clear Selection
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Duplicate Groups */}
      {duplicateGroups.length > 0 && (
        <div className="space-y-4">
          {duplicateGroups.map((group, groupIndex) => (
            <Card key={group.hash}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      Duplicate Group {groupIndex + 1}
                    </CardTitle>
                    <CardDescription>
                      {group.files.length} identical files •{" "}
                      {formatFileSize(group.wastedSpace)} wasted space
                    </CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => selectAllInGroup(group, true)}
                    >
                      Select Duplicates
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => selectAllInGroup(group, false)}
                    >
                      Select All
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {group.files.map((file, fileIndex) => (
                    <div
                      key={file.id}
                      className={cn(
                        "flex items-center justify-between p-3 border rounded-lg",
                        selectedFiles.includes(file.id)
                          ? "border-red-300 bg-red-50 dark:bg-red-950 dark:border-red-800"
                          : fileIndex === 0
                          ? "border-green-300 bg-green-50 dark:bg-green-950 dark:border-green-800"
                          : "border-gray-200 dark:border-gray-700"
                      )}
                    >
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={selectedFiles.includes(file.id)}
                          onChange={() => toggleFileSelection(file.id)}
                          className="rounded"
                        />
                        <FileText className="h-5 w-5 text-gray-500" />
                        <div>
                          <p className="font-medium text-sm">{file.name}</p>
                          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                            <span>{formatFileSize(file.size)}</span>
                            <span>
                              {file.lastModified.toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {fileIndex === 0 && (
                          <Badge variant="default" className="bg-green-600">
                            Original
                          </Badge>
                        )}
                        {fileIndex > 0 && (
                          <Badge variant="destructive">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Duplicate
                          </Badge>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => window.open(file.url, "_blank")}
                          className="h-6 w-6 p-0"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
