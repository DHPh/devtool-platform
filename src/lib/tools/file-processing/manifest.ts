import { defineStudioManifest } from "@/lib/studio-manifest";

export const FILE_PROCESSING_STUDIO_MANIFEST = defineStudioManifest(
  "file-processing-studio",
  "file-processing",
  [
    { id: "image-resizer", shortLabel: "Resizer", icon: "Image", loadComponent: () => import("./tabs/ImageResizerTab") },
    { id: "pdf-tools", shortLabel: "PDF", icon: "FileText", loadComponent: () => import("./tabs/PdfToolsTab") },
    { id: "file-converter", shortLabel: "Convert", icon: "RefreshCw", loadComponent: () => import("./tabs/FileConverterTab") },
    { id: "archive-manager", shortLabel: "Archive", icon: "Archive", loadComponent: () => import("./tabs/ArchiveManagerTab") },
    { id: "file-hasher", shortLabel: "Hash", icon: "Hash", loadComponent: () => import("./tabs/FileHasherTab") },
    { id: "metadata-viewer", shortLabel: "Metadata", icon: "Eye", loadComponent: () => import("./tabs/MetadataViewerTab") },
    { id: "duplicate-finder", shortLabel: "Duplicates", icon: "Copy", loadComponent: () => import("./tabs/DuplicateFinderTab") },
    { id: "file-organizer", shortLabel: "Organize", icon: "FolderOpen", loadComponent: () => import("./tabs/FileOrganizerTab") },
    // create-tool:tabs
  ],
);
