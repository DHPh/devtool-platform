"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, GripVertical } from "lucide-react";
import { Draggable } from "@hello-pangea/dnd";
import { type GradientStop } from "@/lib/utils/color/gradient-generator";
import { getColorInfo } from "@/lib/utils/color";

interface GradientColorStopProps {
  stop: GradientStop;
  index: number;
  onUpdate: (updates: Partial<GradientStop>) => void;
  onRemove: () => void;
  onColorPick: () => void;
  canRemove: boolean;
  defaultColor: string;
}

export function GradientColorStop({
  stop,
  index,
  onUpdate,
  onRemove,
  onColorPick,
  canRemove,
  defaultColor,
}: GradientColorStopProps) {
  return (
    <Draggable draggableId={`color-stop-${index}`} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`flex items-center gap-3 p-3 bg-muted rounded-lg transition-colors ${
            snapshot.isDragging
              ? "bg-primary/10 shadow-lg scale-105"
              : "hover:bg-muted/80"
          }`}
        >
          {/* Drag Handle */}
          <div
            {...provided.dragHandleProps}
            className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors"
          >
            <GripVertical className="h-4 w-4" />
          </div>

          {/* Color Preview Button */}
          <button
            className="w-8 h-8 rounded border-2 border-border hover:border-primary transition-colors flex-shrink-0"
            style={{ backgroundColor: stop.color }}
            onClick={() => {
              if (!getColorInfo(stop.color)) {
                onUpdate({ color: defaultColor });
              }
              onColorPick();
            }}
            title="Click to open color picker"
          />

          {/* Color Input */}
          <div className="flex-1">
            <Input
              type="text"
              value={stop.color}
              onChange={(e) => onUpdate({ color: e.target.value })}
              placeholder="#000000"
              className="h-8"
              title="Enter color hex code"
            />
          </div>

          {/* Position Input */}
          <div className="w-20">
            <Input
              type="number"
              value={stop.position}
              onChange={(e) =>
                onUpdate({
                  position: Math.max(0, Math.min(100, Number(e.target.value))),
                })
              }
              min={0}
              max={100}
              className="h-8"
              title="Position percentage"
            />
          </div>
          <span className="text-xs text-muted-foreground">%</span>

          {/* Remove Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            disabled={!canRemove}
            className="h-8 w-8 p-0 flex-shrink-0"
            title={canRemove ? "Remove color stop" : "Minimum 2 stops required"}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )}
    </Draggable>
  );
}
