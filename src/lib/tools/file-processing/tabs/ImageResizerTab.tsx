"use client";

import { toast } from "sonner";

import { readDroppedFiles } from "../file-drop";

import React, { useState, useRef, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Upload,
  Download,
  Image as ImageIcon,
  Trash2,
  Crop,
  RotateCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useObjectUrls } from "@/hooks/use-object-urls";
import { formatFileSize } from "@/lib/processors/file-core";
import {
  loadImageFromFile,
  renderCroppedCanvas,
  renderResizedCanvas,
} from "@/lib/processors/image-canvas";
import { calculateConstrainedImageSize } from "@/lib/processors/ui-primitives";

interface ResizedImage {
  id: string;
  file: File;
  originalUrl: string;
  resizedUrl: string;
  originalSize: { width: number; height: number };
  newSize: { width: number; height: number };
  quality: number;
  format: string;
  fileSize: number;
  originalFileSize: number;
  cropArea?: { x: number; y: number; width: number; height: number };
}

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

const IMAGE_FORMATS = [
  { value: "jpeg", label: "JPEG", mime: "image/jpeg" },
  { value: "png", label: "PNG", mime: "image/png" },
  { value: "webp", label: "WebP", mime: "image/webp" },
];

const PRESET_SIZES = [
  { label: "Original", width: 0, height: 0 },
  { label: "Instagram Square", width: 1080, height: 1080 },
  { label: "Instagram Story", width: 1080, height: 1920 },
  { label: "Facebook Cover", width: 1200, height: 630 },
  { label: "Twitter Header", width: 1500, height: 500 },
  { label: "YouTube Thumbnail", width: 1280, height: 720 },
  { label: "4K", width: 3840, height: 2160 },
  { label: "Full HD", width: 1920, height: 1080 },
  { label: "HD", width: 1280, height: 720 },
];

const CROP_RATIOS = [
  { label: "Free", ratio: null },
  { label: "Square (1:1)", ratio: 1 },
  { label: "Portrait (4:5)", ratio: 4/5 },
  { label: "Landscape (16:9)", ratio: 16/9 },
  { label: "Instagram Story (9:16)", ratio: 9/16 },
  { label: "Golden Ratio (1.618:1)", ratio: 1.618 },
  { label: "Standard Photo (3:2)", ratio: 3/2 },
  { label: "Wide (21:9)", ratio: 21/9 },
];

