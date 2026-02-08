import { describe, expect, it } from "vitest";

import {
  generateSchemaFromData,
  JSON_SCHEMA_DRAFT_2020_12,
  validateJsonSchema,
  type JsonSchema,
} from "@/lib/utils/json/json-schema";

const valid = (data: unknown, schema: JsonSchema) => validateJsonSchema(data, schema).isValid;

describe("JSON Schema Draft 2020-12 validation", () => {
  it("treats integers as numbers while rejecting fractions as integers", () => {
    expect(valid(2, { type: "number" })).toBe(true);
    expect(valid(2.5, { type: "number" })).toBe(true);
    expect(valid(2, { type: "integer" })).toBe(true);
    expect(valid(2.5, { type: "integer" })).toBe(false);
  });

  it("applies prefixItems and then items to remaining entries", () => {
    const schema: JsonSchema = {
      type: "array",
      prefixItems: [{ type: "string" }, { type: "integer" }],
      items: { type: "boolean" },
    };
    expect(valid(["id", 1, true, false], schema)).toBe(true);
    expect(valid(["id", 1, "extra"], schema)).toBe(false);
    expect(valid(["id", 1, true], { ...schema, items: false })).toBe(false);
  });

  it("tracks evaluated object properties across applicators", () => {
    const schema: JsonSchema = {
      type: "object",
      allOf: [{ properties: { name: { type: "string" } } }],
      properties: { id: { type: "integer" } },
      unevaluatedProperties: false,
    };
    expect(valid({ id: 1, name: "Ada" }, schema)).toBe(true);
    const result = validateJsonSchema({ id: 1, name: "Ada", extra: true }, schema);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(error => error.keyword === "unevaluatedProperties" && error.path === "$.extra")).toBe(true);
  });

  it("supports unevaluatedItems after prefixItems", () => {
    const schema: JsonSchema = { type: "array", prefixItems: [{ type: "string" }], unevaluatedItems: false };
    expect(valid(["only"], schema)).toBe(true);
    expect(valid(["only", 2], schema)).toBe(false);
  });

  it("resolves local $defs and recursive $ref safely", () => {
    const schema: JsonSchema = {
      $defs: {
        node: {
          type: "object",
          required: ["value"],
          properties: {
            value: { type: "integer" },
            next: { anyOf: [{ $ref: "#/$defs/node" }, { type: "null" }] },
          },
          additionalProperties: false,
        },
      },
      $ref: "#/$defs/node",
    };
    expect(valid({ value: 1, next: { value: 2, next: null } }, schema)).toBe(true);
    expect(valid({ value: 1, next: { value: 2.5, next: null } }, schema)).toBe(false);
  });

  it("implements dependentRequired and dependentSchemas", () => {
    const schema: JsonSchema = {
      type: "object",
      properties: { card: { type: "string" }, billing: { type: "string" }, country: { type: "string" }, postalCode: {} },
      dependentRequired: { card: ["billing"] },
      dependentSchemas: {
        country: { properties: { postalCode: { type: "string" } }, required: ["postalCode"] },
      },
    };
    expect(valid({ card: "123", billing: "home", country: "VN", postalCode: "70000" }, schema)).toBe(true);
    expect(valid({ card: "123" }, schema)).toBe(false);
    expect(valid({ country: "VN" }, schema)).toBe(false);
  });

  it("supports contains with minContains and maxContains", () => {
    const schema: JsonSchema = { type: "array", contains: { type: "integer", minimum: 2 }, minContains: 2, maxContains: 3 };
    expect(valid([2, 3, "x"], schema)).toBe(true);
    expect(valid([2, "x"], schema)).toBe(false);
    expect(valid([2, 3, 4, 5], schema)).toBe(false);
  });

  it("supports dynamic recursive references", () => {
    const schema: JsonSchema = {
      $dynamicAnchor: "node",
      type: "object",
      required: ["value"],
      properties: {
        value: { type: "integer" },
        children: { type: "array", items: { $dynamicRef: "#node" } },
      },
      additionalProperties: false,
    };
    expect(valid({ value: 1, children: [{ value: 2, children: [] }] }, schema)).toBe(true);
    expect(valid({ value: 1, children: [{ value: "bad" }] }, schema)).toBe(false);
  });

  it("fails malformed, external, and JavaScript-cyclic schemas without throwing", () => {
    const malformed = validateJsonSchema(1, { type: "not-a-type" });
    expect(malformed.isValid).toBe(false);
    expect(malformed.errors[0].message).toContain("Invalid Draft 2020-12 schema");

    const external = validateJsonSchema({}, { $ref: "https://untrusted.invalid/schema" });
    expect(external.isValid).toBe(false);
    expect(external.errors[0].message).toMatch(/can't resolve reference|resolve ref/i);

    const cyclic: Record<string, unknown> = {};
    cyclic.self = cyclic;
    const cyclicResult = validateJsonSchema({}, cyclic as JsonSchema);
    expect(cyclicResult.isValid).toBe(false);
    expect(cyclicResult.errors[0].message).toContain("cannot contain JavaScript object cycles");

    const cyclicData: Record<string, unknown> = {};
    cyclicData.self = cyclicData;
    const cyclicDataResult = validateJsonSchema(cyclicData, { $dynamicAnchor: "node", properties: { self: { $dynamicRef: "#node" } } });
    expect(cyclicDataResult.isValid).toBe(false);
    expect(cyclicDataResult.errors[0].keyword).toBe("data");
    expect(cyclicDataResult.errors[0].message).toContain("cannot contain JavaScript object cycles");
  });

  it("generates an explicit 2020-12 schema and considers all sampled array item shapes", () => {
    const schema = generateSchemaFromData([{ id: 1 }, "label"]);
    expect(schema.$schema).toBe(JSON_SCHEMA_DRAFT_2020_12);
    expect(schema.items).toEqual({ anyOf: [expect.objectContaining({ type: "object" }), { type: "string" }] });
    expect(valid([{ id: 2 }, "other"], schema)).toBe(true);
  });
});
