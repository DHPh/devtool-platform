"use client";

import { readDroppedFiles } from "../file-drop";

import React, { useState, useRef } from "react";
import { useObjectUrls } from "@/hooks/use-object-urls";
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
import {
  formatFileSize,
  groupDuplicateFiles,
} from "@/lib/processors/file-core";
import { hashFileInWorker } from "@/lib/workers/compute-client";

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
  error?: string;
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

  const scanVersion = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { createObjectUrl, revokeObjectUrl } = useObjectUrls();

  const handleFileSelect = async (files: FileList | null) => {
    if (!files) return;

    const newFiles: DuplicateFile[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      const duplicateFile: DuplicateFile = {
        id: crypto.randomUUID(),
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        hash: "",
        lastModified: new Date(file.lastModified),
        url: createObjectUrl(file),
        selected: false,
      };

      newFiles.push(duplicateFile);
    }

    scanVersion.current++;
    setIsScanning(false);
    setSelectedFiles([]);
    setDuplicateGroups([]);
    setFiles((prev) => [...prev, ...newFiles]);
  };

  const scanForDuplicates = async () => {
    if (files.length === 0) return;

    const version = ++scanVersion.current;
    setIsScanning(true);
    setProgress(0);
    setDuplicateGroups([]);

    // Generate hashes for all files
    const filesWithHashes: DuplicateFile[] = [];

    for (let i = 0; i < files.length; i++) {
      if (version !== scanVersion.current) return;
      const file = files[i];
      setProgress((i / files.length) * 50); // First 50% for hashing

      try {
        const hashed = await hashFileInWorker(file.file, "sha256");
        if (!hashed.ok) {
          throw new Error(hashed.error);
        }
        filesWithHashes.push({ ...file, hash: hashed.value, error: undefined });
      } catch (error) {
        console.error("Error hashing file:", error);
        filesWithHashes.push({
          ...file,
          hash: "",
          error: error instanceof Error ? error.message : "Hash generation failed",
        });
      }
    }

    if (version !== scanVersion.current) return;
    setFiles(filesWithHashes);

    const groupedFiles = groupDuplicateFiles(
      filesWithHashes.filter((file) => file.hash),
    );
    const duplicateGroups: DuplicateGroup[] = groupedFiles.map((groupFiles) => {
      const sortedFiles = [...groupFiles].sort((a, b) => a.name.localeCompare(b.name));
      const totalSize = sortedFiles.reduce((sum, file) => sum + file.size, 0);

      return {
        hash: sortedFiles[0].hash,
        files: sortedFiles,
        totalSize,
        wastedSpace: totalSize - sortedFiles[0].size,
      };
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

  const removeSelectedFiles = () => {
    files
      .filter((file) => selectedFiles.includes(file.id))
      .forEach((file) => revokeObjectUrl(file.url));
    const remainingFiles = files.filter(
      (file) => !selectedFiles.includes(file.id)
    );
    setFiles(remainingFiles);
    setSelectedFiles([]);

    // Recalculate duplicate groups
    const updatedGroups = duplicateGroups
      .map((group) => {
        const groupFiles = group.files.filter(
          (file) => !selectedFiles.includes(file.id),
        );
        const totalSize = groupFiles.reduce((total, file) => total + file.size, 0);
        return {
          ...group,
          files: groupFiles,
          totalSize,
          wastedSpace: totalSize - (groupFiles[0]?.size ?? 0),
        };
      })
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
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => handleFileSelect(readDroppedFiles(event))}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              aria-label="Choose files to scan for duplicates"
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
                Click to select or drag and drop files to scan
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={(e) => {
                  handleFileSelect(e.target.files);
                  e.target.value = "";
                }}
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
            {!isScanning && files.some((file) => file.error) && (
              <div className="space-y-1 text-sm text-red-600">
                <p className="font-medium">
                  {files.filter((file) => file.error).length} file(s) could not be hashed:
                </p>
                {files
                  .filter((file) => file.error)
                  .map((file) => (
                    <p key={file.id}>
                      {file.name}: {file.error}
                    </p>
                  ))}
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
                        {formatFileSize(getSelectedFileSize())} selected in this scan
                      </p>
                    </div>
                    <Button
                      onClick={removeSelectedFiles}
                      variant="destructive"
                      className="w-full mt-3"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remove from scan
                    </Button>
                  </div>
                )}
              </div>
            ) : files.some((file) => file.error) && !isScanning ? (
              <div className="py-8 text-center text-red-600">
                <AlertTriangle className="mx-auto mb-4 h-10 w-10" />
                <p className="font-medium">Scan incomplete</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Retry the files that could not be hashed before relying on the result.
                </p>
              </div>
            ) : files.length > 0 && files.every((file) => file.hash) && !isScanning ? (
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
                <p>{isScanning ? "Scanning files…" : files.length ? "Run the scan to compare these files." : "Upload files to start scanning for duplicates."}</p>
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
                          aria-label={`Preview ${file.name}`}
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
