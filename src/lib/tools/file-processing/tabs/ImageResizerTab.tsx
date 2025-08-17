"use client";

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
} from "lucide-react";
import { cn } from "@/lib/utils";

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

export default function ImageResizerTab() {
  const [images, setImages] = useState<ResizedImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<ResizedImage | null>(null);
  const [width, setWidth] = useState<number>(800);
  const [height, setHeight] = useState<number>(600);
  const [quality, setQuality] = useState<number[]>([85]);
  const [format, setFormat] = useState<string>("jpeg");
  const [maintainAspectRatio, setMaintainAspectRatio] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const loadImage = (file: File): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  };

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

      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas context not available");

      canvas.width = targetWidth;
      canvas.height = targetHeight;

      // Clear canvas
      ctx.clearRect(0, 0, targetWidth, targetHeight);

      // Draw resized image
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      // Convert to blob
      const mimeType =
        IMAGE_FORMATS.find((f) => f.value === outputFormat)?.mime ||
        "image/jpeg";
      const dataUrl = canvas.toDataURL(mimeType, outputQuality / 100);

      return new Promise((resolve) => {
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve({ blob, dataUrl });
            }
          },
          mimeType,
          outputQuality / 100
        );
      });
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
        const img = await loadImage(file);
        const originalUrl = URL.createObjectURL(file);

        const newImage: ResizedImage = {
          id: Date.now().toString() + i,
          file,
          originalUrl,
          resizedUrl: originalUrl,
          originalSize: { width: img.naturalWidth, height: img.naturalHeight },
          newSize: { width: img.naturalWidth, height: img.naturalHeight },
          quality: quality[0],
          format: format,
          fileSize: file.size,
          originalFileSize: file.size,
        };

        newImages.push(newImage);

        // Set dimensions for first image
        if (i === 0) {
          setWidth(img.naturalWidth);
          setHeight(img.naturalHeight);
        }
      } catch (error) {
        console.error("Error loading image:", error);
      }
    }

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
      const img = await loadImage(selectedImage.file);
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
    if (maintainAspectRatio && selectedImage) {
      const aspectRatio =
        selectedImage.originalSize.width / selectedImage.originalSize.height;
      if (newWidth !== width) {
        setWidth(newWidth);
        setHeight(Math.round(newWidth / aspectRatio));
      } else if (newHeight !== height) {
        setHeight(newHeight);
        setWidth(Math.round(newHeight * aspectRatio));
      }
    } else {
      setWidth(newWidth);
      setHeight(newHeight);
    }
  };

  const downloadImage = (image: ResizedImage) => {
    const link = document.createElement("a");
    link.href = image.resizedUrl;
    const extension =
      IMAGE_FORMATS.find((f) => f.value === image.format)?.value || "jpg";
    link.download = `resized_${image.file.name.split(".")[0]}.${extension}`;
    link.click();
  };

  const removeImage = (imageId: string) => {
    setImages((prev) => prev.filter((img) => img.id !== imageId));
    if (selectedImage?.id === imageId) {
      const remaining = images.filter((img) => img.id !== imageId);
      setSelectedImage(remaining.length > 0 ? remaining[0] : null);
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
                Upload images and configure resize settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* File Upload */}
              <div
                className={cn(
                  "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                  "hover:border-primary/50 hover:bg-primary/5"
                )}
                onClick={() => fileInputRef.current?.click()}
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
                  onChange={(e) => handleFileSelect(e.target.files)}
                  className="hidden"
                />
              </div>

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

              {/* Quality */}
              <div>
                <Label className="text-sm font-medium">
                  Quality: {quality[0]}%
                </Label>
                <Slider
                  value={quality}
                  onValueChange={setQuality}
                  max={100}
                  min={1}
                  step={1}
                  className="mt-2"
                />
              </div>

              {/* Format */}
              <div>
                <Label className="text-sm font-medium">Output Format</Label>
                <Select value={format} onValueChange={setFormat}>
                  <SelectTrigger className="mt-2">
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

              {/* Resize Button */}
              <Button
                onClick={handleResize}
                disabled={!selectedImage || isProcessing}
                className="w-full"
              >
                {isProcessing ? "Processing..." : "Resize Image"}
              </Button>
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
                  <div className="aspect-video bg-muted rounded-lg overflow-hidden flex items-center justify-center">
                    <img
                      src={selectedImage.resizedUrl}
                      alt="Preview"
                      className="max-w-full max-h-full object-contain"
                    />
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
                      <p className="font-medium">Resized</p>
                      <p>
                        {selectedImage.newSize.width} ×{" "}
                        {selectedImage.newSize.height}
                      </p>
                      <p>{formatFileSize(selectedImage.fileSize)}</p>
                    </div>
                  </div>

                  {/* Download Button */}
                  <Button
                    onClick={() => downloadImage(selectedImage)}
                    className="w-full"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Resized Image
                  </Button>
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
                    onClick={() => setSelectedImage(image)}
                  >
                    <div className="aspect-video bg-muted rounded overflow-hidden mb-3">
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
