// @vitest-environment node

import { createHash } from "node:crypto";
import { webcrypto } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  checkMultiplePasswordBreaches,
  checkPasswordBreach,
  generateSecurityRecommendations,
  isCommonPassword,
} from "@/lib/utils/password/breach-checker";

describe("breach-checker (HIBP k-anonymity)", () => {
  beforeEach(() => {
    vi.stubGlobal("crypto", webcrypto);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("returns warning immediately without network calls for empty input", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const result = await checkPasswordBreach("");
    expect(result.isBreached).toBeNull();
    expect(result.severity).toBe("warning");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("queries HIBP using only the first 5 SHA-1 hex chars and detects breached passwords", async () => {
    const secret = "Hunter2Secret!";
    const sha1Hex = createHash("sha1")
      .update(secret)
      .digest("hex")
      .toUpperCase();
    const prefix = sha1Hex.slice(0, 5);
    const suffix = sha1Hex.slice(5);

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(`00000000000000000000000000000000000:1\n${suffix}:3861493\n`, {
        status: 200,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await checkPasswordBreach(secret);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [calledUrl] = fetchMock.mock.calls[0] as [string];
    expect(calledUrl).toBe(`https://api.pwnedpasswords.com/range/${prefix}`);
    expect(calledUrl).not.toContain(secret);
    expect(calledUrl).not.toContain(suffix);

    expect(result.isBreached).toBe(true);
    expect(result.breachCount).toBe(3861493);
    expect(result.severity).toBe("danger");
  });

  it("marks small breach counts (<= 10) as warning and absent hashes as safe", async () => {
    const sha1Hex = createHash("sha1")
      .update("semi-unique-secret-42")
      .digest("hex")
      .toUpperCase();
    const suffix = sha1Hex.slice(5);

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce(new Response(`${suffix}:4\n`, { status: 200 })),
    );
    const lowCount = await checkPasswordBreach("semi-unique-secret-42");
    expect(lowCount.isBreached).toBe(true);
    expect(lowCount.breachCount).toBe(4);
    expect(lowCount.severity).toBe("warning");

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce(
        new Response("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA:9\n", { status: 200 }),
      ),
    );
    const clean = await checkPasswordBreach("BrandNew!99VaultKey#482");
    expect(clean.isBreached).toBe(false);
    expect(clean.breachCount).toBe(0);
    expect(clean.severity).toBe("safe");
  });

  it("handles API HTTP errors and network failures safely", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce(new Response("Service Unavailable", { status: 503 })),
    );
    const apiError = await checkPasswordBreach("some-password");
    expect(apiError.isBreached).toBeNull();
    expect(apiError.severity).toBe("warning");

    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValueOnce(new Error("Network offline")),
    );
    const networkError = await checkPasswordBreach("some-password");
    expect(networkError.isBreached).toBeNull();
    expect(networkError.severity).toBe("warning");
  });

  it("checks multiple passwords, detects common passwords, and builds recommendations", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(() =>
        Promise.resolve(
          new Response("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA:1\n", {
            status: 200,
          }),
        ),
      ),
    );

    const batch = await checkMultiplePasswordBreaches(["alpha1", "beta2"]);
    expect(batch).toHaveLength(2);
    expect(batch.map((entry) => entry.password)).toEqual(["alpha1", "beta2"]);

    expect(isCommonPassword("Password")).toBe(true);
    expect(isCommonPassword("C0rrect!Horse#Battery99")).toBe(false);

    const weakRecs = generateSecurityRecommendations("password", {
      isBreached: true,
      breachCount: 1000,
      message: "Breached",
      severity: "danger",
      checkedAt: new Date(),
    });
    expect(weakRecs.some((msg) => msg.includes("Change this password immediately"))).toBe(true);
    expect(weakRecs.some((msg) => msg.includes("uppercase"))).toBe(true);

    const strongRecs = generateSecurityRecommendations("Tr0ub4dor&3!LongKey", {
      isBreached: false,
      breachCount: 0,
      message: "Clean",
      severity: "safe",
      checkedAt: new Date(),
    });
    expect(strongRecs.some((msg) => msg.includes("good password"))).toBe(true);
  });
});
