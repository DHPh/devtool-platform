"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { ColorInfo } from "@/lib/utils/color";

interface ColorDisplayProps {
  color: ColorInfo;
  showDetails?: boolean;
  onCopy?: (value: string, format: string) => void;
  onChange?: (color: string) => void;
}

export function ColorDisplay({
  color,
  showDetails = true,
  onCopy,
  onChange,
}: ColorDisplayProps) {
  const handleCopy = (value: string, format: string) => {
    navigator.clipboard.writeText(value);
    toast.success(`${format} copied to clipboard`);
    onCopy?.(value, format);
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Color Information</CardTitle>
          <Badge variant={color.isLight ? "default" : "secondary"}>
            {color.isLight ? "Light" : "Dark"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Color Preview */}
        <div className="relative">
          <div
            className="w-full h-32 rounded-lg border-2 border-border flex items-center justify-center cursor-pointer hover:border-primary transition-colors"
            style={{ backgroundColor: color.hex }}
            onClick={() =>
              onChange &&
              document.getElementById("color-display-picker")?.click()
            }
          >
            <span
              className="text-sm font-medium px-3 py-1 rounded"
              style={{
                color: color.isLight ? "#000000" : "#FFFFFF",
                backgroundColor: color.isLight
                  ? "rgba(255,255,255,0.8)"
                  : "rgba(0,0,0,0.8)",
              }}
            >
              {color.hex}
            </span>
          </div>
          {onChange && (
            <input
              id="color-display-picker"
              type="color"
              value={color.hex}
              onChange={(e) => onChange(e.target.value)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          )}
        </div>

        {showDetails && (
          <div className="space-y-3">
            {/* Color Formats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    HEX
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(color.hex, "HEX")}
                    className="h-6 w-6 p-0"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <div className="font-mono text-sm bg-muted px-2 py-1 rounded">
                  {color.hex}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    RGB
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      handleCopy(
                        `rgb(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b})`,
                        "RGB"
                      )
                    }
                    className="h-6 w-6 p-0"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <div className="font-mono text-sm bg-muted px-2 py-1 rounded">
                  {color.rgb.r}, {color.rgb.g}, {color.rgb.b}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    HSL
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      handleCopy(
                        `hsl(${color.hsl.h}, ${color.hsl.s}%, ${color.hsl.l}%)`,
                        "HSL"
                      )
                    }
                    className="h-6 w-6 p-0"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <div className="font-mono text-sm bg-muted px-2 py-1 rounded">
                  {color.hsl.h}°, {color.hsl.s}%, {color.hsl.l}%
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    CMYK
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      handleCopy(
                        `cmyk(${color.cmyk.c}%, ${color.cmyk.m}%, ${color.cmyk.y}%, ${color.cmyk.k}%)`,
                        "CMYK"
                      )
                    }
                    className="h-6 w-6 p-0"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <div className="font-mono text-sm bg-muted px-2 py-1 rounded">
                  {color.cmyk.c}%, {color.cmyk.m}%, {color.cmyk.y}%,{" "}
                  {color.cmyk.k}%
                </div>
              </div>
            </div>

            {/* Color Properties */}
            <div className="pt-2 border-t">
              <h4 className="text-sm font-medium mb-2">Color Properties</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Luminance:</span>
                  <span className="ml-2 font-medium">
                    {color.luminance.toFixed(3)}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Brightness:</span>
                  <span className="ml-2 font-medium">
                    {color.isLight ? "Light" : "Dark"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
