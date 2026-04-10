"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Upload,
  Download,
  Image as ImageIcon,
  Smartphone,
  Tablet,
  Monitor,
  AlertCircle,
  CheckCircle,
  Package,
  HelpCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import iconPackGeneratorFAQ from "@/lib/faq/icon-pack-generator-faq";
import { ANDROID_ICON_SPECS, IOS_ICON_SPECS } from "@/lib/processors/ui-primitives";

// Android icon specifications
const ANDROID_SPECS = ANDROID_ICON_SPECS;
/*
  adaptive: {
    foreground: { size: 432, name: "ic_launcher_foreground.png" },
    background: { size: 432, name: "ic_launcher_background.png" },
  },
  legacy: [
    { density: "mdpi", size: 48, folder: "mipmap-mdpi" },
    { density: "hdpi", size: 72, folder: "mipmap-hdpi" },
    { density: "xhdpi", size: 96, folder: "mipmap-xhdpi" },
    { density: "xxhdpi", size: 144, folder: "mipmap-xxhdpi" },
    { density: "xxxhdpi", size: 192, folder: "mipmap-xxxhdpi" },
  ],
  playStore: { size: 512, name: "play_store_icon.png" },
}; */

// iOS icon specifications
const IOS_SPECS = IOS_ICON_SPECS;
/*
  { name: "Icon-App-20x20@1x.png", size: 20, usage: "iPhone Notification" },
  { name: "Icon-App-20x20@2x.png", size: 40, usage: "iPhone Notification" },
  { name: "Icon-App-20x20@3x.png", size: 60, usage: "iPhone Notification" },
  { name: "Icon-App-29x29@1x.png", size: 29, usage: "iPhone Settings" },
  { name: "Icon-App-29x29@2x.png", size: 58, usage: "iPhone Settings" },
  { name: "Icon-App-29x29@3x.png", size: 87, usage: "iPhone Settings" },
  { name: "Icon-App-40x40@1x.png", size: 40, usage: "iPad Spotlight" },
  { name: "Icon-App-40x40@2x.png", size: 80, usage: "iPhone Spotlight" },
  { name: "Icon-App-40x40@3x.png", size: 120, usage: "iPhone Spotlight" },
  { name: "Icon-App-60x60@2x.png", size: 120, usage: "iPhone App" },
  { name: "Icon-App-60x60@3x.png", size: 180, usage: "iPhone App" },
  { name: "Icon-App-76x76@1x.png", size: 76, usage: "iPad App" },
  { name: "Icon-App-76x76@2x.png", size: 152, usage: "iPad App" },
  { name: "Icon-App-83.5x83.5@2x.png", size: 167, usage: "iPad Pro" },
  { name: "Icon-App-1024x1024@1x.png", size: 1024, usage: "App Store" },
]; */

interface IconSpecs {
  android: {
    adaptive: boolean;
    legacy: boolean;
    playStore: boolean;
  };
  ios: {
    all: boolean;
    appStore: boolean;
  };
}

interface GenerationProgress {
  total: number;
  completed: number;
  current: string;
  errors: string[];
}

