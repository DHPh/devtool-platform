"use client";

import React, { useRef, useState } from "react";
import { Download, Eye, Image as ImageIcon, Info, Music, Trash2, Upload, Video } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  basicFileMetadata,
  effectiveFileType,
  extractFileMetadata,
  fileCategory,
  validateMetadataFile,
  type ExtractedFileMetadata,
} from "@/lib/processors/file-capabilities";
import { cn } from "@/lib/utils";

interface MetadataEntry {
  id: string;
  file: File;
  metadata: ExtractedFileMetadata;
  isLoading: boolean;
  error?: string;
}

function categoryIcon(category: ReturnType<typeof fileCategory>) {
  if (category === "image") return <ImageIcon className="h-5 w-5" />;
  if (category === "audio") return <Music className="h-5 w-5" />;
  if (category === "video") return <Video className="h-5 w-5" />;
  return <Info className="h-5 w-5" />;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const units = ["Bytes", "KB", "MB", "GB"];
  const unit = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${parseFloat((bytes / 1024 ** unit).toFixed(2))} ${units[unit]}`;
}

function metadataRows(metadata: Record<string, unknown>) {
  return Object.entries(metadata).map(([key, value]) => (
    <div key={key} className="space-y-1">
      <dt className="text-sm font-medium text-muted-foreground capitalize">{key.replace(/([A-Z])/g, " $1").trim()}</dt>
      <dd className="text-sm font-mono break-all">{String(value)}</dd>
    </div>
  ));
}

export default function MetadataViewerTab() {
  const [files, setFiles] = useState<MetadataEntry[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectedFile = files.find((file) => file.id === selectedId) ?? null;

  const handleFileSelect = async (selection: FileList | null) => {
    if (!selection) return;
    const entries = Array.from(selection).map((file, index): MetadataEntry => {
      const error = validateMetadataFile(file);
      return {
        id: `${Date.now()}-${index}-${file.name}`,
        file,
        metadata: { basic: basicFileMetadata(file) },
        isLoading: !error,
        error: error ?? undefined,
      };
    });
    setFiles((current) => [...current, ...entries]);
    if (!selectedId && entries[0]) setSelectedId(entries[0].id);
    if (fileInputRef.current) fileInputRef.current.value = "";

    for (const entry of entries.filter((file) => file.isLoading)) {
      try {
        const metadata = await extractFileMetadata(entry.file);
        setFiles((current) => current.map((file) => file.id === entry.id ? { ...file, metadata, isLoading: false } : file));
      } catch (error) {
        setFiles((current) => current.map((file) => file.id === entry.id
          ? { ...file, isLoading: false, error: error instanceof Error ? error.message : "Metadata extraction failed." }
          : file));
      }
    }
  };

  const removeFile = (id: string) => {
    setFiles((current) => current.filter((file) => file.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const exportMetadata = (entry: MetadataEntry) => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(entry.metadata, null, 2)], { type: "application/json" }));
    try {
      const link = document.createElement("a");
      link.href = url;
      link.download = `${entry.file.name}.metadata.json`;
      link.click();
    } finally {
      URL.revokeObjectURL(url);
    }
  };

  return <TooltipProvider><div className="space-y-6">
    <Card><CardHeader><CardTitle className="flex items-center"><Eye className="h-5 w-5 mr-2" />Metadata Viewer</CardTitle><CardDescription>View browser-provided file facts and intrinsic image or media properties.</CardDescription></CardHeader><CardContent>
      <div className={cn("border-2 border-dashed rounded-lg p-6 cursor-pointer transition-colors", "hover:border-primary/50")} onClick={() => fileInputRef.current?.click()} role="button" tabIndex={0} aria-label="Choose files to inspect metadata" onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); fileInputRef.current?.click(); } }}>
        <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(event) => handleFileSelect(event.target.files)} />
        <div className="text-center"><Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" /><p className="text-sm">Click to select files</p><p className="text-xs text-muted-foreground mt-1">Maximum 100 MB per file. Image dimensions and browser-readable audio/video properties are extracted locally.</p><p className="text-xs text-muted-foreground">EXIF, embedded tags, and document page counts are not parsed.</p></div>
      </div>
    </CardContent></Card>

    {files.length > 0 && <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card><CardHeader><CardTitle>Files ({files.length})</CardTitle></CardHeader><CardContent><div className="space-y-2 max-h-96 overflow-y-auto">{files.map((entry) => (
        <div key={entry.id} className={cn("flex items-center justify-between p-3 rounded-lg border", selectedId === entry.id && "bg-primary/5 border-primary/30")}>
          <div className="flex items-center gap-3 min-w-0"><div className="text-muted-foreground">{categoryIcon(fileCategory(effectiveFileType(entry.file)))}</div><div className="min-w-0"><p className="text-sm font-medium truncate">{entry.file.name}</p><p className="text-xs text-muted-foreground">{formatFileSize(entry.file.size)} • {entry.file.type || "Unknown type"}</p>{entry.isLoading && <p className="text-xs text-blue-600">Reading intrinsic metadata…</p>}{entry.error && <Badge variant="destructive" className="mt-1 text-xs">{entry.error}</Badge>}</div></div>
          <div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => setSelectedId(entry.id)} aria-pressed={selectedId === entry.id}>View metadata</Button>{!entry.isLoading && <Tooltip><TooltipTrigger asChild><Button size="sm" variant="outline" onClick={() => exportMetadata(entry)} aria-label={`Export metadata for ${entry.file.name}`}><Download className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>Export verified metadata as JSON</TooltipContent></Tooltip>}<Tooltip><TooltipTrigger asChild><Button size="sm" variant="outline" onClick={() => removeFile(entry.id)} aria-label={`Remove ${entry.file.name}`}><Trash2 className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>Remove file</TooltipContent></Tooltip></div>
        </div>
      ))}</div></CardContent></Card>

      <Card><CardHeader><CardTitle>Metadata</CardTitle></CardHeader><CardContent>{selectedFile ? <div className="space-y-4 max-h-96 overflow-y-auto">
        <Card><CardHeader className="pb-3"><CardTitle className="text-lg">Basic Information</CardTitle></CardHeader><CardContent><dl className="grid grid-cols-1 md:grid-cols-2 gap-3">{metadataRows(selectedFile.metadata.basic)}</dl></CardContent></Card>
        {selectedFile.metadata.image && <Card><CardHeader className="pb-3"><CardTitle className="text-lg">Image Properties</CardTitle></CardHeader><CardContent><dl className="grid grid-cols-2 gap-3">{metadataRows(selectedFile.metadata.image)}</dl></CardContent></Card>}
        {selectedFile.metadata.audio && <Card><CardHeader className="pb-3"><CardTitle className="text-lg">Audio Properties</CardTitle></CardHeader><CardContent><dl>{metadataRows(selectedFile.metadata.audio)}</dl></CardContent></Card>}
        {selectedFile.metadata.video && <Card><CardHeader className="pb-3"><CardTitle className="text-lg">Video Properties</CardTitle></CardHeader><CardContent><dl className="grid grid-cols-2 gap-3">{metadataRows(selectedFile.metadata.video)}</dl></CardContent></Card>}
      </div> : <div className="text-center text-muted-foreground py-8"><Eye className="h-12 w-12 mx-auto mb-4 opacity-50" /><p>Select a file to view its metadata</p></div>}</CardContent></Card>
    </div>}
  </div></TooltipProvider>;
}
