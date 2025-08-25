import { Metadata } from "next";
import { ToolFrame } from "@/components/tool-frame";
import { getToolById } from "@/lib/tool-registry";
import FileProcessingStudio from "@/lib/tools/file-processing/FileProcessingStudio";

export const metadata: Metadata = {
  title: "File Processing Studio | DevTool Platform",
  description:
    "Complete file processing toolkit with image resizing, PDF tools, file conversion, archive management, hashing, metadata viewing, duplicate finding, and file organization.",
  keywords: [
    "file processing",
    "image resizer",
    "pdf tools",
    "file converter",
    "archive manager",
    "file hasher",
    "metadata viewer",
    "duplicate finder",
    "file organizer",
    "file management",
    "batch processing",
  ],
  openGraph: {
    title: "File Processing Studio | DevTool Platform",
    description:
      "Professional file processing tools for image editing, document management, and file organization.",
    type: "website",
  },
};

export default function FileProcessingPage() {
  const tool = getToolById("file-processing-studio");

  if (!tool) {
    return <div>Tool not found</div>;
  }

  return (
    <ToolFrame tool={tool}>
      <FileProcessingStudio />
    </ToolFrame>
  );
}
