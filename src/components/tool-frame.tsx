"use client";

import { ReactNode } from "react";
import { writeClipboardText } from "@/hooks/use-clipboard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, StarOff, Share2, Copy } from "lucide-react";
import { useBookmarks } from "@/store/bookmarks";
import { ToolMetadata } from "@/lib/tool-registry";
import { toast } from "sonner";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { getProcessingInfo } from "@/lib/tool-processing";

interface ToolFrameProps {
  tool: ToolMetadata;
  children: ReactNode;
}

export function ToolFrame({ tool, children }: ToolFrameProps) {
  const { isBookmarked, addBookmark, removeBookmark } = useBookmarks();
  const bookmarked = isBookmarked(tool.id);
  const processing = getProcessingInfo(tool.processing);

  const breadcrumbItems = [
    { label: "Tools", href: "/tools" },
    { label: tool.name },
  ];

  const handleBookmark = () => {
    if (bookmarked) {
      removeBookmark(tool.id);
      toast.success("Removed from bookmarks");
    } else {
      addBookmark(tool.id);
      toast.success("Added to bookmarks");
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: tool.name,
          text: tool.description,
          url: url,
        });
      } catch {
        // User cancelled sharing or error occurred
      }
    } else {
      // Fallback to copying URL
      await writeClipboardText(url);
      toast.success("URL copied to clipboard");
    }
  };

  const handleCopyUrl = async () => {
    const url = window.location.href;
    await writeClipboardText(url);
    toast.success("URL copied to clipboard");
  };

  return (
    <div className="w-full px-0 sm:container sm:mx-auto sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
      <div className="px-4 sm:px-0">
        <Breadcrumbs items={breadcrumbItems} />
      </div>
      <Card className="border-0 sm:border shadow-none sm:shadow-sm mx-0 sm:mx-auto">
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-3">
                <span className="text-3xl flex-shrink-0">{tool.icon}</span>
                <div>
                  <CardTitle className="text-2xl">{tool.name}</CardTitle>
                  <CardDescription className="text-base mt-1">
                    {tool.description}
                  </CardDescription>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                <span
                  className="px-2 py-1 text-xs border rounded-md"
                  title={processing.description}
                >
                  {processing.label}
                </span>
                {tool.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 text-xs bg-secondary text-secondary-foreground rounded-md"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 lg:flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBookmark}
                className="gap-1"
              >
                {bookmarked ? (
                  <Star className="h-4 w-4 fill-current" />
                ) : (
                  <StarOff className="h-4 w-4" />
                )}
                {bookmarked ? "Bookmarked" : "Bookmark"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="gap-1"
              >
                <Share2 className="h-4 w-4" />
                Share
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyUrl}
                className="gap-1"
              >
                <Copy className="h-4 w-4" />
                Copy URL
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
          {children}
        </CardContent>
      </Card>
    </div>
  );
}
