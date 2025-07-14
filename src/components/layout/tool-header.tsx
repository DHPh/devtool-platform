"use client";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LucideIcon } from "lucide-react";

interface ToolHeaderAction {
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
}

interface ToolHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  badge?: {
    text: string;
    variant?: "default" | "secondary" | "destructive" | "outline";
  };
  actions?: ToolHeaderAction[];
  className?: string;
  children?: React.ReactNode;
}

export function ToolHeader({
  title,
  description,
  icon: Icon,
  badge,
  actions = [],
  className = "",
  children,
}: ToolHeaderProps) {
  return (
    <Card className={`border-0 sm:border shadow-none sm:shadow-sm ${className}`}>
      <CardHeader className="px-3 sm:px-6 py-3 sm:py-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            {Icon && (
              <div className="p-2 bg-primary/10 rounded-md mt-1">
                <Icon className="h-5 w-5 text-primary" />
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <CardTitle className="text-xl">{title}</CardTitle>
                {badge && (
                  <Badge variant={badge.variant || "secondary"}>
                    {badge.text}
                  </Badge>
                )}
              </div>
              {description && (
                <CardDescription className="text-base">
                  {description}
                </CardDescription>
              )}
            </div>
          </div>

          {/* Action buttons */}
          {actions.length > 0 && (
            <div className="flex gap-2 ml-4">
              {actions.map((action, index) => {
                const ActionIcon = action.icon;
                return (
                  <Button
                    key={index}
                    onClick={action.onClick}
                    variant={action.variant || "outline"}
                    size="sm"
                    disabled={action.disabled}
                  >
                    {ActionIcon && <ActionIcon className="h-4 w-4 mr-2" />}
                    {action.label}
                  </Button>
                );
              })}
            </div>
          )}
        </div>

        {/* Custom children content */}
        {children && <div className="mt-4">{children}</div>}
      </CardHeader>
    </Card>
  );
}
