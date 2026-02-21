import type { StudioMetadata, StudioSubToolMetadata } from "@/lib/tool-registry";
import { getToolById, requireStudioSubTool, TOOL_REGISTRY } from "@/lib/tool-registry";

export type StudioIconName =
  | "Accessibility"
  | "Activity"
  | "Archive"
  | "BookOpen"
  | "CheckCircle"
  | "Contrast"
  | "Copy"
  | "Download"
  | "Eye"
  | "File"
  | "FileCode"
  | "FileText"
  | "FolderOpen"
  | "GitCompare"
  | "Globe"
  | "Hash"
  | "Image"
  | "Key"
  | "Layers"
  | "Link"
  | "MapPin"
  | "Palette"
  | "Pipette"
  | "RefreshCw"
  | "Replace"
  | "Search"
  | "Shield"
  | "TestTube"
  | "Wifi"
  | "Wrench"
  | "Zap";

export interface StudioComponentModule {
  default: unknown;
}

export interface StudioTabManifestInput {
  id: string;
  shortLabel: string;
  icon: StudioIconName;
  loadComponent: () => Promise<StudioComponentModule>;
}

export interface StudioTabManifest extends StudioTabManifestInput {
  metadata: StudioSubToolMetadata;
  label: string;
}

export interface StudioManifest {
  id: string;
  directory: string;
  defaultTab: string;
  tabs: readonly StudioTabManifest[];
}

export function defineStudioManifest(
  id: string,
  directory: string,
  inputs: readonly StudioTabManifestInput[],
): StudioManifest {
  const studio = getToolById(id);
  if (!studio || studio.kind !== "studio") {
    throw new Error(`Studio manifest references unknown container "${id}"`);
  }
  if (studio.studioDirectory !== directory) {
    throw new Error(
      `Studio manifest directory "${directory}" does not match registry directory "${studio.studioDirectory}"`,
    );
  }

  const tabs = inputs.map((input) => {
    const metadata = requireStudioSubTool(id, input.id);
    return { ...input, metadata, label: metadata.name };
  });
  const manifestIds = tabs.map((tab) => tab.id);
  const registeredIds = TOOL_REGISTRY.filter(
    (tool): tool is StudioSubToolMetadata =>
      tool.kind === "studio-subtool" && tool.parent === id,
  ).map((tool) => tool.tab);

  if (
    new Set(manifestIds).size !== manifestIds.length ||
    manifestIds.length !== registeredIds.length ||
    registeredIds.some((tab) => !manifestIds.includes(tab))
  ) {
    throw new Error(
      `Studio manifest "${id}" must contain each registered tab exactly once`,
    );
  }

  return { id, directory, defaultTab: tabs[0]?.id ?? "", tabs };
}

export function isStudioMetadata(tool: unknown): tool is StudioMetadata {
  return Boolean(
    tool &&
      typeof tool === "object" &&
      "kind" in tool &&
      tool.kind === "studio",
  );
}