export default function ImageResizerTab() {
  const [images, setImages] = useState<ResizedImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<ResizedImage | null>(null);
  const [width, setWidth] = useState<number>(800);
  const [height, setHeight] = useState<number>(600);
  const [quality, setQuality] = useState<number[]>([85]);
  const [format, setFormat] = useState<string>("jpeg");
  const [maintainAspectRatio, setMaintainAspectRatio] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [mode, setMode] = useState<"resize" | "crop">("resize");
  const [cropArea, setCropArea] = useState<CropArea>({ x: 0, y: 0, width: 100, height: 100 });
  const [selectedCropRatio, setSelectedCropRatio] = useState<number | null>(null);
  // const [isDragging, setIsDragging] = useState<boolean>(false);
  // const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { createObjectUrl, revokeObjectUrl } = useObjectUrls();

  const resizeImage = useCallback(
    async (
      img: HTMLImageElement,
      targetWidth: number,
      targetHeight: number,
      outputQuality: number,
      outputFormat: string
    ): Promise<{ blob: Blob; dataUrl: string }> => {
      const canvas = canvasRef.current;
      if (!canvas) throw new Error("Canvas not available");
      const mimeType =
        IMAGE_FORMATS.find((f) => f.value === outputFormat)?.mime ||
        "image/jpeg";
      return renderResizedCanvas(
        canvas,
        img,
        targetWidth,
        targetHeight,
        mimeType,
        outputQuality / 100,
      );
    },
    []
  );

  const cropImage = useCallback(
    async (
      img: HTMLImageElement,
      cropArea: CropArea,
      outputQuality: number,
      outputFormat: string
    ): Promise<{ blob: Blob; dataUrl: string }> => {
      const canvas = canvasRef.current;
      if (!canvas) throw new Error("Canvas not available");
      const mimeType =
        IMAGE_FORMATS.find((f) => f.value === outputFormat)?.mime ||
        "image/jpeg";
      return renderCroppedCanvas(
        canvas,
        img,
        cropArea,
        mimeType,
        outputQuality / 100,
      );
    },
    []
  );

  const handleFileSelect = async (files: FileList | null) => {
    if (!files) return;

    setIsProcessing(true);
    const newImages: ResizedImage[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith("image/")) continue;

      try {
        const img = await loadImageFromFile(file);
        const originalUrl = createObjectUrl(file);

        const newImage: ResizedImage = {
          id: crypto.randomUUID(),
          file,
          originalUrl,
          resizedUrl: originalUrl,
          originalSize: { width: img.naturalWidth, height: img.naturalHeight },
          newSize: { width: img.naturalWidth, height: img.naturalHeight },
          quality: quality[0],
          format: format,
          fileSize: file.size,
          originalFileSize: file.size,
          cropArea: undefined,
        };

        newImages.push(newImage);

        // Set dimensions for first image and initialize crop area
        if (i === 0) {
          setWidth(img.naturalWidth);
          setHeight(img.naturalHeight);
          // Initialize crop area to center of image (50% of image size)
          const cropWidth = Math.floor(img.naturalWidth * 0.8);
          const cropHeight = Math.floor(img.naturalHeight * 0.8);
          const cropX = Math.floor((img.naturalWidth - cropWidth) / 2);
          const cropY = Math.floor((img.naturalHeight - cropHeight) / 2);
          setCropArea({ x: cropX, y: cropY, width: cropWidth, height: cropHeight });
        }
      } catch (error) {
        console.error("Error loading image:", error);
      }
    }

    if (newImages.length < files.length) toast.error("Some files could not be opened as images.");
    setImages((prev) => [...prev, ...newImages]);
    if (newImages.length > 0 && !selectedImage) {
      setSelectedImage(newImages[0]);
    }
    setIsProcessing(false);
  };

  const handleResize = async () => {
    if (!selectedImage) return;

    setIsProcessing(true);
    try {
      const img = await loadImageFromFile(selectedImage.file);
      const { blob, dataUrl } = await resizeImage(
        img,
        width,
        height,
        quality[0],
        format
      );

      const updatedImage: ResizedImage = {
        ...selectedImage,
        resizedUrl: dataUrl,
        newSize: { width, height },
        quality: quality[0],
        format,
        fileSize: blob.size,
      };

      setImages((prev) =>
        prev.map((img) => (img.id === selectedImage.id ? updatedImage : img))
      );
      setSelectedImage(updatedImage);
    } catch (error) {
      console.error("Error resizing image:", error);
    }
    setIsProcessing(false);
  };

  const handleCrop = async () => {
    if (!selectedImage) return;

    setIsProcessing(true);
    try {
      const img = await loadImageFromFile(selectedImage.file);
      const { blob, dataUrl } = await cropImage(
        img,
        cropArea,
        quality[0],
        format
      );

      const updatedImage: ResizedImage = {
        ...selectedImage,
        resizedUrl: dataUrl,
        newSize: { width: cropArea.width, height: cropArea.height },
        quality: quality[0],
        format,
        fileSize: blob.size,
        cropArea: { ...cropArea },
      };

      setImages((prev) =>
        prev.map((img) => (img.id === selectedImage.id ? updatedImage : img))
      );
      setSelectedImage(updatedImage);
    } catch (error) {
      console.error("Error cropping image:", error);
    }
    setIsProcessing(false);
  };

  const handlePresetSize = (preset: (typeof PRESET_SIZES)[0]) => {
    if (preset.width === 0 && preset.height === 0 && selectedImage) {
      setWidth(selectedImage.originalSize.width);
      setHeight(selectedImage.originalSize.height);
    } else {
      setWidth(preset.width);
      setHeight(preset.height);
    }
  };

  const updateDimensions = (newWidth: number, newHeight: number) => {
    if (!selectedImage) return;
    const dimensions = calculateConstrainedImageSize(
      selectedImage.originalSize,
      { width: newWidth, height: newHeight },
      newWidth !== width ? "width" : "height",
      maintainAspectRatio,
    );
    setWidth(dimensions.width);
    setHeight(dimensions.height);
  };

  const handleCropRatioChange = (ratio: number | null) => {
    setSelectedCropRatio(ratio);
    if (!selectedImage || !ratio) return;

    // Calculate new crop area based on ratio
    const maxWidth = selectedImage.originalSize.width;
    const maxHeight = selectedImage.originalSize.height;
    
    let newWidth, newHeight;
    
    if (ratio > 1) {
      // Landscape
      newWidth = Math.min(maxWidth, maxHeight * ratio);
      newHeight = newWidth / ratio;
    } else {
      // Portrait or square
      newHeight = Math.min(maxHeight, maxWidth / ratio);
      newWidth = newHeight * ratio;
    }
    
    // Center the crop area
    const x = Math.max(0, (maxWidth - newWidth) / 2);
    const y = Math.max(0, (maxHeight - newHeight) / 2);
    
    setCropArea({
      x: Math.floor(x),
      y: Math.floor(y),
      width: Math.floor(newWidth),
      height: Math.floor(newHeight),
    });
  };

  const selectImage = (image: ResizedImage) => {
    setSelectedImage(image);
    setWidth(image.newSize.width);
    setHeight(image.newSize.height);
    if (image.cropArea) {
      setCropArea(image.cropArea);
    } else {
      const cw = Math.max(1, Math.floor(image.originalSize.width * 0.8));
      const ch = Math.max(1, Math.floor(image.originalSize.height * 0.8));
      setCropArea({
        x: Math.floor((image.originalSize.width - cw) / 2),
        y: Math.floor((image.originalSize.height - ch) / 2),
        width: cw,
        height: ch,
      });
    }
  };

  const handleResizeAll = async () => {
    if (images.length === 0) return;
    setIsProcessing(true);
    try {
      const updatedList: ResizedImage[] = [];
      for (const image of images) {
        const target = calculateConstrainedImageSize(
          image.originalSize,
          { width, height },
          "width",
          maintainAspectRatio,
        );
        const img = await loadImageFromFile(image.file);
        const { blob, dataUrl } = await resizeImage(
          img,
          target.width,
          target.height,
          quality[0],
          format,
        );
        updatedList.push({
          ...image,
          resizedUrl: dataUrl,
          newSize: { width: target.width, height: target.height },
          quality: quality[0],
          format,
          fileSize: blob.size,
        });
      }
      setImages(updatedList);
      if (selectedImage) {
        const nextSelected = updatedList.find((item) => item.id === selectedImage.id);
        if (nextSelected) setSelectedImage(nextSelected);
      }
      toast.success(`Resized ${updatedList.length} images.`);
    } catch (error) {
      console.error("Error batch resizing images:", error);
      toast.error("Failed to resize one or more images.");
    }
    setIsProcessing(false);
  };

  const downloadAllZip = async () => {
    const processed = images.filter((img) => img.resizedUrl !== img.originalUrl);
    if (processed.length === 0) return;
    const { default: JSZip } = await import("jszip");
    const zip = new JSZip();
    for (const image of processed) {
      const ext = IMAGE_FORMATS.find((f) => f.value === image.format)?.value || "jpg";
      const prefix = image.cropArea ? "cropped" : "resized";
      const base = image.file.name.replace(/\.[^.]+$/, "");
      const response = await fetch(image.resizedUrl);
      zip.file(`${prefix}_${base}.${ext}`, await response.blob());
    }
    const zipBlob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(zipBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "processed-images.zip";
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadImage = (image: ResizedImage) => {
    const link = document.createElement("a");
    link.href = image.resizedUrl;
    const extension =
      IMAGE_FORMATS.find((f) => f.value === image.format)?.value || "jpg";

    const prefix = image.cropArea ? "cropped" : "resized";
    const baseName = image.file.name.replace(/\.[^.]+$/, "");
    link.download = `${prefix}_${baseName}.${extension}`;
    link.click();
  };

  const removeImage = (imageId: string) => {
    const removed = images.find((img) => img.id === imageId);
    revokeObjectUrl(removed?.originalUrl);
    const remaining = images.filter((img) => img.id !== imageId);
    setImages(remaining);
    if (selectedImage?.id === imageId) {
      if (remaining.length > 0) {
        selectImage(remaining[0]);
      } else {
        setSelectedImage(null);
      }
    }
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-2">Image Resizer</h2>
          <p className="text-muted-foreground">
            Resize images with quality control and format conversion
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Controls */}
          <Card>
            <CardHeader>
              <CardTitle>Upload & Settings</CardTitle>
              <CardDescription>
                Upload images and configure resize/crop settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* File Upload */}
              <div
                className={cn(
                  "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                  "hover:border-primary/50 hover:bg-primary/5"
                )}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => handleFileSelect(readDroppedFiles(event))}
                onClick={() => fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                aria-label="Choose images to resize"
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
              >
                <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium">Upload Images</p>
                <p className="text-sm text-muted-foreground">
                  Click to select or drag and drop images
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    void handleFileSelect(e.target.files);
                    e.target.value = "";
                  }}
                  className="hidden"
                />
              </div>

              {/* Mode Tabs */}
              <Tabs defaultValue="resize" onValueChange={(value) => setMode(value as "resize" | "crop")}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="resize" className="flex items-center gap-2">
                    <RotateCw className="h-4 w-4" />
                    Resize
                  </TabsTrigger>
                  <TabsTrigger value="crop" className="flex items-center gap-2">
                    <Crop className="h-4 w-4" />
                    Crop
                  </TabsTrigger>
                </TabsList>

                {/* Resize Tab */}
                <TabsContent value="resize" className="space-y-6 mt-6">
                  {/* Preset Sizes */}
                  <div>
                    <Label className="text-sm font-medium">Preset Sizes</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {PRESET_SIZES.map((preset) => (
                        <Button
                          key={preset.label}
                          variant="outline"
                          size="sm"
                          onClick={() => handlePresetSize(preset)}
                          className="text-xs"
                        >
                          {preset.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Dimensions */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="width">Width (px)</Label>
                      <Input
                        id="width"
                        type="number"
                        value={width}
                        onChange={(e) =>
                          updateDimensions(Number(e.target.value), height)
                        }
                        min="1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="height">Height (px)</Label>
                      <Input
                        id="height"
                        type="number"
                        value={height}
                        onChange={(e) =>
                          updateDimensions(width, Number(e.target.value))
                        }
                        min="1"
                      />
                    </div>
                  </div>

                  {/* Maintain Aspect Ratio */}
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="aspectRatio"
                      checked={maintainAspectRatio}
                      onChange={(e) => setMaintainAspectRatio(e.target.checked)}
                      className="rounded"
                    />
                    <Label htmlFor="aspectRatio" className="text-sm">
                      Maintain aspect ratio
                    </Label>
                  </div>

                  {/* Resize Button */}
                  <div className="flex gap-2">
                    <Button
                      onClick={handleResize}
                      disabled={!selectedImage || isProcessing}
                      className="flex-1"
                    >
                      {isProcessing ? "Processing..." : "Resize Image"}
                    </Button>
                    {images.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => void handleResizeAll()}
                        disabled={isProcessing}
                      >
                        Resize All ({images.length})
                      </Button>
                    )}
                  </div>
                </TabsContent>

                {/* Crop Tab */}
                <TabsContent value="crop" className="space-y-6 mt-6">
                  {/* Crop Ratio Presets */}
                  <div>
                    <Label className="text-sm font-medium">Crop Ratios</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {CROP_RATIOS.map((ratio) => (
                        <Button
                          key={ratio.label}
                          variant={selectedCropRatio === ratio.ratio ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleCropRatioChange(ratio.ratio)}
                          className="text-xs"
                        >
                          {ratio.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Crop Area Controls */}
                  {selectedImage && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="cropX">X Position</Label>
                          <Input
                            id="cropX"
                            type="number"
                            value={cropArea.x}
                            onChange={(e) => {
                              const nextX = Math.max(0, Math.min(selectedImage.originalSize.width - 1, Number(e.target.value) || 0));
                              const nextW = Math.min(cropArea.width, selectedImage.originalSize.width - nextX);
                              setCropArea({ ...cropArea, x: nextX, width: Math.max(1, nextW) });
                            }}
                            min="0"
                            max={selectedImage.originalSize.width - 1}
                          />
                        </div>
                        <div>
                          <Label htmlFor="cropY">Y Position</Label>
                          <Input
                            id="cropY"
                            type="number"
                            value={cropArea.y}
                            onChange={(e) => {
                              const nextY = Math.max(0, Math.min(selectedImage.originalSize.height - 1, Number(e.target.value) || 0));
                              const nextH = Math.min(cropArea.height, selectedImage.originalSize.height - nextY);
                              setCropArea({ ...cropArea, y: nextY, height: Math.max(1, nextH) });
                            }}
                            min="0"
                            max={selectedImage.originalSize.height - 1}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="cropWidth">Crop Width</Label>
                          <Input
                            id="cropWidth"
                            type="number"
                            value={cropArea.width}
                            onChange={(e) => {
                              const nextW = Math.max(1, Math.min(selectedImage.originalSize.width - cropArea.x, Number(e.target.value) || 1));
                              setCropArea({ ...cropArea, width: nextW });
                            }}
                            min="1"
                            max={selectedImage.originalSize.width - cropArea.x}
                          />
                        </div>
                        <div>
                          <Label htmlFor="cropHeight">Crop Height</Label>
                          <Input
                            id="cropHeight"
                            type="number"
                            value={cropArea.height}
                            onChange={(e) => {
                              const nextH = Math.max(1, Math.min(selectedImage.originalSize.height - cropArea.y, Number(e.target.value) || 1));
                              setCropArea({ ...cropArea, height: nextH });
                            }}
                            min="1"
                            max={selectedImage.originalSize.height - cropArea.y}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Crop Button */}
                  <Button
                    onClick={handleCrop}
                    disabled={!selectedImage || isProcessing}
                    className="w-full"
                  >
                    {isProcessing ? "Processing..." : "Crop Image"}
                  </Button>
                </TabsContent>
              </Tabs>

              {/* Shared Quality & Format Settings */}
              <div className="border-t pt-6 space-y-4">
                {/* Quality */}
                <div>
                  <Label className="text-sm font-medium">
                    Quality: {format === "png" ? "Lossless (PNG)" : `${quality[0]}%`}
                  </Label>
                  <Slider
                    value={quality}
                    onValueChange={setQuality}
                    max={100}
                    min={1}
                    step={1}
                    disabled={format === "png"}
                    className="mt-2"
                  />
                  {format === "png" && (
                    <p className="text-xs text-muted-foreground mt-1">
                      PNG output is lossless; quality slider only applies to JPEG and WebP.
                    </p>
                  )}
                </div>

                {/* Format */}
                <div>
                  <Label className="text-sm font-medium">Output Format</Label>
                  <Select value={format} onValueChange={setFormat}>
                    <SelectTrigger className="mt-2" aria-label="Output image format">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {IMAGE_FORMATS.map((fmt) => (
                        <SelectItem key={fmt.value} value={fmt.value}>
                          {fmt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preview & Results */}
          <Card>
            <CardHeader>
              <CardTitle>Preview & Results</CardTitle>
              <CardDescription>
                Preview your resized images and download results
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedImage ? (
                <div className="space-y-4">
                  {/* Image Preview */}
                  <div className="aspect-video bg-muted rounded-lg overflow-hidden flex items-center justify-center p-2">
                    <div className="relative inline-block max-w-full max-h-full">
                      {/* eslint-disable-next-line @next/next/no-img-element -- local blob/data URLs cannot be optimized by next/image */}
                      <img
                        src={mode === "crop" ? selectedImage.originalUrl : selectedImage.resizedUrl}
                        alt="Preview"
                        className="block max-w-full max-h-64 object-contain"
                      />
                      {mode === "crop" && (
                        <div
                          className="border-2 border-blue-500 bg-blue-500/20 absolute pointer-events-none"
                          style={{
                            left: `${(cropArea.x / selectedImage.originalSize.width) * 100}%`,
                            top: `${(cropArea.y / selectedImage.originalSize.height) * 100}%`,
                            width: `${(cropArea.width / selectedImage.originalSize.width) * 100}%`,
                            height: `${(cropArea.height / selectedImage.originalSize.height) * 100}%`,
                          }}
                        >
                          <div className="bg-blue-600 text-white px-1.5 py-0.5 text-[10px] font-medium inline-block">
                            Crop Area
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Image Info */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium">Original</p>
                      <p>
                        {selectedImage.originalSize.width} ×{" "}
                        {selectedImage.originalSize.height}
                      </p>
                      <p>{formatFileSize(selectedImage.originalFileSize)}</p>
                    </div>
                    <div>
                      <p className="font-medium">
                        {selectedImage.cropArea ? "Cropped" : "Resized"}
                      </p>
                      <p>
                        {selectedImage.newSize.width} ×{" "}
                        {selectedImage.newSize.height}
                      </p>
                      <p>{formatFileSize(selectedImage.fileSize)}</p>
                      {selectedImage.cropArea && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Crop: {selectedImage.cropArea.x},{selectedImage.cropArea.y}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Download Buttons */}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={() => downloadImage(selectedImage)}
                      disabled={selectedImage.resizedUrl === selectedImage.originalUrl}
                      className="flex-1"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      {selectedImage.resizedUrl === selectedImage.originalUrl
                        ? "Resize or crop image first"
                        : `Download ${selectedImage.cropArea ? "Cropped" : "Resized"} Image`}
                    </Button>
                    {images.filter((img) => img.resizedUrl !== img.originalUrl).length >= 2 && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => void downloadAllZip()}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download All (.zip)
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No image selected</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Image List */}
        {images.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Uploaded Images ({images.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {images.map((image) => (
                  <div
                    key={image.id}
                    className={cn(
                      "border rounded-lg p-4 cursor-pointer transition-colors",
                      selectedImage?.id === image.id
                        ? "border-primary bg-primary/5"
                        : "hover:border-primary/50"
                    )}
                    onClick={() => selectImage(image)}
                    role="button"
                    tabIndex={0}
                    aria-label={`Select ${image.file.name} for editing`}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        selectImage(image);
                      }
                    }}
                  >
                    <div className="aspect-video bg-muted rounded overflow-hidden mb-3">
                      {/* eslint-disable-next-line @next/next/no-img-element -- local blob/data URLs cannot be optimized by next/image */}
                      <img
                        src={image.originalUrl}
                        alt={image.file.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="space-y-2">
                      <p className="font-medium text-sm truncate">
                        {image.file.name}
                      </p>
                      <div className="flex justify-between items-center text-xs text-muted-foreground">
                        <span>
                          {image.originalSize.width}×{image.originalSize.height}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {formatFileSize(image.originalFileSize)}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                downloadImage(image);
                              }}
                              disabled={image.resizedUrl === image.originalUrl}
                              aria-label={`Download resized ${image.file.name}`}
                            >
                              <Download className="h-3 w-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Download resized image</p>
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeImage(image.id);
                              }}
                              aria-label={`Remove ${image.file.name}`}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Remove image</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Hidden Canvas for Processing */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </TooltipProvider>
  );
}