export default function IconPackGenerator() {
  const [sourceImage, setSourceImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  const [iconSpecs, setIconSpecs] = useState<IconSpecs>({
    android: { adaptive: true, legacy: true, playStore: true },
    ios: { all: true, appStore: true },
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<GenerationProgress>({
    total: 0,
    completed: 0,
    current: "",
    errors: [],
  });
  const [generatedZips, setGeneratedZips] = useState<{
    android?: Blob;
    ios?: Blob;
  }>({});

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return;
    }

    setSourceImage(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const resizeImage = (
    img: HTMLImageElement,
    size: number,
    background?: string
  ): Promise<Blob> => {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;

      canvas.width = size;
      canvas.height = size;

      // Set background if provided
      if (background) {
        ctx.fillStyle = background;
        ctx.fillRect(0, 0, size, size);
      }

      // Calculate dimensions to maintain aspect ratio
      const scale = Math.min(size / img.width, size / img.height);
      const scaledWidth = img.width * scale;
      const scaledHeight = img.height * scale;
      const x = (size - scaledWidth) / 2;
      const y = (size - scaledHeight) / 2;

      // Draw image
      ctx.drawImage(img, x, y, scaledWidth, scaledHeight);

      canvas.toBlob((blob) => {
        resolve(blob!);
      }, "image/png");
    });
  };

  const generateAndroidIcons = async (img: HTMLImageElement): Promise<Blob> => {
    const { default: JSZip } = await import("jszip");
    const zip = new JSZip();
    let completed = 0;

    // Generate adaptive icons
    if (iconSpecs.android.adaptive) {
      setProgress((prev) => ({
        ...prev,
        current: "Generating adaptive foreground...",
      }));
      const foreground = await resizeImage(
        img,
        ANDROID_SPECS.adaptive.foreground.size
      );
      zip.file(
        `res/mipmap-xxxhdpi/${ANDROID_SPECS.adaptive.foreground.name}`,
        foreground
      );
      completed++;
      setProgress((prev) => ({ ...prev, completed }));

      setProgress((prev) => ({
        ...prev,
        current: "Generating adaptive background...",
      }));
      const background = await resizeImage(
        img,
        ANDROID_SPECS.adaptive.background.size,
        backgroundColor
      );
      zip.file(
        `res/mipmap-xxxhdpi/${ANDROID_SPECS.adaptive.background.name}`,
        background
      );
      completed++;
      setProgress((prev) => ({ ...prev, completed }));
    }

    // Generate legacy icons
    if (iconSpecs.android.legacy) {
      for (const spec of ANDROID_SPECS.legacy) {
        setProgress((prev) => ({
          ...prev,
          current: `Generating ${spec.density} (${spec.size}px)...`,
        }));
        const iconBlob = await resizeImage(img, spec.size, backgroundColor);
        zip.file(`res/${spec.folder}/ic_launcher.png`, iconBlob);
        completed++;
        setProgress((prev) => ({ ...prev, completed }));
      }
    }

    // Generate Play Store icon
    if (iconSpecs.android.playStore) {
      setProgress((prev) => ({
        ...prev,
        current: "Generating Play Store icon...",
      }));
      const playStoreIcon = await resizeImage(
        img,
        ANDROID_SPECS.playStore.size,
        backgroundColor
      );
      zip.file(ANDROID_SPECS.playStore.name, playStoreIcon);
      completed++;
      setProgress((prev) => ({ ...prev, completed }));
    }

    // Add Android manifest snippet
    const manifestContent = `
<!-- Add these lines to your AndroidManifest.xml -->
<application
    android:icon="@mipmap/ic_launcher"
    android:roundIcon="@mipmap/ic_launcher_round"
    ... >
    
<!-- For adaptive icons, also add: -->
<!-- res/mipmap-anydpi-v26/ic_launcher.xml -->
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@mipmap/ic_launcher_background" />
    <foreground android:drawable="@mipmap/ic_launcher_foreground" />
</adaptive-icon>
`;
    zip.file("ANDROID_SETUP.txt", manifestContent);

    return zip.generateAsync({ type: "blob" });
  };

  const generateIOSIcons = async (img: HTMLImageElement): Promise<Blob> => {
    const { default: JSZip } = await import("jszip");
    const zip = new JSZip();
    let completed = 0;

    const specsToGenerate = iconSpecs.ios.all
      ? IOS_SPECS
      : IOS_SPECS.filter((spec) => spec.size === 1024);

    for (const spec of specsToGenerate) {
      setProgress((prev) => ({
        ...prev,
        current: `Generating ${spec.usage} (${spec.size}px)...`,
      }));
      const iconBlob = await resizeImage(img, spec.size, backgroundColor);
      zip.file(`ios-icons/${spec.name}`, iconBlob);
      completed++;
      setProgress((prev) => ({ ...prev, completed }));
    }

    // Add iOS setup instructions
    const iosSetupContent = `
iOS Icon Setup Instructions:

1. In Xcode, select your project in the navigator
2. Select your app target
3. Go to the "General" tab
4. Scroll down to "App Icons and Launch Images"
5. Click on "App Icon Source" and choose "AppIcon"
6. Drag and drop the appropriate icon files to each slot

File mapping:
${IOS_SPECS.map(
  (spec) => `${spec.name} → ${spec.usage} (${spec.size}x${spec.size})`
).join("\n")}

Note: The 1024x1024 icon is required for App Store submission.
`;
    zip.file("IOS_SETUP.txt", iosSetupContent);

    return zip.generateAsync({ type: "blob" });
  };

  const generateIcons = async () => {
    if (!sourceImage) return;

    setIsGenerating(true);
    setProgress({
      total: 0,
      completed: 0,
      current: "Loading image...",
      errors: [],
    });

    try {
      const img = new window.Image();
      img.onload = async () => {
        try {
          const zips: { android?: Blob; ios?: Blob } = {};

          // Calculate total operations
          let totalOps = 0;
          if (
            iconSpecs.android.adaptive ||
            iconSpecs.android.legacy ||
            iconSpecs.android.playStore
          ) {
            totalOps +=
              (iconSpecs.android.adaptive ? 2 : 0) +
              (iconSpecs.android.legacy ? ANDROID_SPECS.legacy.length : 0) +
              (iconSpecs.android.playStore ? 1 : 0);
          }
          if (iconSpecs.ios.all || iconSpecs.ios.appStore) {
            totalOps += iconSpecs.ios.all ? IOS_SPECS.length : 1;
          }

          setProgress((prev) => ({ ...prev, total: totalOps }));

          // Generate Android icons
          if (
            iconSpecs.android.adaptive ||
            iconSpecs.android.legacy ||
            iconSpecs.android.playStore
          ) {
            zips.android = await generateAndroidIcons(img);
          }

          // Generate iOS icons
          if (iconSpecs.ios.all || iconSpecs.ios.appStore) {
            zips.ios = await generateIOSIcons(img);
          }

          setGeneratedZips(zips);
          setProgress((prev) => ({ ...prev, current: "Generation complete!" }));
        } catch (error) {
          setProgress((prev) => ({
            ...prev,
            errors: [...prev.errors, `Generation error: ${error}`],
          }));
        } finally {
          setIsGenerating(false);
        }
      };

      img.src = imagePreview;
    } catch (error) {
      setProgress((prev) => ({
        ...prev,
        errors: [...prev.errors, `Image loading error: ${error}`],
      }));
      setIsGenerating(false);
    }
  };

  const downloadZip = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const progressPercentage =
    progress.total > 0 ? (progress.completed / progress.total) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
          <Package className="h-8 w-8" />
          Icon Pack Generator
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Upload a high-quality image and generate professional icon packs for
          Android and iOS that comply with platform guidelines and policies.
        </p>
      </div> */}

      <div className="grid gap-6">
        {/* Image Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Source Image
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="w-full h-32 border-dashed"
                >
                  <div className="text-center">
                    <ImageIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p>Click to upload image</p>
                    <p className="text-sm text-muted-foreground whitespace-normal">
                      PNG, JPG, SVG • Min 1024×1024px recommended
                    </p>
                  </div>
                </Button>

                <div className="mt-4 space-y-2">
                  <label className="block text-sm font-medium">
                    Background Color
                  </label>
                  <input
                    type="color"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="w-full h-10 rounded border"
                  />
                  <p className="text-xs text-muted-foreground">
                    Used for icon background and padding areas
                  </p>
                </div>
              </div>

              {imagePreview && (
                <div className="space-y-4">
                  <div className="aspect-square w-48 mx-auto border rounded-lg overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="text-center">
                    <Badge variant="secondary">Preview</Badge>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Platform Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Platform Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="android" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger
                  value="android"
                  className="flex items-center gap-2"
                >
                  <Smartphone className="h-4 w-4" />
                  Android
                </TabsTrigger>
                <TabsTrigger value="ios" className="flex items-center gap-2">
                  <Monitor className="h-4 w-4" />
                  iOS
                </TabsTrigger>
              </TabsList>

              <TabsContent value="android" className="space-y-4">
                <div className="space-y-3">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={iconSpecs.android.adaptive}
                      onChange={(e) =>
                        setIconSpecs((prev) => ({
                          ...prev,
                          android: {
                            ...prev.android,
                            adaptive: e.target.checked,
                          },
                        }))
                      }
                    />
                    <span>Adaptive Icons (Android 8.0+)</span>
                    <Badge variant="outline">432×432</Badge>
                  </label>

                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={iconSpecs.android.legacy}
                      onChange={(e) =>
                        setIconSpecs((prev) => ({
                          ...prev,
                          android: {
                            ...prev.android,
                            legacy: e.target.checked,
                          },
                        }))
                      }
                    />
                    <span>Legacy Icons (All densities)</span>
                    <Badge variant="outline">48-192px</Badge>
                  </label>

                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={iconSpecs.android.playStore}
                      onChange={(e) =>
                        setIconSpecs((prev) => ({
                          ...prev,
                          android: {
                            ...prev.android,
                            playStore: e.target.checked,
                          },
                        }))
                      }
                    />
                    <span>Play Store Icon</span>
                    <Badge variant="outline">512×512</Badge>
                  </label>
                </div>
              </TabsContent>

              <TabsContent value="ios" className="space-y-4">
                <div className="space-y-3">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={iconSpecs.ios.all}
                      onChange={(e) =>
                        setIconSpecs((prev) => ({
                          ...prev,
                          ios: { ...prev.ios, all: e.target.checked },
                        }))
                      }
                    />
                    <span>All iOS Icons (Complete Set)</span>
                    <Badge variant="outline">20-1024px</Badge>
                  </label>

                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={iconSpecs.ios.appStore}
                      onChange={(e) =>
                        setIconSpecs((prev) => ({
                          ...prev,
                          ios: { ...prev.ios, appStore: e.target.checked },
                        }))
                      }
                    />
                    <span>App Store Icon Only</span>
                    <Badge variant="outline">1024×1024</Badge>
                  </label>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Generation Section */}
        {sourceImage && (
          <Card>
            <CardHeader>
              <CardTitle>Generate Icon Packs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isGenerating &&
                !generatedZips.android &&
                !generatedZips.ios && (
                  <Button onClick={generateIcons} className="w-full" size="lg">
                    <Package className="h-4 w-4 mr-2" />
                    Generate Icon Packs
                  </Button>
                )}

              {isGenerating && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
                    <span className="text-sm">{progress.current}</span>
                  </div>
                  <Progress value={progressPercentage} className="w-full" />
                  <p className="text-xs text-muted-foreground">
                    {progress.completed} of {progress.total} icons generated
                  </p>
                </div>
              )}

              {progress.errors.length > 0 && (
                <div className="space-y-2">
                  {progress.errors.map((error, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 text-red-600"
                    >
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm">{error}</span>
                    </div>
                  ))}
                </div>
              )}

              {(generatedZips.android || generatedZips.ios) && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span>Icon packs generated successfully!</span>
                  </div>

                  <div className="grid gap-2">
                    {generatedZips.android && (
                      <Button
                        onClick={() =>
                          downloadZip(
                            generatedZips.android!,
                            "android-icons.zip"
                          )
                        }
                        variant="outline"
                        className="w-full"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download Android Icons
                      </Button>
                    )}

                    {generatedZips.ios && (
                      <Button
                        onClick={() =>
                          downloadZip(generatedZips.ios!, "ios-icons.zip")
                        }
                        variant="outline"
                        className="w-full"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download iOS Icons
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Guidelines */}
        <Card>
          <CardHeader>
            <CardTitle>Icon Design Guidelines</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  Android Guidelines
                </h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Use high contrast and vibrant colors</li>
                  <li>• Avoid thin lines and small details</li>
                  <li>• Design for 432×432px adaptive icons</li>
                  <li>• Keep important content in center 80%</li>
                  <li>• System will apply shape masks</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <Tablet className="h-4 w-4" />
                  iOS Guidelines
                </h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Design at 1024×1024px minimum</li>
                  <li>• Use square corners (iOS applies rounding)</li>
                  <li>• Avoid transparency in backgrounds</li>
                  <li>• Ensure legibility at small sizes</li>
                  <li>• Follow Apple&apos;s Human Interface Guidelines</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* FAQ Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              Frequently Asked Questions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {iconPackGeneratorFAQ.map((faq, index) => (
              <Collapsible key={index}>
                <CollapsibleTrigger className="flex w-full items-center justify-between text-left p-3 hover:bg-muted rounded-lg transition-colors">
                  <span className="font-medium">{faq.question}</span>
                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                </CollapsibleTrigger>
                <CollapsibleContent className="px-3 pb-3">
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {faq.answer}
                  </p>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </CardContent>
        </Card>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
