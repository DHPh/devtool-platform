"use client";

import { useMemo, useRef, useState } from "react";
import { Copy, Hash, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { ToolHeader, QuickActions, ResultCard } from "@/components/layout";
import {
  createUuidV7Generator,
  generateUuidBatch,
  inspectUuid,
  type GeneratedUuidVersion,
} from "@/lib/processors/uuid";

export const metadata = {
  id: "uuid-generator",
  name: "UUID Generator",
  description: "Generate and inspect RFC 9562 UUIDv4 and UUIDv7 identifiers",
  category: "Generators",
  tags: ["uuid", "uuidv4", "uuidv7", "rfc-9562", "generator", "inspector"],
  path: "/tools/uuid-generator",
  icon: "🔑",
};

export default function UuidGenerator() {
  const [uuids, setUuids] = useState<string[]>([]);
  const [count, setCount] = useState(1);
  const [version, setVersion] = useState<GeneratedUuidVersion>("v7");
  const [inspectInput, setInspectInput] = useState("");
  const v7Generator = useRef(createUuidV7Generator());

  const inspection = useMemo(
    () => (inspectInput.trim() ? inspectUuid(inspectInput) : null),
    [inspectInput],
  );

  const generate = (amount = count) => {
    try {
      const generated = generateUuidBatch(version, amount, {
        v7Generator: v7Generator.current,
      });
      setCount(amount);
      setUuids(generated);
      toast.success(`Generated ${amount} UUID${amount === 1 ? "" : "s"}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "UUID generation failed");
    }
  };

  const copy = async (value: string, message = "UUID copied") => {
    await navigator.clipboard.writeText(value);
    toast.success(message);
  };

  return (
    <div className="space-y-6">
      <ToolHeader
        title="UUID Generator"
        description="Generate cryptographic UUIDv4 or time-ordered UUIDv7 identifiers and inspect canonical UUIDs"
        icon={Hash}
      />

      <QuickActions
        actions={[
          { id: "generate-1", label: "Generate 1 UUID", onClick: () => generate(1) },
          { id: "generate-5", label: "Generate 5 UUIDs", onClick: () => generate(5) },
          { id: "generate-10", label: "Generate 10 UUIDs", onClick: () => generate(10) },
          {
            id: "toggle-version",
            label: version === "v4" ? "Switch to v7" : "Switch to v4",
            onClick: () => setVersion(version === "v4" ? "v7" : "v4"),
            variant: "outline" as const,
          },
          {
            id: "clear",
            label: "Clear All",
            onClick: () => setUuids([]),
            variant: "outline" as const,
          },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <ResultCard
            title="Generator Settings"
            description="UUIDv4 is random; UUIDv7 is time-ordered"
            status="info"
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <span className="text-sm font-medium">UUID Version</span>
                <div className="flex gap-2">
                  {(["v4", "v7"] as const).map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setVersion(item)}
                      className={`rounded border px-3 py-2 text-sm ${
                        version === item
                          ? "bg-primary text-primary-foreground"
                          : "bg-background"
                      }`}
                    >
                      {item === "v4" ? "Version 4 (Random)" : "Version 7 (Time-ordered)"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="uuid-count" className="text-sm font-medium">
                  Number of UUIDs
                </label>
                <Input
                  id="uuid-count"
                  type="number"
                  min={1}
                  max={100}
                  value={count}
                  onChange={(event) =>
                    setCount(Math.max(1, Math.min(100, Number(event.target.value) || 1)))
                  }
                />
              </div>

              <button
                type="button"
                onClick={() => generate()}
                className="flex w-full items-center justify-center gap-2 rounded bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
              >
                <RefreshCw className="h-4 w-4" />
                Generate {count} UUID{count === 1 ? "" : "s"}
              </button>
            </div>
          </ResultCard>

          <ResultCard
            title="UUID Inspector"
            description="Validate canonical format and inspect version, variant, and UUIDv7 time"
            status={inspection?.valid ? "success" : inspection ? "error" : "info"}
          >
            <div className="space-y-3">
              <label htmlFor="uuid-inspect" className="text-sm font-medium">
                UUID to inspect
              </label>
              <Input
                id="uuid-inspect"
                value={inspectInput}
                onChange={(event) => setInspectInput(event.target.value)}
                placeholder="01890f3e-7b9a-7abc-8def-0123456789ab"
                className="font-mono"
              />
              {inspection && (
                inspection.valid ? (
                  <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
                    <dt className="text-muted-foreground">Version</dt>
                    <dd>{inspection.version === null ? "Special UUID" : `v${inspection.version}`}</dd>
                    <dt className="text-muted-foreground">Variant</dt>
                    <dd>{inspection.variant}</dd>
                    {inspection.timestamp && (
                      <>
                        <dt className="text-muted-foreground">Timestamp</dt>
                        <dd className="font-mono text-xs">{inspection.timestamp}</dd>
                      </>
                    )}
                  </dl>
                ) : (
                  <p className="text-sm text-destructive">{inspection.error}</p>
                )
              )}
            </div>
          </ResultCard>
        </div>

        <ResultCard
          title={`Generated UUIDs (${uuids.length})`}
          description="Click an identifier to copy it"
          status={uuids.length ? "success" : "info"}
          onCopy={uuids.length ? () => copy(uuids.join("\n"), "All UUIDs copied") : undefined}
          copyLabel="Copy All"
        >
          {uuids.length ? (
            <div className="max-h-[32rem] space-y-2 overflow-y-auto">
              {uuids.map((uuid) => (
                <button
                  key={uuid}
                  type="button"
                  onClick={() => copy(uuid)}
                  className="flex w-full items-center justify-between rounded border p-3 text-left font-mono text-sm transition-colors hover:bg-accent"
                >
                  <span>{uuid}</span>
                  <Copy className="h-4 w-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-muted-foreground">No UUIDs generated yet.</p>
          )}
        </ResultCard>
      </div>

      <ResultCard title="About UUIDv4 and UUIDv7" description="RFC 9562 identifiers" status="info">
        <div className="grid gap-4 text-sm md:grid-cols-2">
          <div>
            <h4 className="mb-2 font-medium">UUIDv4</h4>
            <p className="text-muted-foreground">
              Uses 122 cryptographically random bits after reserving the version and variant bits.
              It contains no timestamp.
            </p>
          </div>
          <div>
            <h4 className="mb-2 font-medium">UUIDv7</h4>
            <p className="text-muted-foreground">
              Starts with a 48-bit Unix millisecond timestamp. This generator increments its random
              field when the clock repeats or moves backwards, preserving order within this page session.
            </p>
          </div>
        </div>
      </ResultCard>
    </div>
  );
}
