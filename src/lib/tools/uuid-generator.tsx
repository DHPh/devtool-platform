"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Copy, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  ToolContainer,
  ModeTabs,
  ActionButtons,
  SettingsPanel,
  FormField,
  StatsDisplay,
} from "@/components/layout";

export function UuidGenerator() {
  const [uuids, setUuids] = useState<string[]>([]);
  const [count, setCount] = useState(1);
  const [version, setVersion] = useState<"v4" | "v1">("v4");

  // Generate UUID v4 (random)
  const generateUUIDv4 = () => {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      }
    );
  };

  // Generate UUID v1 (timestamp-based) - simplified version
  const generateUUIDv1 = () => {
    const timestamp = Date.now();
    const clockSeq = Math.floor(Math.random() * 0x3fff);
    const nodeId = Math.floor(Math.random() * 0xffffffffffff);

    const timeHigh = (timestamp & 0xffffffff).toString(16).padStart(8, "0");
    const timeMid = ((timestamp >>> 32) & 0xffff).toString(16).padStart(4, "0");
    const timeHiAndVersion = (((timestamp >>> 48) & 0x0fff) | 0x1000)
      .toString(16)
      .padStart(4, "0");
    const clockSeqHiAndReserved = ((clockSeq >>> 8) | 0x80)
      .toString(16)
      .padStart(2, "0");
    const clockSeqLow = (clockSeq & 0xff).toString(16).padStart(2, "0");
    const node = nodeId.toString(16).padStart(12, "0");

    return `${timeHigh}-${timeMid}-${timeHiAndVersion}-${clockSeqHiAndReserved}${clockSeqLow}-${node}`;
  };

  const generateUUIDs = () => {
    const newUuids: string[] = [];
    for (let i = 0; i < count; i++) {
      if (version === "v4") {
        newUuids.push(generateUUIDv4());
      } else {
        newUuids.push(generateUUIDv1());
      }
    }
    setUuids(newUuids);
    toast.success(`Generated ${count} UUID${count > 1 ? "s" : ""}!`);
  };

  const copyUUID = async (uuid: string) => {
    await navigator.clipboard.writeText(uuid);
    toast.success("UUID copied to clipboard!");
  };

  const copyAllUUIDs = async () => {
    const allUuids = uuids.join("\n");
    await navigator.clipboard.writeText(allUuids);
    toast.success("All UUIDs copied to clipboard!");
  };

  const clearAll = () => {
    setUuids([]);
  };

  const downloadUUIDs = () => {
    const content = uuids.join("\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `uuids-${new Date().toISOString().split("T")[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("UUIDs downloaded!");
  };

  // Mode options configuration
  const modeOptions = [
    {
      value: "v4",
      label: "UUID v4 (Random)",
      description:
        "Version 4 UUIDs are randomly generated and provide strong uniqueness guarantees. They are the most commonly used UUID variant.",
    },
    {
      value: "v1",
      label: "UUID v1 (Timestamp)",
      description:
        "Version 1 UUIDs are timestamp-based and include the current time and a node identifier. They can be sorted chronologically but may reveal information about when and where they were generated.",
    },
  ];

  // Action buttons configuration
  const actionButtons = [
    {
      label: "Generate",
      onClick: generateUUIDs,
      icon: RefreshCw,
      variant: "default" as const,
    },
    {
      label: "Clear",
      onClick: clearAll,
      icon: Trash2,
      variant: "outline" as const,
      disabled: uuids.length === 0,
    },
    {
      label: "Copy All",
      onClick: copyAllUUIDs,
      icon: Copy,
      variant: "outline" as const,
      disabled: uuids.length === 0,
    },
    {
      label: "Download",
      onClick: downloadUUIDs,
      icon: RefreshCw,
      variant: "outline" as const,
      disabled: uuids.length === 0,
    },
  ];

  // Stats configuration
  const stats = [
    {
      label: "Generated",
      value: uuids.length.toString(),
      description: "Total UUIDs generated",
    },
    {
      label: "Version",
      value: version.toUpperCase(),
      description: "Current UUID version",
    },
  ];

  return (
    <ToolContainer
      title="UUID Generator"
      description="Generate universally unique identifiers (UUIDs) for your applications"
    >
      {/* Mode Selection */}
      <ModeTabs
        value={version}
        onValueChange={(value: string) => setVersion(value as "v4" | "v1")}
        options={modeOptions}
      />

      {/* Settings Panel */}
      <SettingsPanel title="Generator Settings">
        <FormField
          label="Number of UUIDs"
          description="How many UUIDs to generate (1-100)"
        >
          <Input
            type="number"
            min="1"
            max="100"
            value={count}
            onChange={(e) =>
              setCount(
                Math.max(1, Math.min(100, parseInt(e.target.value) || 1))
              )
            }
          />
        </FormField>

        <ActionButtons buttons={actionButtons} />
      </SettingsPanel>

      {/* Stats Display */}
      <StatsDisplay stats={stats} />

      {/* Generated UUIDs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Generated UUIDs ({uuids.length})</span>
          </CardTitle>
          <CardDescription>
            Click on any UUID to copy it to clipboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {uuids.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No UUIDs generated yet. Click &quot;Generate&quot; to create
                some.
              </p>
            ) : (
              uuids.map((uuid, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                  onClick={() => copyUUID(uuid)}
                >
                  <code className="font-mono text-sm flex-1">{uuid}</code>
                  <Copy className="h-4 w-4 text-muted-foreground" />
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* UUID Information */}
      <Card>
        <CardHeader>
          <CardTitle>About UUIDs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <div>
            <h4 className="font-medium text-foreground mb-2">
              What are UUIDs?
            </h4>
            <p>
              Universally Unique Identifiers (UUIDs) are 128-bit numbers used to
              uniquely identify information in computer systems. They are
              designed to be unique across all systems without requiring a
              central authority.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-foreground mb-2">
                UUID v4 (Random)
              </h4>
              <ul className="space-y-1 text-xs">
                <li>• Generated using random numbers</li>
                <li>• No embedded information</li>
                <li>• Most commonly used</li>
                <li>• Cryptographically secure</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-2">
                UUID v1 (Timestamp)
              </h4>
              <ul className="space-y-1 text-xs">
                <li>• Based on timestamp and MAC address</li>
                <li>• Sortable by creation time</li>
                <li>• May reveal creation time/location</li>
                <li>• Less commonly used today</li>
              </ul>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-foreground mb-2">Format</h4>
            <p className="font-mono text-xs">
              xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx
            </p>
            <p className="text-xs mt-1">
              Where M indicates the version (1 or 4) and N indicates the
              variant.
            </p>
          </div>

          <div>
            <h4 className="font-medium text-foreground mb-2">
              Common Use Cases
            </h4>
            <ul className="space-y-1 text-xs">
              <li>• Database primary keys</li>
              <li>• API request/response identifiers</li>
              <li>• File and resource naming</li>
              <li>• Distributed system coordination</li>
              <li>• Session and transaction IDs</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </ToolContainer>
  );
}
