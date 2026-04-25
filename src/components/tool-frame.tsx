"use client";

import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import { writeClipboardText } from "@/hooks/use-clipboard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Share2, Star, StarOff } from "lucide-react";
import { useBookmarks } from "@/store/bookmarks";
import { useRecentTools } from "@/store/recent-tools";
import { isStudioTool, type ToolMetadata } from "@/lib/tool-registry";
import { toast } from "sonner";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { getProcessingInfo } from "@/lib/tool-processing";
import { ToolGlossary } from "@/components/tool-glossary";
import { getToolGlossary } from "@/lib/tool-glossary";
import { ToolIoGuide } from "@/components/tool-io-guide";
import {
  ActiveToolProvider,
  useActiveTool,
} from "@/components/active-tool-context";

interface ToolFrameProps {
  tool: ToolMetadata;
  children: ReactNode;
}

const emptySubscribe = () => () => {};

function ToolFrameInner({ tool, children }: ToolFrameProps) {
  const { isBookmarked, addBookmark, removeBookmark } = useBookmarks();
  const { recordRecentTool } = useRecentTools();
  const activeToolCtx = useActiveTool();
  const activeSubTool = activeToolCtx?.activeSubTool ?? null;

  const hasHydrated = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
  const canNativeShare = useSyncExternalStore(
    emptySubscribe,
    () => typeof navigator !== "undefined" && typeof navigator.share === "function",
    () => false,
  );

  const targetTool = activeSubTool ?? tool;
  const bookmarked = hasHydrated && isBookmarked(targetTool.id);
  const processing = getProcessingInfo(targetTool.processing);

  useEffect(() => {
    recordRecentTool(targetTool.id);
  }, [recordRecentTool, targetTool.id]);

  const breadcrumbItems =
    isStudioTool(tool) && activeSubTool
      ? [
          { label: "Tools", href: "/tools" },
          { label: tool.name, href: tool.path },
          { label: activeSubTool.name },
        ]
      : [{ label: "Tools", href: "/tools" }, { label: tool.name }];

  const glossaryToolId =
    activeSubTool && getToolGlossary(activeSubTool.id).length > 0
      ? activeSubTool.id
      : tool.id;

  const handleBookmark = () => {
    if (isBookmarked(targetTool.id)) {
      removeBookmark(targetTool.id);
      toast.success(`Removed ${targetTool.name} from bookmarks`);
    } else {
      addBookmark(targetTool.id);
      toast.success(`Bookmarked ${targetTool.name}`);
    }
  };

  const handleCopyUrl = async () => {
    try {
      await writeClipboardText(window.location.href);
      toast.success("URL copied to clipboard");
    } catch {
      toast.error("Failed to copy URL");
    }
  };

  const handleNativeShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: targetTool.name,
          text: targetTool.description,
          url,
        });
      } catch {
        // User cancelled native share sheet
      }
    }
  };

  return (
    <div className="w-full px-0 sm:container sm:mx-auto sm:px-4 py-4 sm:py-6 space-y-3 sm:space-y-4">
      <div className="px-4 sm:px-0">
        <Breadcrumbs items={breadcrumbItems} />
      </div>
      <Card className="border-0 sm:border shadow-none sm:shadow-sm mx-0 sm:mx-auto">
        <CardHeader className="p-4 sm:p-6 pb-3 sm:pb-4">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
            <div className="space-y-2 flex-1 min-w-0">
              <div className="flex items-start gap-3">
                <span
                  className="text-2xl sm:text-3xl flex-shrink-0 leading-none mt-0.5"
                  aria-hidden="true"
                >
                  {tool.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <h1 className="text-xl sm:text-2xl font-bold leading-tight tracking-tight">
                    {tool.name}
                  </h1>
                  <CardDescription className="text-sm sm:text-base mt-1">
                    {tool.description}
                  </CardDescription>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span
                  className="px-2 py-0.5 text-xs border rounded-md bg-muted/40 font-medium"
                  title={processing.description}
                >
                  {processing.label}
                </span>
                {tool.tags.slice(0, 5).map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 text-xs bg-secondary text-secondary-foreground rounded-md"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 lg:flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBookmark}
                className="gap-1.5"
              >
                {bookmarked ? (
                  <Star className="h-4 w-4 fill-current text-amber-500" />
                ) : (
                  <StarOff className="h-4 w-4" />
                )}
                {bookmarked ? "Bookmarked" : "Bookmark"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyUrl}
                className="gap-1.5"
              >
                <Copy className="h-4 w-4" />
                Copy URL
              </Button>
              {canNativeShare && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleNativeShare}
                  aria-label="Share tool"
                  className="h-9 w-9"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
          {!isStudioTool(tool) && (
            <ToolIoGuide
              inputDescription={tool.inputDescription}
              outputDescription={tool.outputDescription}
              example={tool.example}
            />
          )}
          {children}
          <ToolGlossary toolId={glossaryToolId} />
        </CardContent>
      </Card>
    </div>
  );
}

export function ToolFrame(props: ToolFrameProps) {
  return (
    <ActiveToolProvider>
      <ToolFrameInner {...props} />
    </ActiveToolProvider>
  );
}
