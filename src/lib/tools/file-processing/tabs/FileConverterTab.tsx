"use client";

import React, { useEffect, useRef, useState } from "react";
import { AlertCircle, CheckCircle, Download, FileText, RefreshCw, Trash2, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useObjectUrls } from "@/hooks/use-object-urls";
import { formatFileSize } from "@/lib/processors/file-core";
import {
  convertFileContent,
  effectiveFileType,
  getConversionTargets,
  validateConverterFile,
  type ConversionTarget,
} from "@/lib/processors/file-capabilities";
import { cn } from "@/lib/utils";

interface ConversionFile {
  id: string;
  file: File;
  status: "pending" | "converting" | "completed" | "error";
  targetFormat: ConversionTarget;
  convertedUrl?: string;
  error?: string;
}

export default function FileConverterTab() {
  const [files, setFiles] = useState<ConversionFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const filesRef = useRef(files);
  const { createObjectUrl, revokeObjectUrl } = useObjectUrls();

  useEffect(() => {
    filesRef.current = files;
  }, [files]);

  const handleFileSelect = (selection: FileList | null) => {
    if (!selection) return;
    const added = Array.from(selection).map((file, index): ConversionFile => {
      const targets = getConversionTargets(file);
      const error = validateConverterFile(file);
      return {
        id: `${crypto.randomUUID()}-${index}`,
        file,
        status: error ? "error" : "pending",
        targetFormat: targets[0]?.value ?? "txt",
        error: error ?? undefined,
      };
    });
    setFiles((current) => [...current, ...added]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const convertFile = async (fileId: string) => {
    const entry = filesRef.current.find((file) => file.id === fileId);
    if (!entry || entry.status === "error") return;
    setFiles((current) => current.map((file) => file.id === fileId ? { ...file, status: "converting", error: undefined } : file));

    try {
      const blob = await convertFileContent(entry.file, entry.targetFormat);
      const convertedUrl = createObjectUrl(blob);

      setFiles((current) => current.map((file) => {
        if (file.id !== fileId) return file;
        revokeObjectUrl(file.convertedUrl);
        return { ...file, status: "completed", convertedUrl };
      }));
    } catch (error) {
      setFiles((current) => current.map((file) => file.id === fileId
        ? { ...file, status: "error", error: error instanceof Error ? error.message : "Conversion failed." }
        : file));
    }
  };

  const convertAllFiles = async () => {
    setIsProcessing(true);
    for (const file of filesRef.current.filter((entry) => entry.status === "pending")) await convertFile(file.id);
    setIsProcessing(false);
  };

  const removeFile = (fileId: string) => {
    setFiles((current) => {
      const removed = current.find((file) => file.id === fileId);
      revokeObjectUrl(removed?.convertedUrl);
      return current.filter((file) => file.id !== fileId);
    });
  };

  const downloadFile = (entry: ConversionFile) => {
    if (!entry.convertedUrl) return;
    const link = document.createElement("a");
    link.href = entry.convertedUrl;
    const baseName = entry.file.name.replace(/\.[^.]*$/, "") || entry.file.name;
    link.download = `${baseName}.${entry.targetFormat === "jpeg" ? "jpg" : entry.targetFormat}`;
    link.click();
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-2">File Converter</h2>
          <p className="text-muted-foreground">Convert JPEG, PNG, and WebP images, or switch between plain text and JSON.</p>
          <p className="text-xs text-muted-foreground mt-2">Runs locally. Maximum file size: 25 MB. Animated images, documents, audio, and video are not supported.</p>
        </div>

        <Card>
          <CardHeader><CardTitle>Upload & Convert</CardTitle><CardDescription>Each file only shows formats this browser converter can produce.</CardDescription></CardHeader>
          <CardContent className="space-y-6">
            <div className={cn("border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors", "hover:border-primary/50 hover:bg-primary/5")} onClick={() => fileInputRef.current?.click()} role="button" tabIndex={0} aria-label="Choose files to convert" onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); fileInputRef.current?.click(); } }}>
              <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium">Upload Files</p>
              <p className="text-sm text-muted-foreground">JPEG, PNG, WebP, TXT, or JSON</p>
              <input ref={fileInputRef} type="file" multiple accept="image/jpeg,image/png,image/webp,text/plain,application/json,.txt,.json" onChange={(event) => handleFileSelect(event.target.files)} className="hidden" />
            </div>
            {files.some((file) => file.status === "pending") && <Button onClick={convertAllFiles} disabled={isProcessing} className="w-full">{isProcessing ? "Converting..." : "Convert All Files"}</Button>}
          </CardContent>
        </Card>

        {files.length > 0 && <Card>
          <CardHeader><CardTitle>Files ({files.length})</CardTitle></CardHeader>
          <CardContent><div className="space-y-4">{files.map((entry) => (
            <div key={entry.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {entry.status === "completed" ? <CheckCircle className="h-4 w-4 text-green-500" /> : entry.status === "error" ? <AlertCircle className="h-4 w-4 text-red-500" /> : <RefreshCw className={cn("h-4 w-4 text-muted-foreground", entry.status === "converting" && "animate-spin")} />}
                  <div className="min-w-0"><p className="font-medium truncate">{entry.file.name}</p><p className="text-sm text-muted-foreground">{formatFileSize(entry.file.size)} • {effectiveFileType(entry.file)}</p></div>
                </div>
                <Badge variant={entry.status === "error" ? "destructive" : "secondary"}>{entry.status}</Badge>
              </div>
              {entry.error && <p className="text-sm text-red-600 bg-red-50 dark:bg-red-950 p-2 rounded">{entry.error}</p>}
              <div className="flex items-end justify-between gap-3">
                <div><Label className="text-xs">Target Format</Label><Select value={entry.targetFormat} onValueChange={(value: ConversionTarget) => setFiles((current) => current.map((file) => file.id === entry.id ? { ...file, targetFormat: value } : file))} disabled={entry.status !== "pending" || getConversionTargets(entry.file).length === 0}><SelectTrigger className="w-36 h-8" aria-label={`Target format for ${entry.file.name}`}><SelectValue /></SelectTrigger><SelectContent>{getConversionTargets(entry.file).map((format) => <SelectItem key={format.value} value={format.value}>{format.label}</SelectItem>)}</SelectContent></Select></div>
                <div className="flex gap-2">
                  {entry.status === "pending" && <Button size="sm" onClick={() => convertFile(entry.id)}><RefreshCw className="h-4 w-4 mr-1" />Convert</Button>}
                  {entry.status === "completed" && <Tooltip><TooltipTrigger asChild><Button size="sm" variant="outline" onClick={() => downloadFile(entry)} aria-label={`Download converted ${entry.file.name}`}><Download className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>Download converted file</TooltipContent></Tooltip>}
                  <Tooltip><TooltipTrigger asChild><Button size="sm" variant="outline" onClick={() => removeFile(entry.id)} disabled={entry.status === "converting"} aria-label={`Remove ${entry.file.name}`}><Trash2 className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>Remove file</TooltipContent></Tooltip>
                </div>
              </div>
            </div>
          ))}</div></CardContent>
        </Card>}
        {files.length === 0 && <div className="text-center text-muted-foreground"><FileText className="h-10 w-10 mx-auto mb-2 opacity-50" /><p>No files uploaded yet</p></div>}
      </div>
    </TooltipProvider>
  );
}
