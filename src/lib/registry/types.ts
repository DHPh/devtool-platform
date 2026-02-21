import type { ComponentType } from "react";
import type { ToolType } from "@/lib/tool-classification";

export type ProcessingMode = "client" | "server" | "hybrid";

interface ToolMetadataBase {
  id: string;
  name: string;
  description: string;
  category: string;
  type: ToolType;
  types?: ToolType[];
  tags: string[];
  path: string;
  icon?: string;
  featured?: boolean;
  complexity?: "simple" | "intermediate" | "advanced";
}

export interface StandaloneToolMetadata extends ToolMetadataBase {
  kind: "standalone";
  processing: ProcessingMode;
  parent?: never;
  tab?: never;
  studioDirectory?: never;
}

export interface StudioMetadata extends ToolMetadataBase {
  kind: "studio";
  processing: ProcessingMode;
  studioDirectory: string;
  parent?: never;
  tab?: never;
}

export interface StudioSubToolMetadata extends ToolMetadataBase {
  kind: "studio-subtool";
  processing: ProcessingMode;
  parent: string;
  tab: string;
}

export type ToolMetadata =
  | StandaloneToolMetadata
  | StudioMetadata
  | StudioSubToolMetadata;

export type ToolComponentLoader = () => Promise<{
  default: ComponentType;
}>;

export interface StandaloneToolDefinition extends StandaloneToolMetadata {
  loadComponent: ToolComponentLoader;
}

export interface StudioDefinition extends StudioMetadata {
  loadComponent: ToolComponentLoader;
}

export type ToolDefinition =
  | StandaloneToolDefinition
  | StudioDefinition
  | StudioSubToolMetadata;

// Backward-compatible public name for consumers of the original contract.
export type Tool = ToolDefinition;
