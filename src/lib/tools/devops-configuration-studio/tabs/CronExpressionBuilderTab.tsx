"use client";

import { useMemo, useState } from "react";
import {
  CopyableResult,
  ToolErrorResult as ErrorResult,
  ToolSectionHeader as Header,
} from "@/components/layout";
import { Input } from "@/components/ui/input";
import { inspectCronExpression } from "@/lib/processors/devops-config-core";

export function CronExpressionBuilderTab() {
  const [expression, setExpression] = useState("*/15 9-17 * * 1-5");
  const [timezone, setTimezone] = useState("UTC");
  const result = useMemo(
    () => inspectCronExpression(expression, { timezone }),
    [expression, timezone],
  );

  const zone = timezone || "UTC";
  const localTime = useMemo(() => {
    if (!result.ok || zone === "UTC") return null;
    try {
      return new Intl.DateTimeFormat("en-GB", {
        timeZone: zone,
        dateStyle: "medium",
        timeStyle: "long",
      });
    } catch {
      return null;
    }
  }, [result.ok, zone]);

  return (
    <section className="space-y-5">
      <Header
        title="Cron Expression Builder"
        description="Parse a five-field cron schedule and preview its next runs in the selected timezone and UTC."
      />
      <div className="grid gap-4 sm:grid-cols-[1fr_14rem]">
        <label className="space-y-2">
          <span className="text-sm font-medium">Cron expression</span>
          <Input
            value={expression}
            onChange={(event) => setExpression(event.target.value)}
            className="font-mono"
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium">IANA timezone</span>
          <Input
            value={timezone}
            onChange={(event) => setTimezone(event.target.value)}
            placeholder="UTC"
          />
        </label>
      </div>
      {result.ok ? (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <CopyableResult
              value={result.value.expression}
              label="Normalized expression"
              copyLabel="Copy expression"
              rows={2}
            />
            <CopyableResult
              value={result.value.explanation}
              label="Explanation"
              copyLabel="Copy explanation"
              rows={3}
            />
          </div>
          <div>
            <h3 className="mb-2 text-sm font-medium">Next runs</h3>
            <div className="grid gap-3 md:grid-cols-2">
              {result.value.nextRuns.map((run, index) => (
                <CopyableResult
                  key={run}
                  value={localTime ? localTime.format(new Date(run)) + " (" + zone + ")\n" + run : run}
                  label={`Run ${index + 1}`}
                  copyLabel={`Copy run ${index + 1}`}
                  rows={localTime ? 2 : 1}
                />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <ErrorResult message={result.error} />
      )}
    </section>
  );
}
