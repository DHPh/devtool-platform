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
  Play, 
  RotateCcw, 
  Trash2, 
  Trophy,
  Clock,
  Shuffle
} from "lucide-react";
import { toast } from "sonner";
import {
  ToolContainer,
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
  "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7",
  "#DDA0DD", "#98D8C8", "#F7DC6F", "#BB8FCE", "#85C1E9",
  "#F8C471", "#82E0AA", "#F1948A", "#85C0E0", "#D7DBDD"
];

export default function RandomWheel() {
  const [items, setItems] = useState<WheelItem[]>([
    { id: "1", text: "Option 1", color: DEFAULT_COLORS[0], weight: 1 },
    { id: "2", text: "Option 2", color: DEFAULT_COLORS[1], weight: 1 },
    { id: "3", text: "Option 3", color: DEFAULT_COLORS[2], weight: 1 },
    { id: "4", text: "Option 4", color: DEFAULT_COLORS[3], weight: 1 },
  ]);
  
  const [inputText, setInputText] = useState("Option 1\nOption 2\nOption 3\nOption 4");
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [selectedItem, setSelectedItem] = useState<WheelItem | null>(null);
  const [results, setResults] = useState<SpinResult[]>([]);
  const [spinDuration, setSpinDuration] = useState(3);
  const [autoSpin, setAutoSpin] = useState(false);
  
  const wheelRef = useRef<SVGSVGElement>(null);
  const animationRef = useRef<number | undefined>(undefined);

  // Parse input text to items
  const parseInputToItems = () => {
    const lines = inputText.trim().split('\n').filter(line => line.trim());
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
    setItems(items.filter(item => item.id !== id));
  };

  // Calculate wheel segments
  const calculateSegments = () => {
    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
    let currentAngle = 0;
    
    return items.map(item => {
      const angle = (item.weight / totalWeight) * 360;
      const segment = {
        item,
        startAngle: currentAngle,
        endAngle: currentAngle + angle,
        angle,
      };
      currentAngle += angle;
      return segment;
    });
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

    // Random spin amount (multiple full rotations + random angle)
    const randomSpins = Math.random() * 5 + 5; // 5-10 full rotations
    const randomAngle = Math.random() * 360;
    const finalRotation = rotation + (randomSpins * 360) + randomAngle;

    // Animate rotation
    const startTime = Date.now();
    const duration = spinDuration * 1000;
    const startRotation = rotation;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (ease-out)
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentRotation = startRotation + (finalRotation - startRotation) * eased;
      
      setRotation(currentRotation);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        // Animation complete - determine winner
        const normalizedAngle = (360 - (currentRotation % 360)) % 360;
        const segments = calculateSegments();
        const winner = segments.find(segment => 
          normalizedAngle >= segment.startAngle && normalizedAngle < segment.endAngle
        );

        if (winner) {
          setSelectedItem(winner.item);
          setResults(prev => [{
            item: winner.item,
            timestamp: new Date()
          }, ...prev.slice(0, 9)]); // Keep last 10 results
          toast.success(`🎉 Winner: ${winner.item.text}!`);
        }
        
        setIsSpinning(false);
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  };

  // Reset wheel
  const resetWheel = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    setIsSpinning(false);
    setRotation(0);
    setSelectedItem(null);
    setResults([]);
  };

  // Generate SVG wheel
  const renderWheel = () => {
    if (items.length === 0) {
      return (
        <div className="flex items-center justify-center h-80 bg-gray-100 dark:bg-gray-800 rounded-full">
          <p className="text-gray-500">Add options to see the wheel</p>
        </div>
      );
    }

    const segments = calculateSegments();
    const radius = 140;
    const centerX = 150;
    const centerY = 150;

    return (
      <div className="relative">
        <svg
          ref={wheelRef}
          width="300"
          height="300"
          className="drop-shadow-lg"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: isSpinning ? 'none' : 'transform 0.5s ease-out'
          }}
        >
          {segments.map((segment) => {
            const startAngleRad = (segment.startAngle * Math.PI) / 180;
            const endAngleRad = (segment.endAngle * Math.PI) / 180;
            
            const x1 = centerX + radius * Math.cos(startAngleRad);
            const y1 = centerY + radius * Math.sin(startAngleRad);
            const x2 = centerX + radius * Math.cos(endAngleRad);
            const y2 = centerY + radius * Math.sin(endAngleRad);
            
            const largeArcFlag = segment.angle > 180 ? 1 : 0;
            
            const pathData = [
              `M ${centerX} ${centerY}`,
              `L ${x1} ${y1}`,
              `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
              'Z'
            ].join(' ');

            // Text position (middle of segment)
            const textAngle = (segment.startAngle + segment.endAngle) / 2;
            const textAngleRad = (textAngle * Math.PI) / 180;
            const textRadius = radius * 0.7;
            const textX = centerX + textRadius * Math.cos(textAngleRad);
            const textY = centerY + textRadius * Math.sin(textAngleRad);

            return (
              <g key={segment.item.id}>
                <path
                  d={pathData}
                  fill={segment.item.color}
                  stroke="#fff"
                  strokeWidth="2"
                  className={selectedItem?.id === segment.item.id ? "brightness-110" : ""}
                />
                <text
                  x={textX}
                  y={textY}
                  fill="white"
                  fontSize="12"
                  fontWeight="bold"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  transform={`rotate(${textAngle}, ${textX}, ${textY})`}
                  className="pointer-events-none drop-shadow-sm"
                >
                  {segment.item.text.length > 10 
                    ? segment.item.text.substring(0, 10) + '...' 
                    : segment.item.text
                  }
                </text>
              </g>
            );
          })}
          
          {/* Center circle */}
          <circle
            cx={centerX}
            cy={centerY}
            r="20"
            fill="#333"
            stroke="#fff"
            strokeWidth="2"
          />
        </svg>
        
        {/* Pointer */}
        <div className="absolute top-2 left-1/2 transform -translate-x-1/2">
          <div className="w-0 h-0 border-l-4 border-r-4 border-b-8 border-l-transparent border-r-transparent border-b-red-500"></div>
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
    <ToolContainer
      title="Random Wheel"
      description="Create a spinning wheel to randomly select from your list of options. Perfect for making decisions, picking winners, or just having fun!"
    >
      {/* Wheel Display */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Wheel</span>
            <div className="flex items-center gap-2">
              {selectedItem && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Trophy className="h-3 w-3" />
                  {selectedItem.text}
                </Badge>
              )}
            </div>
          </CardTitle>
          <CardDescription>
            Click spin to randomly select an option
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center space-y-6">
            {renderWheel()}
            
            <ActionButtons
              buttons={[
                {
                  icon: Play,
                  label: isSpinning ? "Spinning..." : "Spin Wheel",
                  onClick: spinWheel,
                  disabled: isSpinning || items.length === 0,
                  variant: "default",
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
                  label: "Update Wheel",
                  onClick: parseInputToItems,
                  disabled: isSpinning,
                  variant: "outline",
                },
              ]}
            />
          </div>
        </CardContent>
      </Card>

      {/* Input Options */}
      <Card>
        <CardHeader>
          <CardTitle>Wheel Options</CardTitle>
          <CardDescription>
            Enter your options (one per line) or manage them individually
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ResponsiveTextArea
            placeholder="Option 1
Option 2  
Option 3
Option 4"
            value={inputText}
            onChange={setInputText}
            minHeight={120}
            showLineCount={true}
          />

          {/* Current items list */}
          {items.length > 0 && (
            <div className="space-y-2">
              <Label>Current Options ({items.length})</Label>
              <div className="grid gap-2 max-h-40 overflow-y-auto">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2 border rounded-md"
                    style={{ borderLeftColor: item.color, borderLeftWidth: '4px' }}
                  >
                    <span className="font-mono text-sm">{item.text}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeItem(item.id)}
                      disabled={isSpinning}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
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

        <FormField
          label="Auto-spin after adding options"
          description="Automatically spin when options are updated"
        >
          <Switch
            checked={autoSpin}
            onCheckedChange={setAutoSpin}
            disabled={isSpinning}
          />
        </FormField>
      </SettingsPanel>

      {/* Results History */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Recent Results
            </CardTitle>
            <CardDescription>
              Last {results.length} spin results
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {results.map((result, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 border rounded-md"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: result.item.color }}
                    />
                    <span className="font-medium">{result.item.text}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {result.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Usage Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Use</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <h4 className="font-medium text-blue-600">📝 Adding Options</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Type each option on a new line</li>
                <li>• Click &quot;Update Wheel&quot; to apply changes</li>
                <li>• Remove individual options with trash icon</li>
                <li>• Supports 2-20 options</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-green-600">🎯 Spinning</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Click &quot;Spin Wheel&quot; to start</li>
                <li>• Adjust spin duration in settings</li>
                <li>• View results history</li>
                <li>• Reset to clear all results</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </ToolContainer>
  );
}
