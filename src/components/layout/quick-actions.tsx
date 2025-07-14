"use client";

import { Button } from "@/components/ui/button";
import {
  Trash2,
  FileText,
  Play,
  RefreshCw,
  Upload,
  Download,
  Copy,
  Settings,
  Zap,
  LucideIcon,
} from "lucide-react";

interface QuickAction {
  id: string;
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
  variant?:
    | "default"
    | "outline"
    | "destructive"
    | "secondary"
    | "ghost"
    | "link";
  disabled?: boolean;
  tooltip?: string;
}

interface QuickActionsProps {
  actions: QuickAction[];
  layout?: "horizontal" | "vertical" | "grid";
  size?: "default" | "sm" | "lg";
  className?: string;
  showLabels?: boolean;
}

export function QuickActions({
  actions,
  layout = "horizontal",
  size = "default",
  className = "",
  showLabels = true,
}: QuickActionsProps) {
  const getLayoutClasses = () => {
    const baseClasses = "gap-2";
    switch (layout) {
      case "vertical":
        return `flex flex-col ${baseClasses}`;
      case "grid":
        return `grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 ${baseClasses}`;
      default:
        return `flex flex-wrap ${baseClasses}`;
    }
  };

  return (
    <div className={`${getLayoutClasses()} ${className}`}>
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <Button
            key={action.id}
            onClick={action.onClick}
            variant={action.variant || "outline"}
            size={size}
            disabled={action.disabled}
            title={action.tooltip}
            className="flex items-center gap-2 min-h-[44px] flex-1 sm:flex-initial justify-center"
          >
            {Icon && <Icon className="h-4 w-4" />}
            {showLabels && action.label}
          </Button>
        );
      })}
    </div>
  );
}

// Pre-defined common actions
export const CommonActions = {
  clearAll: (onClick: () => void): QuickAction => ({
    id: "clear-all",
    label: "Clear All",
    icon: Trash2,
    onClick,
    variant: "outline" as const,
  }),

  loadSample: (onClick: () => void): QuickAction => ({
    id: "load-sample",
    label: "Load Sample",
    icon: FileText,
    onClick,
    variant: "outline" as const,
  }),

  process: (onClick: () => void, label = "Process"): QuickAction => ({
    id: "process",
    label,
    icon: Play,
    onClick,
    variant: "default" as const,
  }),

  refresh: (onClick: () => void): QuickAction => ({
    id: "refresh",
    label: "Refresh",
    icon: RefreshCw,
    onClick,
    variant: "outline" as const,
  }),

  upload: (onClick: () => void): QuickAction => ({
    id: "upload",
    label: "Upload",
    icon: Upload,
    onClick,
    variant: "outline" as const,
  }),

  download: (onClick: () => void, disabled = false): QuickAction => ({
    id: "download",
    label: "Download",
    icon: Download,
    onClick,
    variant: "outline" as const,
    disabled,
  }),

  copy: (onClick: () => void, disabled = false): QuickAction => ({
    id: "copy",
    label: "Copy",
    icon: Copy,
    onClick,
    variant: "outline" as const,
    disabled,
  }),

  settings: (onClick: () => void): QuickAction => ({
    id: "settings",
    label: "Settings",
    icon: Settings,
    onClick,
    variant: "ghost" as const,
  }),

  generate: (onClick: () => void, label = "Generate"): QuickAction => ({
    id: "generate",
    label,
    icon: Zap,
    onClick,
    variant: "default" as const,
  }),
};

// Pre-built action groups for common tool patterns
export const ActionGroups = {
  // For formatter tools
  formatter: (
    onFormat: () => void,
    onClear: () => void,
    onLoadSample: () => void,
    hasOutput = false
  ): QuickAction[] => [
    CommonActions.process(onFormat, "Format"),
    CommonActions.clearAll(onClear),
    CommonActions.loadSample(onLoadSample),
    CommonActions.copy(() => {}, !hasOutput),
  ],

  // For generator tools
  generator: (
    onGenerate: () => void,
    onCopy: () => void,
    onClear: () => void,
    hasOutput = false
  ): QuickAction[] => [
    CommonActions.generate(onGenerate),
    CommonActions.copy(onCopy, !hasOutput),
    CommonActions.clearAll(onClear),
  ],

  // For validator tools
  validator: (
    onValidate: () => void,
    onClear: () => void,
    onLoadSample: () => void
  ): QuickAction[] => [
    CommonActions.process(onValidate, "Validate"),
    CommonActions.clearAll(onClear),
    CommonActions.loadSample(onLoadSample),
  ],

  // For converter tools
  converter: (
    onConvert: () => void,
    onClear: () => void,
    onCopy: () => void,
    hasOutput = false
  ): QuickAction[] => [
    CommonActions.process(onConvert, "Convert"),
    CommonActions.copy(onCopy, !hasOutput),
    CommonActions.clearAll(onClear),
  ],
};
