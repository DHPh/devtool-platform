"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ToolFrameAction {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?:
    | "default"
    | "outline"
    | "destructive"
    | "secondary"
    | "ghost"
    | "link";
}

interface ToolFrameProps {
  title: string;
  description: string;
  children: React.ReactNode;
  actions?: ToolFrameAction[];
  className?: string;
}

export function ToolFrame({
  title,
  description,
  children,
  actions = [],
  className = "",
}: ToolFrameProps) {
  // Calculate minimum width needed for buttons
  const getMinButtonWidth = () => {
    if (actions.length === 0) return 0;
    if (actions.length === 1) return 100;
    if (actions.length === 2) return 180;
    if (actions.length === 3) return 260;
    return actions.length * 85; // Fallback for more buttons
  };

  const minButtonWidth = getMinButtonWidth();

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between min-h-[2.5rem]">
          <span>{title}</span>
          <div
            className="flex items-center gap-2"
            style={{
              minWidth: minButtonWidth > 0 ? `${minButtonWidth}px` : undefined,
            }}
          >
            {actions.map((action, index) => (
              <Button
                key={index}
                onClick={action.onClick}
                variant={action.variant || "outline"}
                size="sm"
                disabled={action.disabled}
                className="flex items-center gap-2"
              >
                {action.icon}
                {action.label}
              </Button>
            ))}
          </div>
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

// Convenience component for two-column layout (common pattern)
interface TwoColumnToolLayoutProps {
  leftTitle: string;
  leftDescription: string;
  leftActions?: ToolFrameAction[];
  leftChildren: React.ReactNode;
  rightTitle: string;
  rightDescription: string;
  rightActions?: ToolFrameAction[];
  rightChildren: React.ReactNode;
  className?: string;
}

export function TwoColumnToolLayout({
  leftTitle,
  leftDescription,
  leftActions,
  leftChildren,
  rightTitle,
  rightDescription,
  rightActions,
  rightChildren,
  className = "",
}: TwoColumnToolLayoutProps) {
  return (
    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 ${className}`}>
      <ToolFrame
        title={leftTitle}
        description={leftDescription}
        actions={leftActions}
      >
        {leftChildren}
      </ToolFrame>
      <ToolFrame
        title={rightTitle}
        description={rightDescription}
        actions={rightActions}
      >
        {rightChildren}
      </ToolFrame>
    </div>
  );
}
