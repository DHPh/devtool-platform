"use client";

import { useState, useRef, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Play,
  RotateCcw,
  Trophy,
  Clock,
  Shuffle,
  PartyPopper,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  ResponsiveTextArea,
  ActionButtons,
  SettingsPanel,
  FormField,
} from "@/components/layout";

export const metadata = {
  id: "random-wheel",
  name: "Random Wheel",
  description: "Spin a wheel to randomly select from your list of options",
  category: "Utilities",
  tags: ["random", "wheel", "picker", "decision", "spinner"],
  path: "/tools/random-wheel",
  icon: "🎯",
};

interface WheelItem {
  id: string;
  text: string;
  color: string;
  weight: number;
}

interface SpinResult {
  item: WheelItem;
  timestamp: Date;
}

const DEFAULT_COLORS = [
  "#DC2626",
  "#2563EB",
  "#16A34A",
  "#C026D3",
  "#EA580C",
  "#7C3AED",
  "#059669",
  "#DB2777",
  "#D97706",
  "#0284C7",
  "#B91C1C",
  "#6D28D9",
  "#15803D",
  "#BE185D",
  "#CA8A04",
  "#1D4ED8",
  "#991B1B",
  "#A21CAF",
  "#047857",
  "#9D174D",
  "#B45309",
  "#1E40AF",
  "#7F1D1D",
  "#86198F",
  "#065F46",
  "#831843",
  "#92400E",
  "#5B21B6",
  "#C2410C",
  "#0891B2",
  "#166534",
  "#701A75",
  "#A16207",
  "#0369A1",
  "#9A3412",
  "#0E7490",
  "#14532D",
  "#78350F",
  "#854D0E",
  "#4C1D95",
  "#7C2D12",
  "#155E75",
  "#064E3B",
  "#713F12",
  "#075985",
  "#164E63",
  "#0C4A6E",
  "#1E3A8A",
];

