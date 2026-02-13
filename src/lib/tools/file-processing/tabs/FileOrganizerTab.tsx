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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Upload,
  FolderOpen,
  Download,
  Trash2,
  FileText,
  Image as ImageIcon,
  Music,
  Video,
  Archive,
  Hash,
  Tag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { categorizeFile as categorizeFileName } from "@/lib/processors/file-core";

interface OrganizedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  extension: string;
  lastModified: Date;
  category: string;
  suggestedFolder: string;
  url: string;
  tags: string[];
}

interface OrganizationRule {
  id: string;
  name: string;
  description: string;
  condition: (file: OrganizedFile) => boolean;
  folderName: (file: OrganizedFile) => string;
}

const FILE_CATEGORIES = {
  images: {
    name: "Images",
    icon: ImageIcon,
    extensions: ["jpg", "jpeg", "png", "gif", "bmp", "svg", "webp", "ico"],
    color: "blue",
  },
  documents: {
    name: "Documents",
    icon: FileText,
    extensions: ["pdf", "doc", "docx", "txt", "rtf", "odt", "pages"],
    color: "orange",
  },
  audio: {
    name: "Audio",
    icon: Music,
    extensions: ["mp3", "wav", "flac", "aac", "ogg", "m4a"],
    color: "green",
  },
  video: {
    name: "Video",
    icon: Video,
    extensions: ["mp4", "avi", "mkv", "mov", "wmv", "flv", "webm"],
    color: "red",
  },
  archives: {
    name: "Archives",
    icon: Archive,
    extensions: ["zip", "rar", "7z", "tar", "gz", "bz2"],
    color: "purple",
  },
  other: {
    name: "Other",
    icon: FileText,
    extensions: [],
    color: "gray",
  },
};

