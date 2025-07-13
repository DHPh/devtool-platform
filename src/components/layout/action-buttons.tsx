"use client";

import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";

interface ActionButton {
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
  disabled?: boolean;
  variant?:
    | "default"
    | "outline"
    | "destructive"
    | "secondary"
    | "ghost"
    | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

interface ActionButtonsProps {
  buttons: ActionButton[];
  layout?: "horizontal" | "vertical";
  className?: string;
  responsive?: boolean;
}

export function ActionButtons({
  buttons,
  layout = "horizontal",
  className = "",
  responsive = true,
}: ActionButtonsProps) {
  const baseClasses =
    layout === "horizontal" ? "flex gap-2" : "flex flex-col gap-2";

  const responsiveClasses = responsive ? "flex-wrap" : "";

  return (
    <div className={`${baseClasses} ${responsiveClasses} ${className}`}>
      {buttons.map((button, index) => {
        const Icon = button.icon;
        return (
          <Button
            key={index}
            onClick={button.onClick}
            variant={button.variant || "outline"}
            size={button.size || "default"}
            disabled={button.disabled}
            className="flex items-center gap-2"
          >
            {Icon && <Icon className="h-4 w-4" />}
            {button.label}
          </Button>
        );
      })}
    </div>
  );
}
