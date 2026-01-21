import { describe, expect, it } from "vitest";

import { formatJson } from "@/lib/processors/json";
import { convertTextCase } from "@/lib/processors/text";
import { generatePassword } from "@/lib/utils/password/password-generator";
import { isValidUrl } from "@/lib/utils/network/url-validator";

describe("representative tool behavior", () => {
  it("covers a formatter and converter", () => {
    expect(formatJson('{"ok":true}').result).toBe('{\n  "ok": true\n}');
    expect(convertTextCase("Dev Tool Platform", "kebab-case"))
      .toBe("dev-tool-platform");
  });

  it("covers a generator", () => {
    const password = generatePassword({
      length: 16,
      includeUppercase: true,
      includeLowercase: true,
      includeNumbers: true,
      includeSymbols: true,
      excludeSimilar: false,
      excludeAmbiguous: false,
    });

    expect(password).toHaveLength(16);
    expect(password).toMatch(/[A-Z]/);
    expect(password).toMatch(/[a-z]/);
    expect(password).toMatch(/[0-9]/);
    expect(password).toMatch(/[^a-zA-Z0-9]/);
  });

  it("covers a validator", () => {
    expect(isValidUrl("https://example.com/path?q=value")).toBe(true);
    expect(isValidUrl("not a URL")).toBe(false);
  });
});
