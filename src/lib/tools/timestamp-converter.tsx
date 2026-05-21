"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { toast } from "sonner";
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
import { CopyableResult, QuickActions, ResultCard, ToolHeader } from "@/components/layout";
import {
  currentUnixTimestamp,
  dateTimeInputToUnix,
  formatIsoInstant,
  type UnixTimestampUnit,
  unixToDateTime,
} from "@/lib/processors/timestamp";

const COMMON_TIMESTAMPS = [
  { name: "Unix Epoch", value: "0", description: "1970-01-01T00:00:00Z" },
  { name: "Y2K", value: "946684800", description: "2000-01-01T00:00:00Z" },
  { name: "32-bit limit", value: "2147483647", description: "2038-01-19T03:14:07Z" },
];

const DATE_EXAMPLES = [
  "2024-01-15T10:30:00Z",
  "2024-01-15T10:30:00+07:00",
  "2024-01-15 10:30:00",
  "2024-01-15 10:30:00.123456789",
];

export default function TimestampConverter() {
  const [timestamp, setTimestamp] = useState("");
  const [dateInput, setDateInput] = useState("");
  const [dateResult, setDateResult] = useState("");
  const [timestampResult, setTimestampResult] = useState("");
  const [conversionMessage, setConversionMessage] = useState("");
  const [conversionStatus, setConversionStatus] = useState<"info" | "success" | "error">("info");
  const [unit, setUnit] = useState<UnixTimestampUnit>("seconds");
  const [timeZone, setTimeZone] = useState("UTC");
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  useEffect(() => {
    const update = () => setCurrentTime(new Date());
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const runConvertToDate = (
    tsValue = timestamp,
    unitValue = unit,
    zoneValue = timeZone,
    notify = true,
  ) => {
    try {
      const result = unixToDateTime(tsValue, unitValue, zoneValue);
      setDateResult(result.timeZone === "UTC" ? result.iso : `${result.zoned}\nUTC: ${result.iso}`);
      setConversionMessage("");
      setConversionStatus("info");
      if (notify) toast.success("Timestamp converted");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Invalid timestamp";
      setDateResult("");
      setConversionMessage(message);
      setConversionStatus("error");
      if (notify) toast.error(message);
    }
  };

  const convertToDate = () => runConvertToDate(timestamp, unit, timeZone, true);

  const runConvertToTimestamp = (
    rawDate = dateInput,
    unitValue = unit,
    zoneValue = timeZone,
    notify = true,
  ) => {
    try {
      const { resolution, values } = dateTimeInputToUnix(rawDate, unitValue, zoneValue);
      if (resolution.status === "invalid") {
        setTimestampResult("");
        setConversionMessage(resolution.message ?? "The local time does not exist");
        setConversionStatus("error");
        if (notify) toast.error(resolution.message ?? "Invalid local time");
        return;
      }
      if (resolution.status === "ambiguous") {
        const candidates = values.join(" or ");
        setTimestampResult("");
        setConversionMessage(
          `${resolution.message ?? "The local time is ambiguous"}. Possible ${unitValue}: ${candidates}`,
        );
        setConversionStatus("error");
        if (notify) toast.error("Ambiguous local time; both candidates are shown");
        return;
      }
      setTimestampResult(values[0]);
      setConversionStatus("success");
      setConversionMessage(
        resolution.explicitOffset
          ? "The RFC 3339 offset in the input determined the instant."
          : `Interpreted as a wall time in ${resolution.timeZone}.`,
      );
      if (notify) toast.success("Date-time converted");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Invalid date-time";
      setTimestampResult("");
      setConversionMessage(message);
      setConversionStatus("error");
      if (notify) toast.error(message);
    }
  };

  const convertToTimestamp = () => runConvertToTimestamp(dateInput, unit, timeZone, true);

  const applyCommonTimestamp = (value: string) => {
    setUnit("seconds");
    setTimestamp(value);
    runConvertToDate(value, "seconds", timeZone, false);
  };

  const useCurrentTime = () => {
    const value = currentUnixTimestamp(unit);
    setTimestamp(value);
    try {
      setDateResult(unixToDateTime(value, unit, timeZone).zoned);
      setConversionMessage("");
      setConversionStatus("info");
    } catch (error) {
      setConversionMessage(error instanceof Error ? error.message : "Invalid timezone");
      setConversionStatus("error");
    }
  };

  const currentIso = currentTime
    ? formatIsoInstant(BigInt(currentTime.getTime()) * BigInt(1_000_000))
    : "Loading…";

  return (
    <div className="space-y-6">
      <ToolHeader
        title="Timestamp Converter"
        description="Convert exact Unix seconds, milliseconds, microseconds, or nanoseconds using strict date-time syntax"
        icon={Clock}
      />

      <QuickActions
        actions={[
          { id: "current", label: "Current Time", onClick: useCurrentTime },
          { id: "epoch", label: "Unix Epoch", onClick: () => applyCommonTimestamp("0") },
          { id: "y2k", label: "Y2K", onClick: () => applyCommonTimestamp("946684800") },
          { id: "2038", label: "2038 Limit", onClick: () => applyCommonTimestamp("2147483647") },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <ResultCard title="Current Time" description="Browser clock in UTC" status="info">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">RFC 3339:</span>
                <span className="break-all text-right font-mono">{currentIso}</span>
              </div>
              <Button onClick={useCurrentTime} className="w-full" size="sm">
                Use Current Time
              </Button>
            </div>
          </ResultCard>

          <ResultCard title="Settings" description="Exact unit and output timezone" status="info">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="timestamp-unit">Timestamp unit</Label>
                <Select
                  value={unit}
                  onValueChange={(value) => {
                    const nextUnit = value as UnixTimestampUnit;
                    setUnit(nextUnit);
                    if (dateResult && timestamp.trim()) {
                      runConvertToDate(timestamp, nextUnit, timeZone, false);
                    }
                    if (timestampResult && dateInput.trim()) {
                      runConvertToTimestamp(dateInput, nextUnit, timeZone, false);
                    }
                  }}
                >
                  <SelectTrigger id="timestamp-unit"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="seconds">Seconds</SelectItem>
                    <SelectItem value="milliseconds">Milliseconds</SelectItem>
                    <SelectItem value="microseconds">Microseconds</SelectItem>
                    <SelectItem value="nanoseconds">Nanoseconds</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="timestamp-zone">Timezone</Label>
                <Input
                  id="timestamp-zone"
                  value={timeZone}
                  onChange={(event) => setTimeZone(event.target.value)}
                  placeholder="UTC, local, or Europe/Paris"
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Enter UTC, local, or an IANA name such as America/New_York.
                </p>
              </div>
            </div>
          </ResultCard>
        </div>

        <div className="space-y-4">
          <ResultCard
            title="Timestamp → Date-time"
            description="Decimal input is parsed exactly without floating-point conversion"
            status={dateResult ? "success" : "info"}
          >
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  aria-label="Unix timestamp"
                  value={timestamp}
                  onChange={(event) => setTimestamp(event.target.value)}
                  placeholder={`Enter ${unit}…`}
                  className="font-mono"
                />
                <Button onClick={convertToDate} disabled={!timestamp.trim()} size="sm">Convert</Button>
              </div>
              {dateResult && <CopyableResult value={dateResult} label="Converted date-time" fontFamily="mono" rows={2} />}
              <div className="space-y-1">
                <Label>Common timestamps (seconds)</Label>
                {COMMON_TIMESTAMPS.map((item) => (
                  <button
                    type="button"
                    key={item.name}
                    className="flex w-full items-center justify-between rounded border p-2 text-left text-xs hover:bg-accent"
                    onClick={() => applyCommonTimestamp(item.value)}
                  >
                    <span><strong>{item.name}</strong><br /><span className="text-muted-foreground">{item.description}</span></span>
                    <code>{item.value}</code>
                  </button>
                ))}
              </div>
            </div>
          </ResultCard>

          <ResultCard
            title="Date-time → Timestamp"
            description="Use RFC 3339 with an offset, or an offset-less wall time in the selected timezone"
            status={conversionStatus}
          >
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  aria-label="Date-time"
                  value={dateInput}
                  onChange={(event) => setDateInput(event.target.value)}
                  placeholder="2024-01-15T10:30:00Z"
                  className="font-mono"
                />
                <Button onClick={convertToTimestamp} disabled={!dateInput.trim()} size="sm">Convert</Button>
              </div>
              {timestampResult && (
                <CopyableResult
                  value={timestampResult}
                  label={`Converted timestamp (${unit})`}
                  copyLabel="Copy converted timestamp"
                  fontFamily="mono"
                  rows={1}
                />
              )}
              {conversionMessage && (
                <p
                  role="status"
                  className={`rounded border p-3 text-xs ${
                    conversionStatus === "error"
                      ? "border-destructive/50 text-destructive"
                      : "text-muted-foreground"
                  }`}
                >
                  {conversionMessage}
                </p>
              )}
              <div className="grid gap-1">
                <Label>Strict accepted formats</Label>
                {DATE_EXAMPLES.map((example) => (
                  <button
                    type="button"
                    key={example}
                    className="rounded border p-2 text-left font-mono text-xs hover:bg-accent"
                    onClick={() => {
                      setDateInput(example);
                      runConvertToTimestamp(example, unit, timeZone, false);
                    }}
                  >{example}</button>
                ))}
              </div>
            </div>
          </ResultCard>
        </div>
      </div>

      <ResultCard title="Parsing and timezone behavior" description="No locale-dependent date parsing" status="info">
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>
            RFC 3339 inputs must include <code>T</code> and either <code>Z</code> or an explicit
            numeric offset. Offset-less inputs use <code>YYYY-MM-DD HH:mm:ss</code> and the selected
            UTC, local, or IANA timezone.
          </p>
          <p>
            Local times skipped by a DST transition are rejected. Times repeated during a DST
            transition are reported with both possible timestamps rather than silently guessed.
            Precision is preserved up to nanoseconds; the current browser clock is millisecond-based.
          </p>
        </div>
      </ResultCard>
    </div>
  );
}
