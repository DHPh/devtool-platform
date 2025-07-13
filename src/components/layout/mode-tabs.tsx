"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ModeTabOption {
  value: string;
  label: string;
  description?: string;
}

interface ModeTabsProps {
  value: string;
  onValueChange: (value: string) => void;
  options: ModeTabOption[];
  className?: string;
}

export function ModeTabs({
  value,
  onValueChange,
  options,
  className = "",
}: ModeTabsProps) {
  return (
    <Tabs value={value} onValueChange={onValueChange} className={className}>
      <TabsList className={`grid w-full grid-cols-${options.length}`}>
        {options.map((option) => (
          <TabsTrigger key={option.value} value={option.value}>
            {option.label}
          </TabsTrigger>
        ))}
      </TabsList>

      {options.map((option) => (
        <TabsContent
          key={option.value}
          value={option.value}
          className="space-y-4"
        >
          {option.description && (
            <div className="text-sm text-muted-foreground">
              {option.description}
            </div>
          )}
        </TabsContent>
      ))}
    </Tabs>
  );
}
