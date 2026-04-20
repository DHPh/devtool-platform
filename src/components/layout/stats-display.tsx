"use client";

import { Badge } from "@/components/ui/badge";

interface StatItem {
  label: string;
  value: string | number;
  variant?: "default" | "secondary" | "destructive" | "outline";
  color?: "green" | "red" | "blue" | "yellow" | "gray";
}

interface StatsDisplayProps {
  stats: StatItem[];
  layout?: "horizontal" | "vertical" | "grid";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function StatsDisplay({
  stats,
  layout = "horizontal",
  size = "md",
  className = "",
}: StatsDisplayProps) {
  const containerClasses = {
    horizontal: "flex flex-wrap gap-2",
    vertical: "flex flex-col gap-2",
    grid: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2",
  };

  const sizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  const getColorClasses = (color?: string) => {
    const colorMap = {
      green:
        "bg-green-50 text-green-700 border-green-300 dark:bg-green-950/40 dark:text-green-300 dark:border-green-800",
      red: "bg-red-50 text-red-700 border-red-300 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800",
      blue: "bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
      yellow:
        "bg-yellow-50 text-yellow-700 border-yellow-300 dark:bg-yellow-950/40 dark:text-yellow-300 dark:border-yellow-800",
      gray: "bg-muted text-muted-foreground border-border",
    };
    return color ? colorMap[color as keyof typeof colorMap] : "";
  };

  return (
    <div className={`${containerClasses[layout]} ${className}`}>
      {stats.map((stat, index) => (
        <Badge
          key={index}
          variant={stat.variant || "outline"}
          className={`${sizeClasses[size]} ${getColorClasses(stat.color)}`}
        >
          {stat.label}: {stat.value}
        </Badge>
      ))}
    </div>
  );
}
