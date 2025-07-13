"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Copy, Clock, Calendar } from "lucide-react";
import { toast } from "sonner";

export function TimestampConverter() {
  const [timestamp, setTimestamp] = useState("");
  const [humanDate, setHumanDate] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [unit, setUnit] = useState<"seconds" | "milliseconds">("seconds");
  const [timezone, setTimezone] = useState("UTC");

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

      const date = unit === "seconds" ? new Date(num * 1000) : new Date(num);

      if (timezone === "UTC") {
        setHumanDate(date.toISOString().replace("T", " ").replace("Z", " UTC"));
      } else {
        setHumanDate(date.toLocaleString());
      }
      toast.success("Timestamp converted!");
    } catch {
      toast.error("Invalid timestamp format");
    }
  };

  const convertToTimestamp = () => {
    try {
      const date = new Date(humanDate);
      if (isNaN(date.getTime())) {
        toast.error("Invalid date format");
        return;
      }

      const ts =
        unit === "seconds" ? Math.floor(date.getTime() / 1000) : date.getTime();

      setTimestamp(ts.toString());
      toast.success("Date converted to timestamp!");
    } catch {
      toast.error("Invalid date format");
    }
  };

  const useCurrentTime = () => {
    const now = new Date();
    const ts =
      unit === "seconds" ? Math.floor(now.getTime() / 1000) : now.getTime();

    setTimestamp(ts.toString());

    if (timezone === "UTC") {
      setHumanDate(now.toISOString().replace("T", " ").replace("Z", " UTC"));
    } else {
      setHumanDate(now.toLocaleString());
    }
  };

  const copyTimestamp = async () => {
    await navigator.clipboard.writeText(timestamp);
    toast.success("Timestamp copied to clipboard!");
  };

  const copyHumanDate = async () => {
    await navigator.clipboard.writeText(humanDate);
    toast.success("Date copied to clipboard!");
  };

  const formatExamples = [
    "2024-01-15 10:30:00",
    "2024-01-15T10:30:00Z",
    "2024-01-15T10:30:00.000Z",
    "January 15, 2024 10:30 AM",
    "01/15/2024 10:30:00",
    "15/01/2024 10:30:00",
  ];

  const commonTimestamps = [
    {
      name: "Unix Epoch",
      value: "0",
      description: "January 1, 1970 00:00:00 UTC",
    },
    {
      name: "Y2K",
      value: "946684800",
      description: "January 1, 2000 00:00:00 UTC",
    },
    {
      name: "Unix 32-bit overflow",
      value: "2147483647",
      description: "January 19, 2038 03:14:07 UTC",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Current Time Display */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Current Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <Label>Local Time</Label>
              <div className="font-mono text-lg mt-1">
                {currentTime.toLocaleString()}
              </div>
            </div>
            <div>
              <Label>UTC Time</Label>
              <div className="font-mono text-lg mt-1">
                {currentTime
                  .toISOString()
                  .replace("T", " ")
                  .replace("Z", " UTC")}
              </div>
            </div>
            <div>
              <Label>Unix Timestamp ({unit})</Label>
              <div className="font-mono text-lg mt-1">
                {unit === "seconds"
                  ? Math.floor(currentTime.getTime() / 1000)
                  : currentTime.getTime()}
              </div>
            </div>
          </div>
          <div className="flex justify-center mt-4">
            <Button onClick={useCurrentTime}>Use Current Time</Button>
          </div>
        </CardContent>
      </Card>

      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <div className="flex-1">
            <Label>Timestamp Unit</Label>
            <Select
              value={unit}
              onValueChange={(value) =>
                setUnit(value as "seconds" | "milliseconds")
              }
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="seconds">Seconds (Unix)</SelectItem>
                <SelectItem value="milliseconds">
                  Milliseconds (JavaScript)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <Label>Timezone</Label>
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="UTC">UTC</SelectItem>
                <SelectItem value="local">Local Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Conversion */}
      <Tabs defaultValue="to-human" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="to-human">Timestamp → Human</TabsTrigger>
          <TabsTrigger value="to-timestamp">Human → Timestamp</TabsTrigger>
        </TabsList>

        <TabsContent value="to-human" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Convert Timestamp to Human Date</CardTitle>
              <CardDescription>
                Enter a Unix timestamp to convert it to a human-readable date
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={timestamp}
                  onChange={(e) => setTimestamp(e.target.value)}
                  placeholder={`Enter timestamp in ${unit}...`}
                  className="font-mono"
                />
                <Button onClick={convertToHuman} disabled={!timestamp}>
                  Convert
                </Button>
              </div>

              {humanDate && (
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <Calendar className="h-4 w-4" />
                  <span className="font-mono flex-1">{humanDate}</span>
                  <Button onClick={copyHumanDate} variant="outline" size="sm">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              )}

              <div className="space-y-2">
                <Label>Common Timestamps</Label>
                <div className="space-y-2">
                  {commonTimestamps.map((item) => (
                    <div
                      key={item.name}
                      className="flex items-center justify-between p-2 border rounded cursor-pointer hover:bg-accent"
                      onClick={() => setTimestamp(item.value)}
                    >
                      <div>
                        <div className="font-medium text-sm">{item.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {item.description}
                        </div>
                      </div>
                      <code className="text-sm">{item.value}</code>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="to-timestamp" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Convert Human Date to Timestamp</CardTitle>
              <CardDescription>
                Enter a human-readable date to convert it to a Unix timestamp
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={humanDate}
                  onChange={(e) => setHumanDate(e.target.value)}
                  placeholder="Enter date (e.g., 2024-01-15 10:30:00)..."
                  className="font-mono"
                />
                <Button onClick={convertToTimestamp} disabled={!humanDate}>
                  Convert
                </Button>
              </div>

              {timestamp && (
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <Clock className="h-4 w-4" />
                  <span className="font-mono flex-1">{timestamp}</span>
                  <Button onClick={copyTimestamp} variant="outline" size="sm">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              )}

              <div className="space-y-2">
                <Label>Supported Date Formats</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {formatExamples.map((format, index) => (
                    <div
                      key={index}
                      className="p-2 border rounded cursor-pointer hover:bg-accent text-sm font-mono"
                      onClick={() => setHumanDate(format)}
                    >
                      {format}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Information */}
      <Card>
        <CardHeader>
          <CardTitle>About Unix Timestamps</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <div>
            <p>
              Unix timestamps represent the number of seconds (or milliseconds)
              that have elapsed since January 1, 1970, at 00:00:00 UTC (the Unix
              epoch). They are widely used in programming and databases for
              storing and comparing dates and times.
            </p>
          </div>

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
                <li>
                  • <strong>Seconds:</strong> Standard Unix timestamp
                </li>
                <li>
                  • <strong>Milliseconds:</strong> JavaScript Date.now()
                </li>
                <li>
                  • <strong>Microseconds:</strong> High precision timing
                </li>
                <li>
                  • <strong>Nanoseconds:</strong> Ultra-precise measurements
                </li>
              </ul>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-foreground mb-2">
              Important Dates
            </h4>
            <ul className="space-y-1 text-xs">
              <li>
                • <strong>Unix Epoch:</strong> January 1, 1970 00:00:00 UTC
                (timestamp: 0)
              </li>
              <li>
                • <strong>Y2K:</strong> January 1, 2000 00:00:00 UTC (timestamp:
                946684800)
              </li>
              <li>
                • <strong>32-bit overflow:</strong> January 19, 2038 03:14:07
                UTC (timestamp: 2147483647)
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
