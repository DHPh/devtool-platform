import { describe, expect, it } from "vitest";
import { validateEmailSyntax } from "@/lib/processors/email";

describe("email syntax validation scope", () => {
  it("accepts common dot-atom syntax without claiming deliverability", () => {
    expect(validateEmailSyntax("dev+alerts@example.com")).toMatchObject({
      isValid: true,
      normalizedEmail: "dev+alerts@example.com",
      scope: "syntax-only",
      deliverability: "not-checked",
    });
  });

  it("normalizes internationalized domains to ASCII IDN form", () => {
    const result = validateEmailSyntax("hello@bücher.de");
    expect(result.isValid).toBe(true);
    expect(result.normalizedEmail).toBe("hello@xn--bcher-kva.de");
    expect(result.warnings).toContain("Internationalized domain normalized to xn--bcher-kva.de");
  });

  it.each([
    ".leading@example.com",
    "trailing.@example.com",
    "double..dot@example.com",
    "two@@example.com",
    "space here@example.com",
    "dev@-example.com",
    "dev@example..com",
    "dev@%65xample.com",
    "dev@example%2Ecom",
    "dev@bücher%2Ede",
    "δοκιμή@example.com",
  ])("rejects unsupported or malformed syntax %s", (email) => {
    expect(validateEmailSyntax(email).isValid).toBe(false);
  });

  it("does not let WHATWG URL normalization reinterpret URL escapes as DNS syntax", () => {
    const result = validateEmailSyntax("dev@example%2ecom");

    expect(result).toMatchObject({
      isValid: false,
      normalizedEmail: undefined,
    });
    expect(result.errors).toContain("Domain is not a valid DNS or internationalized domain name");
  });

  it("warns that single-label domains are not public deliverability proof", () => {
    const result = validateEmailSyntax("dev@localhost");
    expect(result.isValid).toBe(true);
    expect(result.warnings.join(" ")).toMatch(/private networks/);
    expect(result.warnings.join(" ")).toMatch(/deliverability are not checked/);
  });
});
