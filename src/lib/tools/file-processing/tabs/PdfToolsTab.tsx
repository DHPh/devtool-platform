"use client";

import { readDroppedFiles } from "../file-drop";

import React, { useState, useRef } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowDown,
  ArrowUp,
  Upload,
  Download,
  FileText,
  Scissors,
  Merge,
  RotateCw,
  Trash2,
  Eye,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { triggerBlobDownload, useObjectUrls } from "@/hooks/use-object-urls";
import { formatFileSize } from "@/lib/processors/file-core";
import {
  extractPdfPageRanges,
  getPdfPageCount,
  mergePdfFiles,
  rotatePdfPages,
  splitPdfPages,
} from "@/lib/processors/pdf-core";

interface PDFFile {
  id: string;
  file: File;
  name: string;
  size: number;
  pageCount?: number;
  url: string;
}

export default function PdfToolsTab() {
  const [pdfFiles, setPdfFiles] = useState<PDFFile[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [splitRange, setSplitRange] = useState("");
  const [rotationAngle, setRotationAngle] = useState<90 | 180 | 270>(90);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { createObjectUrl, revokeObjectUrl } = useObjectUrls();

  const handleFileSelect = async (files: FileList | null) => {
    if (!files) return;

    setIsProcessing(true);
    const newFiles: PDFFile[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const isPdf =
        file.type === "application/pdf" ||
        file.name.toLowerCase().endsWith(".pdf");
      if (!isPdf) continue;

      let pageCount: number | undefined;
      try {
        pageCount = await getPdfPageCount(file);
      } catch {
        pageCount = undefined;
      }

      const pdfFile: PDFFile = {
        id: crypto.randomUUID(),
        file,
        name: file.name,
        size: file.size,
        pageCount,
        url: createObjectUrl(file),
      };

      newFiles.push(pdfFile);
    }

    setPdfFiles((prev) => [...prev, ...newFiles]);
    setIsProcessing(false);
  };

  const moveFile = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= pdfFiles.length) return;
    setPdfFiles((prev) => {
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const toggleFileSelection = (fileId: string) => {
    setSelectedFiles((prev) =>
      prev.includes(fileId)
        ? prev.filter((id) => id !== fileId)
        : [...prev, fileId]
    );
  };

  const removeFile = (fileId: string) => {
    setPdfFiles((prev) => {
      const removed = prev.find((file) => file.id === fileId);
      revokeObjectUrl(removed?.url);
      return prev.filter((file) => file.id !== fileId);
    });
    setSelectedFiles((prev) => prev.filter((id) => id !== fileId));
  };

  const downloadFile = (file: PDFFile) => {
    const link = document.createElement("a");
    link.href = file.url;
    link.download = file.name;
    link.click();
  };

  const mergePDFs = async () => {
    if (selectedFiles.length < 2) return;

    setIsProcessing(true);
    try {
      const selectedPdfFiles = pdfFiles.filter((file) =>
        selectedFiles.includes(file.id)
      );
      const mergedPdfBytes = await mergePdfFiles(
        selectedPdfFiles.map((entry) => entry.file),
      );
      const blob = new Blob([new Uint8Array(mergedPdfBytes)], {
        type: "application/pdf",
      });
      triggerBlobDownload(blob, "merged.pdf");
      toast.success("Merged PDF downloaded successfully.");
    } catch (error) {
      console.error("Error merging PDFs:", error);
      toast.error(
        "Error merging PDFs. Please make sure all files are valid PDF documents."
      );
    }
    setIsProcessing(false);
  };

  const splitPDF = async (fileId: string) => {
    const file = pdfFiles.find((f) => f.id === fileId);
    if (!file) return;

    setIsProcessing(true);
    try {
      const baseName = file.name.replace(/\.pdf$/i, "");
      if (splitRange.trim()) {
        const extracted = await extractPdfPageRanges(file.file, splitRange.trim());
        const blob = new Blob([new Uint8Array(extracted)], {
          type: "application/pdf",
        });
        triggerBlobDownload(blob, `${baseName}_pages.pdf`);
        toast.success("Extracted selected pages into a PDF.");
      } else {
        const pages = await splitPdfPages(file.file);
        if (pages.length === 1) {
          const blob = new Blob([new Uint8Array(pages[0])], {
            type: "application/pdf",
          });
          triggerBlobDownload(blob, `${baseName}_page_1.pdf`);
        } else {
          const { default: JSZip } = await import("jszip");
          const zip = new JSZip();
          pages.forEach((pageBytes, index) => {
            zip.file(`${baseName}_page_${index + 1}.pdf`, pageBytes);
          });
          const zipBlob = await zip.generateAsync({ type: "blob" });
          triggerBlobDownload(zipBlob, `${baseName}_pages.zip`);
        }
        toast.success(`Successfully split PDF (${pages.length} pages).`);
      }
    } catch (error) {
      console.error("Error splitting PDF:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Error splitting PDF. Please make sure it's a valid PDF document.",
      );
    }
    setIsProcessing(false);
  };

  const rotatePDF = async (fileId: string, rotation: number = rotationAngle) => {
    const file = pdfFiles.find((f) => f.id === fileId);
    if (!file) return;

    setIsProcessing(true);
    try {
      const rotatedPdfBytes = await rotatePdfPages(file.file, rotation);
      const blob = new Blob([new Uint8Array(rotatedPdfBytes)], {
        type: "application/pdf",
      });
      triggerBlobDownload(
        blob,
        `${file.name.replace(/\.pdf$/i, "")}_rotated_${rotation}deg.pdf`,
      );
      toast.success(`Rotated PDF by ${rotation}° downloaded successfully.`);
    } catch (error) {
      console.error("Error rotating PDF:", error);
      toast.error("Error rotating PDF. Please make sure it's a valid PDF document.");
    }
    setIsProcessing(false);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2">PDF Tools</h2>
        <p className="text-muted-foreground">
          Merge, split, rotate, and manage PDF documents
        </p>
      </div>

      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="merge">Merge</TabsTrigger>
          <TabsTrigger value="split">Split</TabsTrigger>
          <TabsTrigger value="rotate">Rotate</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload PDF Files</CardTitle>
              <CardDescription>
                Upload PDF files to start processing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className={cn(
                  "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                  "hover:border-primary/50 hover:bg-primary/5"
                )}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => void handleFileSelect(readDroppedFiles(event))}
                onClick={() => fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                aria-label="Choose PDF files"
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
              >
                <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium">Upload PDF Files</p>
                <p className="text-sm text-muted-foreground">
                  Click to select or drag and drop PDF files
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  multiple
                  onChange={(e) => {
                    void handleFileSelect(e.target.files);
                    e.target.value = "";
                  }}
                  className="hidden"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="merge" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Merge PDFs</CardTitle>
              <CardDescription>
                Select multiple PDFs and use the ↑ / ↓ buttons below to arrange merge order
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">
                    Selected: {selectedFiles.length} files
                  </p>
                  <Button
                    onClick={mergePDFs}
                    disabled={selectedFiles.length < 2 || isProcessing}
                  >
                    <Merge className="h-4 w-4 mr-2" />
                    {isProcessing ? "Merging..." : "Merge PDFs"}
                  </Button>
                </div>
                {selectedFiles.length < 2 && (
                  <p className="text-sm text-amber-600">
                    Select at least 2 PDFs to merge
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="split" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Split PDFs</CardTitle>
              <CardDescription>
                Extract specific page ranges or package every page into a single ZIP archive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2 max-w-md">
                <Label htmlFor="pdf-split-range">Page range (optional)</Label>
                <Input
                  id="pdf-split-range"
                  value={splitRange}
                  onChange={(e) => setSplitRange(e.target.value)}
                  placeholder="e.g. 1-3, 5 (blank = ZIP all pages)"
                  className="font-mono"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Click the split button on any PDF below to run with this setting.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rotate" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Rotate PDFs</CardTitle>
              <CardDescription>
                Choose a clockwise rotation angle, then click Rotate on any PDF below
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {([90, 180, 270] as const).map((angle) => (
                  <Button
                    key={angle}
                    type="button"
                    variant={rotationAngle === angle ? "default" : "outline"}
                    size="sm"
                    onClick={() => setRotationAngle(angle)}
                  >
                    Rotate +{angle}°
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* PDF Files List */}
      {pdfFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>PDF Files ({pdfFiles.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pdfFiles.map((file, index) => (
                <div
                  key={file.id}
                  className={cn(
                    "border rounded-lg p-4 transition-colors",
                    selectedFiles.includes(file.id)
                      ? "border-primary bg-primary/5"
                      : "hover:border-primary/50"
                  )}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center space-x-4">
                      <label
                        className="flex items-center space-x-2 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedFiles.includes(file.id)}
                          onChange={() => toggleFileSelection(file.id)}
                          className="rounded"
                        />
                        <FileText className="h-8 w-8 text-red-500" />
                      </label>
                      <div>
                        <p className="font-medium">{file.name}</p>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span>{formatFileSize(file.size)}</span>
                          {file.pageCount !== undefined && (
                            <span>{file.pageCount} {file.pageCount === 1 ? "page" : "pages"}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center flex-wrap gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={index === 0}
                        onClick={() => moveFile(index, -1)}
                        aria-label={`Move ${file.name} up`}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={index === pdfFiles.length - 1}
                        onClick={() => moveFile(index, 1)}
                        aria-label={`Move ${file.name} down`}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(file.url, "_blank")}
                        aria-label={`Preview ${file.name}`}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => splitPDF(file.id)}
                        disabled={isProcessing}
                        aria-label={`Split ${file.name}`}
                      >
                        <Scissors className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => rotatePDF(file.id, rotationAngle)}
                        disabled={isProcessing}
                        aria-label={`Rotate ${file.name} clockwise`}
                        title={`Rotate +${rotationAngle}°`}
                      >
                        <RotateCw className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadFile(file)}
                        aria-label={`Download ${file.name}`}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removeFile(file.id)}
                        aria-label={`Remove ${file.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
