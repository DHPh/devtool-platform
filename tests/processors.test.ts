import { describe, expect, it } from "vitest";

import { decodeBase64, encodeBase64 } from "@/lib/processors/base64";
import { detectDelimiter, parseCSV } from "@/lib/processors/csv";
import { ProcessorError } from "@/lib/processors/errors";
import { formatJson, minifyJson, validateJson } from "@/lib/processors/json";
import { convertTextCase, convertTextToAllCases } from "@/lib/processors/text";
import {
  decodeUrlComponent,
  encodeFullUrl,
  encodeUrlComponent,
} from "@/lib/processors/url";

describe("Base64 processor", () => {
  it("encodes and decodes ASCII text", () => {
    const encoded = encodeBase64("Hello, World!");

    expect(encoded).toBe("SGVsbG8sIFdvcmxkIQ==");
    expect(decodeBase64(encoded)).toBe("Hello, World!");
  });

  it("reports malformed Base64 with a typed error", () => {
    expect(() => decodeBase64("%%%invalid%%%"))
      .toThrowError(ProcessorError);
  });
});

describe("JSON processor", () => {
  it("formats, minifies, and validates JSON", () => {
    const input = '{"name":"DevTool","enabled":true}';

    expect(formatJson(input, { indentSize: 2 }).result).toContain(
      '\n  "name": "DevTool"'
    );
    expect(minifyJson(`{\n  "name": "DevTool"\n}`).result).toBe(
      '{"name":"DevTool"}'
    );
    expect(validateJson(input)).toEqual({ isValid: true });
  });

  it("returns validation details and throws typed transformation errors", () => {
    expect(validateJson("{").isValid).toBe(false);
    expect(() => formatJson("{")).toThrowError(ProcessorError);
  });
});

describe("CSV processor", () => {
  it("detects delimiters and parses typed rows", () => {
    const input = "name;age;active\nLan;30;true";
    const result = parseCSV(input);

    expect(detectDelimiter(input)).toBe(";");
    expect(result).toMatchObject({
      delimiter: ";",
      headers: ["name", "age", "active"],
      rowCount: 1,
      data: [{ name: "Lan", age: 30, active: true }],
    });
  });
});

describe("URL processor", () => {
  it("encodes URL components, preserves URL structure, and decodes values", () => {
    const input = "https://example.com/café?q=hello world";

    expect(encodeUrlComponent(input)).toBe(
      "https%3A%2F%2Fexample.com%2Fcaf%C3%A9%3Fq%3Dhello%20world"
    );
    expect(encodeFullUrl(input)).toBe(
      "https://example.com/caf%C3%A9?q=hello%20world"
    );
    expect(decodeUrlComponent("caf%C3%A9%20menu")).toBe("café menu");
  });

  it("reports malformed percent encoding with a typed error", () => {
    expect(() => decodeUrlComponent("%E0%A4%A"))
      .toThrowError(ProcessorError);
  });
});

describe("text processor", () => {
  it("converts text without React or browser state", () => {
    expect(convertTextCase("Hello World", "camelCase")).toBe("helloWorld");
    expect(convertTextCase("myVariableName", "snake_case")).toBe(
      "my_variable_name"
    );
    expect(convertTextCase("hello WORLD", "Title Case")).toBe("Hello World");
    expect(convertTextToAllCases("Hello World")).toHaveLength(12);
  });
});
