"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Copy, RefreshCw, Hash } from "lucide-react";
import { toast } from "sonner";
import {
  ToolHeader,
  QuickActions,
  ResultCard,
} from "@/components/layout";

export const metadata = {
  id: "uuid-generator",
  name: "UUID Generator",
  description: "Generate universally unique identifiers (UUIDs) for your applications",
  category: "Generators",
  tags: ["uuid", "generator", "unique", "identifier"],
  path: "/tools/uuid-generator",
  icon: "🔑",
};

export default function UuidGenerator() {
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

  return (
    <div className="space-y-6">
      <ToolHeader
        title="UUID Generator"
        description="Generate universally unique identifiers (UUIDs) for your applications"
        icon={Hash}
      />

      <QuickActions
        actions={[
          {
            id: "generate-1",
            label: "Generate 1 UUID",
            onClick: () => {
              setCount(1);
              generateUUIDs();
            },
          },
          {
            id: "generate-5",
            label: "Generate 5 UUIDs",
            onClick: () => {
              setCount(5);
              generateUUIDs();
            },
          },
          {
            id: "generate-10",
            label: "Generate 10 UUIDs",
            onClick: () => {
              setCount(10);
              generateUUIDs();
            },
          },
          {
            id: "toggle-version",
            label: version === "v4" ? "Switch to v1" : "Switch to v4",
            onClick: () => setVersion(version === "v4" ? "v1" : "v4"),
            variant: "outline" as const,
          },
          {
            id: "clear",
            label: "Clear All",
            onClick: clearAll,
            variant: "outline" as const,
          },
        ]}
      />

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Settings Section */}
        <div className="space-y-4">
          <ResultCard
            title="Generator Settings"
            description="Configure UUID generation options"
            status="info"
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">UUID Version</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setVersion("v4")}
                    className={`px-3 py-2 text-sm rounded border ${
                      version === "v4"
                        ? "bg-primary text-primary-foreground"
                        : "bg-background"
                    }`}
                  >
                    Version 4 (Random)
                  </button>
                  <button
                    onClick={() => setVersion("v1")}
                    className={`px-3 py-2 text-sm rounded border ${
                      version === "v1"
                        ? "bg-primary text-primary-foreground"
                        : "bg-background"
                    }`}
                  >
                    Version 1 (Timestamp)
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Number of UUIDs</label>
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
                <p className="text-xs text-muted-foreground">
                  Generate between 1-100 UUIDs at once
                </p>
              </div>

              <button
                onClick={generateUUIDs}
                className="w-full px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 flex items-center justify-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Generate {count} UUID{count > 1 ? "s" : ""}
              </button>
            </div>
          </ResultCard>

          {/* Stats */}
          <ResultCard
            title="Statistics"
            description="Information about generated UUIDs"
            status={uuids.length > 0 ? "success" : "info"}
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 border rounded">
                <div className="text-2xl font-bold text-blue-600">{uuids.length}</div>
                <div className="text-sm text-muted-foreground">Generated</div>
              </div>
              <div className="text-center p-3 border rounded">
                <div className="text-2xl font-bold text-green-600">{version.toUpperCase()}</div>
                <div className="text-sm text-muted-foreground">Version</div>
              </div>
            </div>
          </ResultCard>
        </div>

        {/* Generated UUIDs Section */}
        <div>
          <ResultCard
            title={`Generated UUIDs (${uuids.length})`}
            description="Click on any UUID to copy it to clipboard"
            status={uuids.length > 0 ? "success" : "info"}
            onCopy={uuids.length > 0 ? () => copyAllUUIDs() : undefined}
            copyLabel="Copy All"
          >
            {uuids.length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {uuids.map((uuid, index) => (
                  <div
                    key={index}
                    onClick={() => copyUUID(uuid)}
                    className="p-3 border rounded font-mono text-sm cursor-pointer hover:bg-accent transition-colors flex items-center justify-between"
                  >
                    <span>{uuid}</span>
                    <Copy className="h-4 w-4 text-muted-foreground" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                No UUIDs generated yet. Click generate to create some!
              </div>
            )}
          </ResultCard>
        </div>
      </div>

      {/* About UUIDs Section */}
      <ResultCard
        title="About UUIDs"
        description="Learn about different UUID versions and their use cases"
        status="info"
      >
        <div className="space-y-4 text-sm">
          <div>
            <h4 className="font-medium text-foreground mb-2">
              What are UUIDs?
            </h4>
            <p className="text-muted-foreground">
              Universally Unique Identifiers (UUIDs) are 128-bit numbers used to
              uniquely identify information in computer systems. They are
              designed to be unique across all systems without requiring a
              central authority.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-blue-600 mb-2">
                UUID v4 (Random)
              </h4>
              <ul className="space-y-1 text-xs text-muted-foreground">
                <li>• Generated using random numbers</li>
                <li>• No embedded information</li>
                <li>• Most commonly used</li>
                <li>• Cryptographically secure</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-green-600 mb-2">
                UUID v1 (Timestamp)
              </h4>
              <ul className="space-y-1 text-xs text-muted-foreground">
                <li>• Based on timestamp and MAC address</li>
                <li>• Sortable by creation time</li>
                <li>• May reveal creation time/location</li>
                <li>• Less commonly used today</li>
              </ul>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-foreground mb-2">Format</h4>
            <p className="font-mono text-xs text-muted-foreground">
              xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx
            </p>
            <p className="text-xs mt-1 text-muted-foreground">
              Where M indicates the version (1 or 4) and N indicates the
              variant.
            </p>
          </div>

          <div>
            <h4 className="font-medium text-foreground mb-2">
              Common Use Cases
            </h4>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li>• Database primary keys</li>
              <li>• API request/response identifiers</li>
              <li>• File and resource naming</li>
              <li>• Distributed system coordination</li>
              <li>• Session and transaction IDs</li>
            </ul>
          </div>
        </div>
      </ResultCard>
    </div>
  );
}
