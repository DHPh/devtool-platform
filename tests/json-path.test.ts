import { describe, expect, it } from "vitest";

import {
  extractAllPaths,
  getValueByPath,
  queryJsonPath,
  validateJsonPath,
} from "@/lib/utils/json/json-path";

const fixture = {
  limit: 12,
  store: {
    book: [
      { title: "A", price: 8, active: true, isbn: "a-1" },
      { title: "B", price: 12, active: true },
      { title: "C", price: 15, active: false, isbn: "c-1" },
      { title: "D", price: 5, active: true },
    ],
    bicycle: { price: 19 },
  },
  "odd.key": { "quote'name": 42 },
};

const values = (expression: string) =>
  queryJsonPath(fixture, expression).results.map((result) => result.value);

describe("RFC 9535 JSONPath selector core", () => {
  it("supports root, shorthand children, quoted names, and normalized paths", () => {
    expect(values("$")).toEqual([fixture]);
    const result = queryJsonPath(fixture, "$['odd.key'][\"quote'name\"]");
    expect(result.results).toEqual([
      { path: "$['odd.key']['quote\\'name']", value: 42, type: "number" },
    ]);
    expect(getValueByPath(fixture, "store.book[0].title")).toBe("A");
  });

  it("supports child wildcards and selector unions in document order", () => {
    expect(values("$.store.book[*].title")).toEqual(["A", "B", "C", "D"]);
    expect(values("$.store.book[0,2,-1].title")).toEqual(["A", "C", "D"]);
    expect(values("$['store','limit']")).toEqual([fixture.store, 12]);
  });

  it("retains duplicate nodes selected by a union", () => {
    const result = queryJsonPath(fixture, "$.store.book[0,0].title");
    expect(result.results.map((entry) => entry.path)).toEqual([
      "$['store']['book'][0]['title']",
      "$['store']['book'][0]['title']",
    ]);
  });

  it("supports descendant name and wildcard segments", () => {
    const prices = queryJsonPath(fixture, "$..price");
    expect(prices.results.map((entry) => entry.path)).toEqual([
      "$['store']['book'][0]['price']",
      "$['store']['book'][1]['price']",
      "$['store']['book'][2]['price']",
      "$['store']['book'][3]['price']",
      "$['store']['bicycle']['price']",
    ]);
    expect(queryJsonPath({ a: { b: 1 } }, "$..*").count).toBe(2);
  });

  it("implements forward, negative, stepped, and reverse array slices", () => {
    expect(values("$.store.book[1:4:2].title")).toEqual(["B", "D"]);
    expect(values("$.store.book[-2:].title")).toEqual(["C", "D"]);
    expect(values("$.store.book[::-1].title")).toEqual(["D", "C", "B", "A"]);
    expect(values("$.store.book[3:0:-2].title")).toEqual(["D", "B"]);
    expect(values("$.store.book[::0]")).toEqual([]);
  });
});

describe("JSONPath basic filter subset", () => {
  it("supports comparisons, existence, and logical operators", () => {
    expect(values("$.store.book[?@.price < 10 && @.active == true].title")).toEqual([
      "A",
      "D",
    ]);
    expect(values("$.store.book[?@.isbn].title")).toEqual(["A", "C"]);
    expect(values("$.store.book[?(@.price >= 15 || !@.active)].title")).toEqual([
      "C",
    ]);
  });

  it("supports root and current singular queries in comparisons", () => {
    expect(values("$.store.book[?@.price < $.limit].title")).toEqual(["A", "D"]);
    expect(values("$.store.book[?@['title'] == 'B'].price")).toEqual([12]);
  });

  it("does not traverse inherited properties or execute member text", () => {
    const payload = JSON.parse('{"__proto__":{"polluted":true},"constructor":"safe"}');
    expect(queryJsonPath(payload, "$['__proto__'].polluted").results[0]?.value).toBe(true);
    expect(queryJsonPath({}, "$['polluted']").count).toBe(0);
    expect(({} as { polluted?: boolean }).polluted).toBeUndefined();
  });
});

describe("JSONPath validation and traversal safety", () => {
  it.each([
    "",
    "store.book",
    "$.",
    "$[",
    "$[]",
    "$[1:2:3:4]",
    "$[?length(@) > 1]",
    "$[?false]",
    "$[?@.x == 1 || globalThis.compromised]",
    "$['bad\\q']",
  ])("rejects malformed or unsupported expression %j", (expression) => {
    expect(validateJsonPath(expression).isValid).toBe(false);
    expect(() => queryJsonPath(fixture, expression)).toThrow();
  });

  it("extracts normalized paths and terminates on cyclic non-JSON input", () => {
    const cyclic: { self?: unknown; value: number } = { value: 1 };
    cyclic.self = cyclic;
    expect(extractAllPaths(cyclic).map((entry) => entry.path)).toEqual([
      "$",
      "$['value']",
      "$['self']",
    ]);
  });
});
