"use client";

import { StudioTabs } from "@/components/studio-tabs";
import { COLOR_STUDIO_MANIFEST } from "./manifest";

export default function ColorStudio() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        {/* <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-primary/10 rounded-xl">
              <Palette className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold">Color Studio</h1>
            <Badge variant="secondary" className="ml-2">
              Professional
            </Badge>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Complete color toolkit with advanced features for designers and
            developers
          </p>
        </div> */}

        {/* Main Content */}
        <StudioTabs
          manifest={COLOR_STUDIO_MANIFEST}
          componentProps={{}}
          listClassName="grid h-auto w-full grid-cols-2 p-1 md:grid-cols-3 lg:grid-cols-8"
        />

        {/* Footer */}
        <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>
            Professional color tools for design and development. Supports HEX,
            RGB, HSL, HSV, and CMYK formats, plus WCAG 2.2 contrast checks.
          </p>
        </div>
      </div>
    </div>
  );
}
