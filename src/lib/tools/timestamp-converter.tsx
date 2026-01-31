"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Clock } from "lucide-react";
import { toast } from "sonner";
import {
  ToolHeader,
  QuickActions,
  ResultCard,
  CopyableResult,
} from "@/components/layout";
import { dateToTimestamp, timestampToIso } from "@/lib/processors";

export const metadata = {
  id: "timestamp-converter",
  name: "Timestamp Converter",
  description: "Convert between Unix timestamps and human-readable dates",
  category: "Utilities",
  tags: ["timestamp", "date", "time", "unix", "converter"],
  path: "/tools/timestamp-converter",
  icon: "🕐",
};

export default function TimestampConverter() {
  const [timestamp, setTimestamp] = useState("");
  const [humanDate, setHumanDate] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [unit, setUnit] = useState<"seconds" | "milliseconds">("seconds");
  const [timezone, setTimezone] = useState("UTC");
  const [isClient, setIsClient] = useState(false);

  // Set client-side flag to prevent hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const convertToHuman = () => {
    try {
      const num = parseFloat(timestamp);
      if (isNaN(num)) {
        toast.error("Invalid timestamp");
        return;
      }

      if (timezone === "UTC") {
        setHumanDate(timestampToIso(num, unit).replace("T", " ").replace("Z", " UTC"));
      } else {
        const date = new Date(unit === "seconds" ? num * 1000 : num);
        setHumanDate(date.toLocaleString());
      }
      toast.success("Timestamp converted!");
    } catch {
      toast.error("Invalid timestamp format");
    }
  };

  const convertToTimestamp = () => {
    try {
      const ts = dateToTimestamp(humanDate, unit);
      setTimestamp(ts.toString());
      toast.success("Date converted to timestamp!");
    } catch {
      toast.error("Invalid date format");
    }
  };

  const useCurrentTime = () => {
    const now = new Date();
    const ts = unit === "seconds" ? Math.floor(now.getTime() / 1000) : now.getTime();
    setTimestamp(ts.toString());

    if (timezone === "UTC") {
      setHumanDate(now.toISOString().replace("T", " ").replace("Z", " UTC"));
    } else {
      setHumanDate(now.toLocaleString());
    }
  };

  const formatExamples = [
    "2024-01-15 10:30:00",
    "2024-01-15T10:30:00Z", 
    "January 15, 2024 10:30 AM",
    "01/15/2024 10:30:00",
  ];

  const commonTimestamps = [
    { name: "Unix Epoch", value: "0", description: "January 1, 1970 00:00:00 UTC" },
    { name: "Y2K", value: "946684800", description: "January 1, 2000 00:00:00 UTC" },
    { name: "Unix 32-bit overflow", value: "2147483647", description: "January 19, 2038 03:14:07 UTC" },
  ];

  const quickActions = [
    { label: "Current Time", onClick: useCurrentTime },
    { label: "Unix Epoch", onClick: () => setTimestamp("0") },
    { label: "Y2K", onClick: () => setTimestamp("946684800") },
    { label: "2038 Overflow", onClick: () => setTimestamp("2147483647") },
  ];

  return (
    <div className="space-y-6">
      <ToolHeader
        title="Timestamp Converter"
        description="Convert between Unix timestamps and human-readable dates"
        icon={Clock}
      />

      <QuickActions
        actions={quickActions.map((action, index) => ({
          id: `quick-${index}`,
          label: action.label,
          onClick: action.onClick,
        }))}
      />

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Current Time & Settings */}
        <div className="space-y-4">
          <ResultCard
            title="Current Time"
            description="Live time display with current timestamp"
            status="info"
          >
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Local Time:</span>
                  <span className="font-mono">
                    {isClient ? currentTime.toLocaleString() : "Loading..."}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">UTC Time:</span>
                  <span className="font-mono">
                    {isClient 
                      ? currentTime.toISOString().replace("T", " ").replace("Z", " UTC")
                      : "Loading..."
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Unix ({unit}):</span>
                  <span className="font-mono">
                    {isClient 
                      ? (unit === "seconds"
                          ? Math.floor(currentTime.getTime() / 1000)
                          : currentTime.getTime())
                      : "Loading..."
                    }
                  </span>
                </div>
              </div>
              <Button onClick={useCurrentTime} className="w-full" size="sm">
                Use Current Time
              </Button>
            </div>
          </ResultCard>

          <ResultCard
            title="Settings"
            description="Configure conversion options"
            status="info"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">Timestamp Unit</Label>
                <Select
                  value={unit}
                  onValueChange={(value) => setUnit(value as "seconds" | "milliseconds")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="seconds">Seconds (Unix)</SelectItem>
                    <SelectItem value="milliseconds">Milliseconds (JS)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Timezone</Label>
                <Select value={timezone} onValueChange={setTimezone}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UTC">UTC</SelectItem>
                    <SelectItem value="local">Local Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </ResultCard>
        </div>

        {/* Conversion Tools */}
        <div className="space-y-4">
          <ResultCard
            title="Timestamp → Human Date"
            description="Convert Unix timestamp to readable date"
            status={humanDate ? "success" : "info"}
          >
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={timestamp}
                  onChange={(e) => setTimestamp(e.target.value)}
                  placeholder={`Enter timestamp in ${unit}...`}
                  className="font-mono"
                />
                <Button onClick={convertToHuman} disabled={!timestamp} size="sm">
                  Convert
                </Button>
              </div>

              {humanDate && (
                <CopyableResult
                  value={humanDate}
                  fontFamily="mono"
                  rows={2}
                />
              )}

              <div className="space-y-2">
                <Label className="text-sm">Common Timestamps</Label>
                <div className="space-y-1">
                  {commonTimestamps.map((item) => (
                    <div
                      key={item.name}
                      className="flex items-center justify-between p-2 border rounded cursor-pointer hover:bg-accent text-xs"
                      onClick={() => setTimestamp(item.value)}
                    >
                      <div>
                        <div className="font-medium">{item.name}</div>
                        <div className="text-muted-foreground">{item.description}</div>
                      </div>
                      <code className="text-xs">{item.value}</code>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ResultCard>

          <ResultCard
            title="Human Date → Timestamp"
            description="Convert readable date to Unix timestamp"
            status={timestamp ? "success" : "info"}
          >
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={humanDate}
                  onChange={(e) => setHumanDate(e.target.value)}
                  placeholder="Enter date (e.g., 2024-01-15 10:30:00)..."
                  className="font-mono"
                />
                <Button onClick={convertToTimestamp} disabled={!humanDate} size="sm">
                  Convert
                </Button>
              </div>

              {timestamp && (
                <CopyableResult
                  value={timestamp}
                  fontFamily="mono"
                  rows={1}
                />
              )}

              <div className="space-y-2">
                <Label className="text-sm">Format Examples</Label>
                <div className="grid grid-cols-1 gap-1">
                  {formatExamples.map((format, index) => (
                    <div
                      key={index}
                      className="p-2 border rounded cursor-pointer hover:bg-accent text-xs font-mono"
                      onClick={() => setHumanDate(format)}
                    >
                      {format}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ResultCard>
        </div>
      </div>

      {/* Information */}
      <ResultCard
        title="About Unix Timestamps"
        description="Learn about Unix timestamp format and usage"
        status="info"
      >
        <div className="space-y-4 text-sm text-muted-foreground">
          <p>
            Unix timestamps represent the number of seconds (or milliseconds) since January 1, 1970, 00:00:00 UTC. 
            They are widely used in programming and databases for storing and comparing dates.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-foreground mb-2">Advantages</h4>
              <ul className="space-y-1 text-xs">
                <li>• Language and timezone independent</li>
                <li>• Easy to compare and sort</li>
                <li>• Compact storage format</li>
                <li>• No ambiguity in representation</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-2">Common Units</h4>
              <ul className="space-y-1 text-xs">
                <li>• <strong>Seconds:</strong> Standard Unix timestamp</li>
                <li>• <strong>Milliseconds:</strong> JavaScript Date.now()</li>
                <li>• <strong>Microseconds:</strong> High precision timing</li>
              </ul>
            </div>
          </div>
        </div>
      </ResultCard>
    </div>
  );
}
