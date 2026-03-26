"use client";

import React from "react";
import { writeClipboardText } from "@/hooks/use-clipboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Download } from "lucide-react";
import { toast } from "sonner";
import { ColorPalette } from "@/lib/utils/color";

interface PaletteDisplayProps {
  palette: ColorPalette;
  onColorSelect?: (color: string) => void;
  showExport?: boolean;
}

export function PaletteDisplay({
  palette,
  onColorSelect,
  showExport = true,
}: PaletteDisplayProps) {
  const handleCopyColor = (color: string) => {
    void writeClipboardText(color);
    toast.success(`${color} copied to clipboard`);
  };

  const handleCopyPalette = () => {
    const paletteText = palette.colors.map((c) => c.hex).join(", ");
    void writeClipboardText(paletteText);
    toast.success("Palette copied to clipboard");
  };

  const exportPalette = (format: "css" | "scss" | "json") => {
    let content = "";
    const colors = palette.colors;

    switch (format) {
      case "css":
        content = `:root {\n${colors
          .map((c, i) => `  --color-${i + 1}: ${c.hex};`)
          .join("\n")}\n}`;
        break;
      case "scss":
        content = colors.map((c, i) => `$color-${i + 1}: ${c.hex};`).join("\n");
        break;
      case "json":
        content = JSON.stringify(
          colors.reduce(
            (acc, c, i) => ({ ...acc, [`color${i + 1}`]: c.hex }),
            {}
          ),
          null,
          2
        );
        break;
    }

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${palette.name.toLowerCase().replace(/\s+/g, "-")}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success(`Palette exported as ${format.toUpperCase()}`);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{palette.name}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {palette.description}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="flex-shrink-0">{palette.colors.length} colors</Badge>
            {showExport && (
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyPalette}
                  className="h-8"
                >
                  <Copy className="h-3 w-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportPalette("css")}
                  className="h-8"
                >
                  <Download className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Color Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {palette.colors.map((color, index) => (
              <div key={index} className="space-y-2">
                <button
                  type="button"
                  className="w-full h-16 rounded-lg border-2 border-border hover:border-primary transition-colors relative group"
                  style={{ backgroundColor: color.hex }}
                  onClick={() => onColorSelect?.(color.hex)}
                  title={`${color.name}: ${color.hex}`}
                >
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all rounded-lg flex items-center justify-center">
                    <Copy className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </button>
                <div className="text-center space-y-1">
                  <p className="text-xs font-medium">{color.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {color.hex}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Color List */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Color Values</h4>
            <div className="grid gap-2">
              {palette.colors.map((color, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-muted rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-6 h-6 rounded border"
                      style={{ backgroundColor: color.hex }}
                    />
                    <div>
                      <span className="font-medium text-sm">{color.name}</span>
                      <span className="text-xs text-muted-foreground ml-2 font-mono">
                        {color.hex}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyColor(color.hex)}
                      className="h-6 w-6 p-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onColorSelect?.(color.hex)}
                      className="h-6 w-6 p-0"
                      title="Use this color"
                    >
                      →
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Export Options */}
          {showExport && (
            <div className="pt-4 border-t">
              <h4 className="text-sm font-medium mb-3">Export Palette</h4>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportPalette("css")}
                >
                  CSS Variables
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportPalette("scss")}
                >
                  SCSS
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportPalette("json")}
                >
                  JSON
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
