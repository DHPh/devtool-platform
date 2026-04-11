/**
 * JSON Stats Display Component
 * Reusable component for showing JSON statistics
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { JsonStats } from "@/lib/processors/json";

interface JsonStatsDisplayProps {
  stats: JsonStats;
  className?: string;
}

export function JsonStatsDisplay({ stats, className }: JsonStatsDisplayProps) {
  const statItems = [
    { label: "Size", value: `${stats.size} chars`, color: "default" as const },
    {
      label: "Lines",
      value: stats.lines.toString(),
      color: "secondary" as const,
    },
    {
      label: "Depth",
      value: stats.depth.toString(),
      color: "outline" as const,
    },
    {
      label: "Objects",
      value: stats.objects.toString(),
      color: "default" as const,
    },
    {
      label: "Arrays",
      value: stats.arrays.toString(),
      color: "secondary" as const,
    },
    {
      label: "Strings",
      value: stats.strings.toString(),
      color: "outline" as const,
    },
    {
      label: "Numbers",
      value: stats.numbers.toString(),
      color: "default" as const,
    },
    {
      label: "Booleans",
      value: stats.booleans.toString(),
      color: "secondary" as const,
    },
    {
      label: "Nulls",
      value: stats.nulls.toString(),
      color: "outline" as const,
    },
  ];

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-sm font-medium">JSON Statistics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-2">
          {statItems.map((item) => (
            <div
              key={item.label}
              className="flex flex-col items-center space-y-1"
            >
              <Badge variant={item.color} className="text-xs">
                {item.value}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