export default function RandomWheel() {
  const [items, setItems] = useState<WheelItem[]>([
    { id: "1", text: "Option 1", color: DEFAULT_COLORS[0], weight: 1 },
    { id: "2", text: "Option 2", color: DEFAULT_COLORS[1], weight: 1 },
    { id: "3", text: "Option 3", color: DEFAULT_COLORS[2], weight: 1 },
    { id: "4", text: "Option 4", color: DEFAULT_COLORS[3], weight: 1 },
  ]);

  const [inputText, setInputText] = useState(
    "Option 1\nOption 2\nOption 3\nOption 4"
  );
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [selectedItem, setSelectedItem] = useState<WheelItem | null>(null);
  const [results, setResults] = useState<SpinResult[]>([]);
  const [spinDuration, setSpinDuration] = useState(3);
  const [showResultPopup, setShowResultPopup] = useState(false);
  const [removeAfterSpin, setRemoveAfterSpin] = useState(false);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [windowWidth, setWindowWidth] = useState(1024); // Default to desktop size
  const [isClient, setIsClient] = useState(false);

  const wheelRef = useRef<SVGSVGElement>(null);
  const animationRef = useRef<number | undefined>(undefined);

  // Handle client-side hydration and window resize
  useEffect(() => {
    setIsClient(true);
    setWindowWidth(window.innerWidth);

    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Parse input text to items
  const parseInputToItems = () => {
    const lines = inputText
      .trim()
      .split("\n")
      .filter((line) => line.trim());
    if (lines.length === 0) {
      toast.error("Please enter at least one option");
      return;
    }

    const newItems: WheelItem[] = lines.map((line, index) => ({
      id: Date.now() + index + "",
      text: line.trim(),
      color: DEFAULT_COLORS[index % DEFAULT_COLORS.length],
      weight: 1,
    }));

    setItems(newItems);
    toast.success(`Updated wheel with ${newItems.length} options`);
  };

  // Remove item
  const removeItem = (id: string) => {
    const newItems = items.filter((item) => item.id !== id);
    setItems(newItems);

    // Update input text
    setInputText(newItems.map((item) => item.text).join("\n"));
  };

  // Calculate wheel segments starting from top
  const calculateSegments = () => {
    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
    let currentAngle = 0; // Start from top (12 o'clock)

    return items.map((item) => {
      const segmentAngle = (item.weight / totalWeight) * 360;
      const segment = {
        item,
        startAngle: currentAngle,
        endAngle: currentAngle + segmentAngle,
        segmentAngle,
      };
      currentAngle += segmentAngle;
      return segment;
    });
  };

  // Determine winner based on pointer position
  const getWinner = (finalRotation: number) => {
    const segments = calculateSegments();
    // Normalize rotation and adjust for pointer at top
    const normalizedRotation = (360 - (finalRotation % 360) + 360) % 360;

    return (
      segments.find((segment) => {
        return (
          normalizedRotation >= segment.startAngle &&
          normalizedRotation < segment.endAngle
        );
      }) || segments[0]
    );
  };

  // Spin the wheel
  const spinWheel = () => {
    if (items.length === 0) {
      toast.error("Add some options first!");
      return;
    }
    if (isSpinning) return;

    setIsSpinning(true);
    setSelectedItem(null);

    // Random spin with more rotations for better effect (10-20 full rotations + random angle)
    const spins = Math.random() * 10 + 10;
    const randomAngle = Math.random() * 360;
    const finalRotation = rotation + spins * 360 + randomAngle;

    const startTime = Date.now();
    const duration = spinDuration * 1000;
    const startRotation = rotation;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Realistic wheel physics - quick acceleration then gradual deceleration
      let eased;
      if (progress < 0.1) {
        // Very quick acceleration in first 10% (0-10%)
        const accelProgress = progress / 0.1;
        eased = accelProgress * accelProgress * 0.3; // Quadratic acceleration to 30%
      } else if (progress < 0.4) {
        // Fast constant speed in middle 30% (10-40%)
        const constantProgress = (progress - 0.1) / 0.3;
        eased = 0.3 + constantProgress * 0.5; // Linear from 30% to 80%
      } else {
        // Gradual deceleration in last 60% (40-100%) - creates suspense
        const decelProgress = (progress - 0.4) / 0.6;
        // Cubic deceleration for smooth slowdown
        const decelEased = 1 - Math.pow(1 - decelProgress, 3);
        eased = 0.8 + 0.2 * decelEased;
      }

      const currentRotation =
        startRotation + (finalRotation - startRotation) * eased;
      setRotation(currentRotation);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        // Determine winner
        const winner = getWinner(currentRotation);
        if (winner) {
          setSelectedItem(winner.item);
          const result = { item: winner.item, timestamp: new Date() };
          setResults((prev) => [result, ...prev.slice(0, 9)]);

          // Show popup if enabled
          if (showResultPopup) {
            setShowResultDialog(true);
          } else {
            toast.success(`🎉 Winner: ${winner.item.text}!`);
          }

          // Remove winner from wheel if enabled
          if (removeAfterSpin) {
            setTimeout(() => {
              removeItem(winner.item.id);
            }, 1000);
          }
        }
        setIsSpinning(false);
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  };

  // Reset everything
  const resetWheel = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    setIsSpinning(false);
    setRotation(0);
    setSelectedItem(null);
    setResults([]);
  };

  // Render SVG wheel
  const renderWheel = () => {
    if (items.length === 0) {
      // Use consistent size for SSR, apply responsive sizing only after hydration
      const baseSize = 480;
      const containerMargin = 64; // Increase margin to prevent overflow
      const availableWidth = windowWidth - containerMargin;
      const emptySize =
        isClient && windowWidth < 640
          ? Math.min(baseSize, availableWidth * 0.85)
          : baseSize;
      return (
        <div
          className="flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-full border-4 border-gray-300 dark:border-gray-600"
          style={{
            width: `${emptySize}px`,
            height: `${emptySize}px`,
          }}
        >
          <p className="text-gray-500 text-center text-sm px-4">
            Add options to see the wheel
          </p>
        </div>
      );
    }

    const segments = calculateSegments();
    // Use consistent size for SSR, apply responsive sizing only after hydration
    const baseSize = 480;
    const containerMargin = 64; // Increase margin to prevent overflow
    const availableWidth = windowWidth - containerMargin;
    const mobileSize = Math.min(baseSize, availableWidth * 0.85);
    const size = isClient && windowWidth < 640 ? mobileSize : baseSize;
    const radius = (size / baseSize) * 220; // Scale radius proportionally
    const centerX = size / 2;
    const centerY = size / 2;

    return (
      <div
        className="relative"
        title={
          !isSpinning && items.length > 0 && isClient
            ? "Click to spin the wheel!"
            : ""
        }
      >
        <svg
          ref={wheelRef}
          width={size}
          height={size}
          className={`transition-all duration-200 ${
            !isSpinning && items.length > 0 && isClient
              ? "cursor-pointer hover:scale-105"
              : items.length === 0
              ? "cursor-not-allowed"
              : "cursor-default"
          }`}
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: isSpinning ? "none" : "transform 0.5s ease-out",
          }}
          onClick={
            !isSpinning && items.length > 0 && isClient ? spinWheel : undefined
          }
        >
          {segments.map((segment) => {
            // Convert to SVG coordinates (SVG starts from 3 o'clock, we want 12 o'clock)
            const startAngle = segment.startAngle - 90;
            const endAngle = segment.endAngle - 90;

            const startRad = (startAngle * Math.PI) / 180;
            const endRad = (endAngle * Math.PI) / 180;

            const x1 = centerX + radius * Math.cos(startRad);
            const y1 = centerY + radius * Math.sin(startRad);
            const x2 = centerX + radius * Math.cos(endRad);
            const y2 = centerY + radius * Math.sin(endRad);

            const largeArcFlag = segment.segmentAngle > 180 ? 1 : 0;

            const pathData = [
              `M ${centerX} ${centerY}`,
              `L ${x1} ${y1}`,
              `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
              "Z",
            ].join(" ");

            // Text positioning - centered and properly scaled
            const textAngle = (segment.startAngle + segment.endAngle) / 2;
            const textAngleRad = ((textAngle - 90) * Math.PI) / 180;

            // Dynamic text radius based on number of items for better spacing
            const baseTextRadius = radius * 0.65;
            const textRadius =
              items.length > 12 ? baseTextRadius * 0.85 : baseTextRadius;

            const textX = centerX + textRadius * Math.cos(textAngleRad);
            const textY = centerY + textRadius * Math.sin(textAngleRad);

            // Dynamic font size based on number of options, segment size, and screen size
            const getDynamicFontSize = (
              itemCount: number,
              segmentAngle: number,
              wheelSize: number
            ) => {
              // Base size scaled by wheel size
              const sizeMultiplier = wheelSize / 480;
              let baseSize = 15 * sizeMultiplier;

              // Scale down for more items
              if (itemCount > 20) baseSize = 10 * sizeMultiplier;
              else if (itemCount > 15) baseSize = 11 * sizeMultiplier;
              else if (itemCount > 12) baseSize = 12 * sizeMultiplier;
              else if (itemCount > 8) baseSize = 13 * sizeMultiplier;
              else if (itemCount > 6) baseSize = 14 * sizeMultiplier;

              // Further adjust for very small segments
              if (segmentAngle < 15)
                baseSize = Math.max(baseSize - 2 * sizeMultiplier, 8);
              else if (segmentAngle < 25)
                baseSize = Math.max(baseSize - 1 * sizeMultiplier, 9);

              // Minimum font size for readability - consistent during SSR
              return Math.max(baseSize, isClient && windowWidth < 640 ? 8 : 10);
            };

            // Smart text truncation based on segment size and item count
            const getMaxTextLength = (
              segmentAngle: number,
              itemCount: number
            ) => {
              let maxLength;

              // Base length calculation
              if (segmentAngle > 90) maxLength = 20;
              else if (segmentAngle > 60) maxLength = 15;
              else if (segmentAngle > 45) maxLength = 12;
              else if (segmentAngle > 30) maxLength = 10;
              else if (segmentAngle > 20) maxLength = 8;
              else if (segmentAngle > 15) maxLength = 6;
              else maxLength = 4;

              // Adjust for item count
              if (itemCount > 20)
                maxLength = Math.max(Math.floor(maxLength * 0.6), 3);
              else if (itemCount > 15)
                maxLength = Math.max(Math.floor(maxLength * 0.7), 4);
              else if (itemCount > 12)
                maxLength = Math.max(Math.floor(maxLength * 0.8), 5);
              else if (itemCount > 8)
                maxLength = Math.max(Math.floor(maxLength * 0.9), 6);

              return maxLength;
            };

            const fontSize = getDynamicFontSize(
              items.length,
              segment.segmentAngle,
              size
            );
            const maxLength = getMaxTextLength(
              segment.segmentAngle,
              items.length
            );
            const displayText =
              segment.item.text.length > maxLength
                ? segment.item.text.substring(0, maxLength) + "..."
                : segment.item.text;

            return (
              <g key={segment.item.id}>
                <path
                  d={pathData}
                  fill={segment.item.color}
                  stroke="#ffffff"
                  strokeWidth="3"
                  className={
                    selectedItem?.id === segment.item.id
                      ? "brightness-125"
                      : "hover:brightness-110"
                  }
                />
                <text
                  x={textX}
                  y={textY}
                  fill="white"
                  fontSize={fontSize}
                  fontWeight="bold"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="pointer-events-none select-none"
                  transform={`rotate(${textAngle - 90}, ${textX}, ${textY})`}
                >
                  {displayText}
                </text>
              </g>
            );
          })}

          {/* Center circle - responsive sizing */}
          <circle
            cx={centerX}
            cy={centerY}
            r={Math.max(30 * (size / 480), 15)}
            fill="#2d3748"
            stroke="#ffffff"
            strokeWidth={Math.max(4 * (size / 480), 2)}
          />
          <circle
            cx={centerX}
            cy={centerY}
            r={Math.max(18 * (size / 480), 10)}
            fill="#4a5568"
          />
        </svg>

        {/* Pointer - responsive sizing */}
        <div
          className="absolute top-1 left-1/2 transform -translate-x-1/2 z-10"
          style={{ top: `${Math.max(8 * (size / 480), 4)}px` }}
        >
          <div
            className="w-0 h-0 border-l-transparent border-r-transparent"
            style={{
              borderLeftWidth: `${Math.max(12 * (size / 480), 8)}px`,
              borderRightWidth: `${Math.max(12 * (size / 480), 8)}px`,
              borderTopWidth: `${Math.max(24 * (size / 480), 16)}px`,
              borderTopColor: "#000000",
              filter: "drop-shadow(0 0 2px white)",
            }}
          />
        </div>
      </div>
    );
  };

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Main Wheel Display */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Random Wheel</span>
            {selectedItem && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Trophy className="h-3 w-3" />
                Last: {selectedItem.text}
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Click spin button or click the wheel to randomly select from{" "}
            {items.length} options
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="flex flex-col items-center space-y-6 px-4 py-6">
            <div className="flex flex-col items-center space-y-2 w-full">
              <div className="flex justify-center w-full">{renderWheel()}</div>
              {!isSpinning && items.length > 0 && isClient && (
                <p className="text-xs text-muted-foreground text-center">
                  💡 Tip: Click the wheel or use the button below to spin
                </p>
              )}
            </div>

            <div className="px-4 w-full">
              <ActionButtons
                buttons={[
                  {
                    icon: Play,
                    label: isSpinning ? "Spinning..." : "Spin Wheel",
                    onClick: spinWheel,
                    disabled: isSpinning || items.length === 0,
                    variant: "default" as const,
                  },
                  {
                    icon: RotateCcw,
                    label: "Reset",
                    onClick: resetWheel,
                    disabled: isSpinning,
                    variant: "outline",
                  },
                  {
                    icon: Shuffle,
                    label: "Update Options",
                    onClick: parseInputToItems,
                    disabled: isSpinning,
                    variant: "outline",
                  },
                ]}
              />
            </div>

            {/* Options Management */}
            <div className="w-full max-w-2xl space-y-4 px-4">
              <div className="space-y-2">
                <Label>Wheel Options</Label>
                <ResponsiveTextArea
                  placeholder="Option 1&#10;Option 2&#10;Option 3&#10;Option 4"
                  value={inputText}
                  onChange={setInputText}
                  minHeight={120}
                  showLineCount={true}
                />
              </div>

              {/* Current options list with better layout */}
              {items.length > 0 && (
                <div className="space-y-2">
                  <Label>Current Options ({items.length})</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 border rounded-lg bg-white dark:bg-gray-800"
                        style={{
                          borderLeftColor: item.color,
                          borderLeftWidth: "4px",
                        }}
                      >
                        <span className="font-medium text-sm truncate">
                          {item.text}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeItem(item.id)}
                          disabled={isSpinning}
                          className="ml-2 flex-shrink-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Results History inside main container */}
              {results.length > 0 && (
                <div className="w-full max-w-2xl space-y-2 mt-6 pt-6 border-t">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="h-4 w-4" />
                    <Label className="text-base font-semibold">
                      Spin History ({results.length})
                    </Label>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {results.map((result, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 border rounded-lg bg-gray-50 dark:bg-gray-800"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-4 h-4 rounded-full border-2 border-white"
                            style={{ backgroundColor: result.item.color }}
                          />
                          <span className="font-medium">
                            {result.item.text}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {result.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settings */}
      <SettingsPanel title="Wheel Settings">
        <FormField
          label={`Spin Duration: ${spinDuration}s`}
          description="How long the wheel spins before stopping"
        >
          <Slider
            value={[spinDuration]}
            onValueChange={(value) => setSpinDuration(value[0])}
            min={1}
            max={8}
            step={0.5}
            disabled={isSpinning}
          />
        </FormField>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            label="Show result popup"
            description="Display a popup dialog when spin completes"
          >
            <div className="flex items-center space-x-3">
              <Switch
                checked={showResultPopup}
                onCheckedChange={setShowResultPopup}
                disabled={isSpinning}
              />
              <span className="text-sm font-medium">
                {showResultPopup ? "Enabled" : "Disabled"}
              </span>
            </div>
          </FormField>

          <FormField
            label="Remove winner from wheel"
            description="Automatically remove the winning option after spinning"
          >
            <div className="flex items-center space-x-3">
              <Switch
                checked={removeAfterSpin}
                onCheckedChange={setRemoveAfterSpin}
                disabled={isSpinning}
              />
              <span className="text-sm font-medium">
                {removeAfterSpin ? "Enabled" : "Disabled"}
              </span>
            </div>
          </FormField>
        </div>
      </SettingsPanel>

      {/* Result Popup Dialog */}
      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center">
            <DialogTitle className="flex items-center justify-center gap-2 text-2xl">
              <PartyPopper className="h-6 w-6" />
              Congratulations!
            </DialogTitle>
            <DialogDescription className="text-lg pt-4">
              The wheel has selected:
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-4 py-6">
            {selectedItem && (
              <>
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: selectedItem.color }}
                >
                  <Trophy className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-center">
                  {selectedItem.text}
                </h3>
              </>
            )}
            <Button onClick={() => setShowResultDialog(false)} className="mt-4">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Use</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div className="space-y-3">
              <h4 className="font-semibold text-blue-600">🎯 Quick Start</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Enter options (one per line)</li>
                <li>• Click &quot;Update Options&quot;</li>
                <li>• Hit &quot;Spin Wheel&quot; to select</li>
                <li>• Enjoy the results! 🎉</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold text-green-600">⚙️ Features</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Adjustable spin duration</li>
                <li>• Optional result popup</li>
                <li>• Auto-remove winners</li>
                <li>• Spin history tracking</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
