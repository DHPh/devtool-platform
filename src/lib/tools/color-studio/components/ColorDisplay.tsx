"use client";

import React, { useId } from "react";
import { copyToClipboard } from "@/hooks/use-clipboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { TermHelp } from "@/components/tool-glossary";
import {
  mapCSSColorToGamut,
  parseCSSColor,
  serializeCSSColor,
  type ColorInfo,
  type CSSColorSpace,
} from "@/lib/utils/color";

interface ColorDisplayProps {
  color: ColorInfo;
  showDetails?: boolean;
  onCopy?: (value: string, format: string) => void;
  onChange?: (color: string) => void;
}

const COLOR_4_FORMATS: Array<[string, CSSColorSpace]> = [
  ["HWB", "hwb"],
  ["Lab", "lab"],
  ["LCH", "lch"],
  ["OKLab", "oklab"],
  ["OKLCH", "oklch"],
  ["Display-P3", "display-p3"],
];

export function ColorDisplay({ color, showDetails = true, onCopy, onChange }: ColorDisplayProps) {
  const displayPickerId = useId();
  const cssColor = color.cssColor ?? parseCSSColor(color.hex)!;
  const mapped = mapCSSColorToGamut(cssColor, "srgb");
  const previewLabel = mapped.hex ?? color.hex;

  const handleCopy = async (value: string, format: string) => {
    const copied = await copyToClipboard(value, `${format} copied to clipboard`);
    if (copied) {
      onCopy?.(value, format);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-lg">Color Information</CardTitle>
          <div className="flex flex-wrap justify-end gap-2">
            <Badge variant={color.isLight ? "default" : "secondary"}>{color.isLight ? "Light" : "Dark"}</Badge>
            <Badge variant={cssColor.gamut.srgb ? "secondary" : "destructive"}>
              <TermHelp term="sRGB gamut status" definition="sRGB is the standard web color range. “In gamut” means the color fits unchanged; “clipped” means the preview limits out-of-range channels to the nearest available value.">
                sRGB {cssColor.gamut.srgb ? "in gamut" : "clipped"}
              </TermHelp>
            </Badge>
            <Badge variant={cssColor.gamut.displayP3 ? "secondary" : "destructive"}>
              <TermHelp term="Display-P3 gamut status" definition="Display-P3 is a wider display color range than sRGB. “Out of gamut” means this exact color cannot be represented in P3 without adjustment.">
                P3 {cssColor.gamut.displayP3 ? "in gamut" : "out of gamut"}
              </TermHelp>
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          className="relative rounded-lg border-2 border-border"
          style={{ backgroundImage: "linear-gradient(45deg, #ddd 25%, transparent 25%), linear-gradient(-45deg, #ddd 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ddd 75%), linear-gradient(-45deg, transparent 75%, #ddd 75%)", backgroundSize: "16px 16px", backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0" }}
        >
          <div
            data-testid="mapped-color-preview"
            className="w-full h-32 rounded-md flex items-center justify-center"
            style={{ backgroundColor: mapped.css }}
          >
            <span className="text-sm font-medium px-3 py-1 rounded bg-background/80 text-foreground">
              {previewLabel}
            </span>
          </div>
          {onChange && (
            <input id={displayPickerId} aria-label="Choose display color" type="color" value={color.hex.slice(0, 7)} onChange={event => onChange(event.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
          )}
        </div>

        {!cssColor.gamut.srgb && (
          <p className="text-xs text-muted-foreground" role="status">
            This preview is explicitly clipped to sRGB. Copy a Display-P3 value below to preserve the wider-gamut color on compatible displays.
          </p>
        )}

        {showDetails && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <FormatValue label="HEX" value={previewLabel} onCopy={handleCopy} />
              <FormatValue label="RGB" value={serializeCSSColor(cssColor, "srgb")} onCopy={handleCopy} />
              <FormatValue label="HSL" value={serializeCSSColor(cssColor, "hsl")} onCopy={handleCopy} />
              {COLOR_4_FORMATS.map(([label, space]) => (
                <FormatValue key={space} label={label} value={serializeCSSColor(cssColor, space)} onCopy={handleCopy} />
              ))}
              <FormatValue label="CMYK" value={`cmyk(${color.cmyk.c}% ${color.cmyk.m}% ${color.cmyk.y}% ${color.cmyk.k}%)`} onCopy={handleCopy} />
            </div>

            <div className="pt-2 border-t">
              <h4 className="text-sm font-medium mb-2">Color Properties</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">Alpha:</span><span className="ml-2 font-medium">{Math.round(cssColor.alpha * 100)}%</span></div>
                <div><span className="text-muted-foreground">Luminance:</span><span className="ml-2 font-medium">{color.luminance.toFixed(3)}</span></div>
                <div><span className="text-muted-foreground">Source space:</span><span className="ml-2 font-medium">{cssColor.space}</span></div>
                <div><span className="text-muted-foreground">sRGB mapping:</span><span className="ml-2 font-medium">{mapped.wasInGamut ? "not needed" : "channel clipping"}</span></div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function FormatValue({ label, value, onCopy }: { label: string; value: string; onCopy: (value: string, label: string) => void }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <Button variant="ghost" size="sm" onClick={() => onCopy(value, label)} className="h-6 w-6 p-0" aria-label={`Copy ${label}`}>
          <Copy className="h-3 w-3" />
        </Button>
      </div>
      <div className="font-mono text-xs bg-muted px-2 py-1 rounded break-all">{value}</div>
    </div>
  );
}
