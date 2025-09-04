"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckboxInput } from "@/components/layout/checkbox-input";
import { Trash2, GripVertical, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";
import { type GradientStop } from "@/lib/utils/color/gradient-generator";
import { getColorInfo } from "@/lib/utils/color";

interface GradientColorStopsProps {
  stops: GradientStop[];
  onStopsChange: (stops: GradientStop[]) => void;
  onColorPick?: (index: number) => void;
  defaultColor?: string;
  title?: string;
  showAddButton?: boolean;
}

export function GradientColorStops({
  stops,
  onStopsChange,
  onColorPick,
  defaultColor = "#000000",
  title = "Gradient Stops",
  showAddButton = true,
}: GradientColorStopsProps) {
  const [keepPositionIndices, setKeepPositionIndices] = useState(true);

  const updateGradientStop = (
    index: number,
    updates: Partial<GradientStop>,
    shouldSort = false
  ) => {
    const newStops = stops.map((stop, i) => 
      i === index ? { ...stop, ...updates } : stop
    );

    if (shouldSort) {
      newStops.sort((a, b) => a.position - b.position);
    }

    onStopsChange(newStops);
  };

  const addColorStop = () => {
    const newPosition =
      stops.length > 0
        ? Math.min(100, Math.max(...stops.map((s) => s.position)) + 20)
        : 50;

    const newStops = [
      ...stops,
      { color: defaultColor, position: newPosition },
    ].sort((a, b) => a.position - b.position);

    onStopsChange(newStops);
  };

  const removeColorStop = (index: number) => {
    if (stops.length > 2) {
      const newStops = stops.filter((_, i) => i !== index);
      onStopsChange(newStops);
    }
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;

    if (sourceIndex === destinationIndex) return;

    // Create new stops array with reordered items
    const newStops = Array.from(stops);
    const [reorderedItem] = newStops.splice(sourceIndex, 1);
    newStops.splice(destinationIndex, 0, reorderedItem);

    let finalStops;
    if (keepPositionIndices) {
      // Store original positions and reassign them to maintain position indices
      const originalPositions = stops.map((stop) => stop.position);
      finalStops = newStops.map((stop, index) => ({
        ...stop,
        position: originalPositions[index],
      }));
      toast.success("Color stops reordered! Positions maintained.");
    } else {
      // Keep positions with their colors (normal drag behavior)
      finalStops = newStops;
      toast.success("Color stops reordered!");
    }

    onStopsChange(finalStops);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{title}</CardTitle>
          {showAddButton && (
            <Button variant="outline" size="sm" onClick={addColorStop}>
              <Plus className="h-4 w-4 mr-2" />
              Add Stop
            </Button>
          )}
        </div>

        {/* Remain Position Index Checkbox */}
        <CheckboxInput
          id="keep-position-indices"
          label="Keep position percentages at original indices when dragging colors"
          checked={keepPositionIndices}
          onChange={(checked) => setKeepPositionIndices(checked)}
          className="pt-2"
        />
      </CardHeader>

      <CardContent>
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="color-stops">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-3"
              >
                {stops.map((stop, index) => (
                  <Draggable
                    key={`stop-${index}`}
                    draggableId={`color-stop-${index}`}
                    index={index}
                  >
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
                              updateGradientStop(index, {
                                color: defaultColor,
                              }, false);
                            }
                            onColorPick?.(index);
                          }}
                          title="Click to open color picker"
                        />

                        {/* Color Input */}
                        <div className="flex-1">
                          <Input
                            type="text"
                            value={stop.color}
                            onChange={(e) =>
                              updateGradientStop(index, {
                                color: e.target.value,
                              }, false) // Don't sort for color changes
                            }
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
                              updateGradientStop(index, {
                                position: Math.max(
                                  0,
                                  Math.min(100, Number(e.target.value))
                                ),
                              }, false) // Don't sort while typing
                            }
                            onBlur={() => {
                              // Sort stops when user finishes editing
                              const sortedStops = [...stops].sort((a, b) => a.position - b.position);
                              onStopsChange(sortedStops);
                            }}
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
                          onClick={() => removeColorStop(index)}
                          disabled={stops.length <= 2}
                          className="h-8 w-8 p-0 flex-shrink-0"
                          title={
                            stops.length > 2
                              ? "Remove color stop"
                              : "Minimum 2 stops required"
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </CardContent>
    </Card>
  );
}
