import { describe, expect, it } from "vitest";

import { getProcessingInfo } from "@/lib/tool-processing";

describe("tool processing labels", () => {
  it.each([
    ["client", "Browser processing"],
    ["server", "Server processing"],
    ["hybrid", "Browser + server"],
  ] as const)("describes %s processing", (mode, label) => {
    const info = getProcessingInfo(mode);

    expect(info.label).toBe(label);
    expect(info.description.length).toBeGreaterThan(20);
  });
});
