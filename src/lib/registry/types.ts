import type { ComponentType } from "react";
import type { ToolType } from "@/lib/tool-classification";

export interface ToolMetadata {
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
  parent?: string;
}

export interface Tool {
  metadata: ToolMetadata;
  component: ComponentType;
}
