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
      green: "bg-green-50 text-green-700 border-green-300",
      red: "bg-red-50 text-red-700 border-red-300",
      blue: "bg-blue-50 text-blue-700 border-blue-300",
      yellow: "bg-yellow-50 text-yellow-700 border-yellow-300",
      gray: "bg-gray-50 text-gray-700 border-gray-300",
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
