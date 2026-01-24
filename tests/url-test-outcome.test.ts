import { describe, expect, it } from "vitest";

import { classifyUrlTestOutcome } from "@/lib/utils/network/url-test-outcome";

describe("URL test outcomes", () => {
  it("treats a reachable HTTP 406 response as a completed HTTP result", () => {
    expect(
      classifyUrlTestOutcome({ accessible: true, statusCode: 406 }),
    ).toBe("http-error");
  });

  it("distinguishes successful responses from network or policy failures", () => {
    expect(
      classifyUrlTestOutcome({ accessible: true, statusCode: 200 }),
    ).toBe("success");
    expect(
      classifyUrlTestOutcome({
        accessible: false,
        error: "Destination is not allowed",
      }),
    ).toBe("failure");
  });
});