const ORGANIZATION_RULES: OrganizationRule[] = [
  {
    id: "by_type",
    name: "By File Type",
    description:
      "Organize files into folders by their type (Images, Documents, etc.)",
    condition: () => true,
    folderName: (file) => file.category,
  },
  {
    id: "by_extension",
    name: "By Extension",
    description: "Organize files into folders by their file extension",
    condition: () => true,
    folderName: (file) => file.extension.toUpperCase(),
  },
  {
    id: "by_date",
    name: "By Date",
    description: "Organize files into folders by their modification date",
    condition: () => true,
    folderName: (file) => {
      const date = file.lastModified;
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
        2,
        "0"
      )}`;
    },
  },
  {
    id: "by_size",
    name: "By Size",
    description: "Organize files into folders by their size",
    condition: () => true,
    folderName: (file) => {
      if (file.size < 1024 * 1024) return "Small (< 1MB)";
      if (file.size < 10 * 1024 * 1024) return "Medium (1-10MB)";
      if (file.size < 100 * 1024 * 1024) return "Large (10-100MB)";
      return "Very Large (> 100MB)";
    },
  },
  {
    id: "hybrid",
    name: "Hybrid (Type + Date)",
    description: "Organize files by type first, then by date within each type",
    condition: () => true,
    folderName: (file) => {
      const date = file.lastModified;
      const yearMonth = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;
      return `${file.category}/${yearMonth}`;
    },
  },
];

export default function FileOrganizerTab() {
  const [files, setFiles] = useState<OrganizedFile[]>([]);
  const [selectedRule, setSelectedRule] = useState<string>("by_type");
  const [organizationPreview, setOrganizationPreview] = useState<{
    [folder: string]: OrganizedFile[];
  }>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const categorizeFile = (file: File): string => {
    return categorizeFileName(file.name);
  };

  const generateTags = (file: File): string[] => {
    const tags: string[] = [];
    const extension = file.name.split(".").pop()?.toLowerCase() || "";
    const category = categorizeFile(file);

    tags.push(category);
    tags.push(extension);

    // Size-based tags
    if (file.size < 1024 * 1024) tags.push("small");
    else if (file.size < 10 * 1024 * 1024) tags.push("medium");
    else tags.push("large");

    // Date-based tags
    const date = new Date(file.lastModified);
    const isRecent = Date.now() - date.getTime() < 7 * 24 * 60 * 60 * 1000;
    if (isRecent) tags.push("recent");

    return tags;
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files) return;

    const newFiles: OrganizedFile[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const extension = file.name.split(".").pop()?.toLowerCase() || "";
      const category = categorizeFile(file);
      const tags = generateTags(file);

      const organizedFile: OrganizedFile = {
        id: Date.now().toString() + i,
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        extension,
        lastModified: new Date(file.lastModified),
        category,
        suggestedFolder: "",
        url: URL.createObjectURL(file),
        tags,
      };

      newFiles.push(organizedFile);
    }

    setFiles((prev) => {
      const updatedFiles = [...prev, ...newFiles];
      updateOrganizationPreview(updatedFiles, selectedRule);
      return updatedFiles;
    });
  };

  const updateOrganizationPreview = (
    fileList: OrganizedFile[],
    ruleId: string
  ) => {
    const rule = ORGANIZATION_RULES.find((r) => r.id === ruleId);
    if (!rule) return;

    const preview: { [folder: string]: OrganizedFile[] } = {};

    fileList.forEach((file) => {
      const folderName = rule.folderName(file);
      if (!preview[folderName]) {
        preview[folderName] = [];
      }
      preview[folderName].push({ ...file, suggestedFolder: folderName });
    });

    setOrganizationPreview(preview);
  };

  const handleRuleChange = (ruleId: string) => {
    setSelectedRule(ruleId);
    updateOrganizationPreview(files, ruleId);
  };

  const downloadOrganizedStructure = () => {
    const structure = Object.entries(organizationPreview)
      .map(([folder, folderFiles]) => {
        return `${folder}/\n${folderFiles
          .map((file) => `  ${file.name} (${formatFileSize(file.size)})`)
          .join("\n")}`;
      })
      .join("\n\n");

    const content = `File Organization Structure\nGenerated on: ${new Date().toLocaleString()}\nRule: ${
      ORGANIZATION_RULES.find((r) => r.id === selectedRule)?.name
    }\n\n${structure}`;

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "file-organization-structure.txt";
    link.click();
    URL.revokeObjectURL(url);
  };

  const removeFile = (fileId: string) => {
    const updatedFiles = files.filter((file) => file.id !== fileId);
    setFiles(updatedFiles);
    updateOrganizationPreview(updatedFiles, selectedRule);
  };

  const getFilesInCategory = (category: string): OrganizedFile[] => {
    return files.filter((file) => file.category === category);
  };

  const getCategoryIcon = (category: string) => {
    const categoryInfo =
      FILE_CATEGORIES[category as keyof typeof FILE_CATEGORIES];
    const Icon = categoryInfo?.icon || FileText;
    return <Icon className="h-5 w-5" />;
  };

  // Helper function for future use
  // const getCategoryColor = (category: string): string => {
  //   const categoryInfo = FILE_CATEGORIES[category as keyof typeof FILE_CATEGORIES];
  //   return categoryInfo?.color || "gray";
  // };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2">File Organizer</h2>
        <p className="text-muted-foreground">
          Organize files by type, date, size, or custom rules
        </p>
      </div>

      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload">Upload & Rules</TabsTrigger>
          <TabsTrigger value="preview">Organization Preview</TabsTrigger>
          <TabsTrigger value="analysis">File Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Upload Files */}
            <Card>
              <CardHeader>
                <CardTitle>Upload Files</CardTitle>
                <CardDescription>Upload files to organize</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
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

                {files.length > 0 && (
                  <div className="space-y-2">
                    <p className="font-medium">
                      Files uploaded: {files.length}
                    </p>
                    <div className="text-sm text-muted-foreground">
                      Total size:{" "}
                      {formatFileSize(
                        files.reduce((sum, file) => sum + file.size, 0)
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Organization Rules */}
            <Card>
              <CardHeader>
                <CardTitle>Organization Rules</CardTitle>
                <CardDescription>
                  Choose how to organize your files
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">
                    Organization Rule
                  </label>
                  <Select value={selectedRule} onValueChange={handleRuleChange}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ORGANIZATION_RULES.map((rule) => (
                        <SelectItem key={rule.id} value={rule.id}>
                          {rule.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedRule && (
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm">
                      {
                        ORGANIZATION_RULES.find((r) => r.id === selectedRule)
                          ?.description
                      }
                    </p>
                  </div>
                )}

                {Object.keys(organizationPreview).length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">
                      Will create {Object.keys(organizationPreview).length}{" "}
                      folders
                    </p>
                    <Button
                      onClick={downloadOrganizedStructure}
                      variant="outline"
                      className="w-full"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Organization Plan
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="preview" className="space-y-6">
          {Object.keys(organizationPreview).length > 0 ? (
            <div className="space-y-4">
              {Object.entries(organizationPreview).map(
                ([folder, folderFiles]) => (
                  <Card key={folder}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <FolderOpen className="h-5 w-5 text-blue-500" />
                          <div>
                            <CardTitle className="text-lg">{folder}</CardTitle>
                            <CardDescription>
                              {folderFiles.length} files •{" "}
                              {formatFileSize(
                                folderFiles.reduce((sum, f) => sum + f.size, 0)
                              )}
                            </CardDescription>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-2 max-h-40 overflow-y-auto">
                        {folderFiles.map((file) => (
                          <div
                            key={file.id}
                            className="flex items-center justify-between p-2 border rounded text-sm"
                          >
                            <div className="flex items-center space-x-2">
                              {getCategoryIcon(file.category)}
                              <span>{file.name}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-muted-foreground">
                                {formatFileSize(file.size)}
                              </span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeFile(file.id)}
                                className="h-6 w-6 p-0"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <FolderOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">
                  Upload files to see organization preview
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analysis" className="space-y-6">
          {files.length > 0 ? (
            <div className="space-y-6">
              {/* File Categories */}
              <Card>
                <CardHeader>
                  <CardTitle>File Categories</CardTitle>
                  <CardDescription>
                    Distribution of files by category
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {Object.entries(FILE_CATEGORIES).map(
                      ([categoryKey, category]) => {
                        const categoryFiles = getFilesInCategory(categoryKey);
                        if (categoryFiles.length === 0) return null;

                        return (
                          <div
                            key={categoryKey}
                            className="flex items-center space-x-3 p-3 border rounded-lg"
                          >
                            <div
                              className={`p-2 rounded-lg bg-${category.color}-100 dark:bg-${category.color}-900`}
                            >
                              {getCategoryIcon(categoryKey)}
                            </div>
                            <div>
                              <p className="font-medium">{category.name}</p>
                              <div className="text-sm text-muted-foreground">
                                <p>{categoryFiles.length} files</p>
                                <p>
                                  {formatFileSize(
                                    categoryFiles.reduce(
                                      (sum, f) => sum + f.size,
                                      0
                                    )
                                  )}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* File Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle>File Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold">{files.length}</p>
                      <p className="text-sm text-muted-foreground">
                        Total Files
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">
                        {formatFileSize(
                          files.reduce((sum, f) => sum + f.size, 0)
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Total Size
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">
                        {new Set(files.map((f) => f.extension)).size}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        File Types
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">
                        {Object.keys(organizationPreview).length}
                      </p>
                      <p className="text-sm text-muted-foreground">Folders</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Common Tags */}
              <Card>
                <CardHeader>
                  <CardTitle>Common Tags</CardTitle>
                  <CardDescription>
                    Most frequent file characteristics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {Array.from(new Set(files.flatMap((f) => f.tags)))
                      .slice(0, 20)
                      .map((tag) => (
                        <Badge key={tag} variant="secondary">
                          <Tag className="h-3 w-3 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Hash className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">
                  Upload files to see analysis
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
