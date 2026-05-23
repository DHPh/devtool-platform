"use client";

import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import { writeClipboardText } from "@/hooks/use-clipboard";
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
import { ToolMonogram } from "@/components/ui/tool-badge";
import { getToolMonogram } from "@/lib/tool-visuals";

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
  const isLocalProcessing = targetTool.processing === "client";

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
    <div className="w-full max-w-[var(--workspace-max-w)] mx-auto px-4 sm:px-6 py-4 sm:py-5">
      {/* Keep structured Breadcrumbs JSON-LD for SEO while avoiding duplicate visual header chrome */}
      <div className="sr-only">
        <Breadcrumbs items={breadcrumbItems} />
      </div>

      {/* Compact Flat Workspace Header */}
      <header className="pb-4 mb-5 border-b border-border flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <ToolMonogram
            code={getToolMonogram(targetTool)}
            size="md"
            active
            className="mt-0.5"
          />
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg sm:text-xl font-semibold leading-tight tracking-tight">
                {tool.name}
              </h1>
              <span
                className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-surface-sunken px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
                title={processing.description}
              >
                <span
                  aria-hidden="true"
                  className={`h-1.5 w-1.5 rounded-full ${
                    isLocalProcessing ? "bg-status-ok" : "bg-status-warn"
                  }`}
                />
                {processing.label}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {tool.description}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 lg:shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleBookmark}
            className="h-8 gap-1.5 text-xs bg-surface-sunken"
          >
            {bookmarked ? (
              <Star className="h-3.5 w-3.5 fill-current text-primary" />
            ) : (
              <StarOff className="h-3.5 w-3.5" />
            )}
            {bookmarked ? "Bookmarked" : "Bookmark"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyUrl}
            className="h-8 gap-1.5 text-xs bg-surface-sunken"
          >
            <Copy className="h-3.5 w-3.5" />
            Copy URL
          </Button>
          {canNativeShare && (
            <Button
              variant="outline"
              size="icon"
              onClick={handleNativeShare}
              aria-label="Share tool"
              className="h-8 w-8 bg-surface-sunken"
            >
              <Share2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </header>

      {/* Main Tool Surface */}
      <div>
        {!isStudioTool(tool) && (
          <ToolIoGuide
            inputDescription={tool.inputDescription}
            outputDescription={tool.outputDescription}
            example={tool.example}
          />
        )}
        {children}
        <ToolGlossary toolId={glossaryToolId} />
      </div>
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
