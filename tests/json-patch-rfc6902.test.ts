import { describe, expect, it } from "vitest";

import {
  applyJsonPatch,
  compareJsonObjects,
  JsonPatchError,
  parseJsonPointer,
  tryApplyJsonPatch,
  type JsonPatch,
} from "@/lib/utils/json/json-diff";

describe("RFC 6901 JSON Pointer", () => {
  it("decodes escaped slash, tilde, and empty property names", () => {
    expect(parseJsonPointer("/a~1b/m~0n/")) .toEqual(["a/b", "m~n", ""]);
    expect(parseJsonPointer("")) .toEqual([]);
    expect(parseJsonPointer("/")) .toEqual([""]);
  });

  it.each(["not/a/pointer", "/bad~", "/bad~2escape"])("rejects invalid pointer %s", pointer => {
    expect(() => parseJsonPointer(pointer)).toThrow();
  });
});

describe("RFC 6902 JSON Patch", () => {
  it("applies official-style add, remove, and replace operations", () => {
    const document = { foo: ["bar", "baz"], object: { existing: 1 } };
    const patch: JsonPatch[] = [
      { op: "add", path: "/foo/1", value: "qux" },
      { op: "add", path: "/foo/-", value: "tail" },
      { op: "add", path: "/object/existing", value: 2 },
      { op: "remove", path: "/foo/0" },
      { op: "replace", path: "/object/existing", value: 3 },
    ];
    expect(applyJsonPatch(document, patch)).toEqual({ foo: ["qux", "baz", "tail"], object: { existing: 3 } });
    expect(document).toEqual({ foo: ["bar", "baz"], object: { existing: 1 } });
  });

  it("supports move and copy with independent deep copies", () => {
    const result = applyJsonPatch(
      { items: [{ nested: { value: 1 } }, "second", "third"] },
      [
        { op: "copy", from: "/items/0", path: "/copy" },
        { op: "move", from: "/items/1", path: "/items/2" },
      ],
    ) as { items: unknown[]; copy: { nested: { value: number } } };
    expect(result).toEqual({ items: [{ nested: { value: 1 } }, "third", "second"], copy: { nested: { value: 1 } } });
    result.copy.nested.value = 9;
    expect((result.items[0] as { nested: { value: number } }).nested.value).toBe(1);
  });

  it("implements deep test equality and stops at the first failed test", () => {
    const original = { value: { list: [1, 2] }, untouched: true };
    expect(applyJsonPatch(original, [{ op: "test", path: "/value", value: { list: [1, 2] } }])).toEqual(original);
    const result = tryApplyJsonPatch(original, [
      { op: "replace", path: "/untouched", value: false },
      { op: "test", path: "/value/list/1", value: 3 },
      { op: "add", path: "/never", value: true },
    ]);
    expect(result.success).toBe(false);
    expect(result.appliedOperations).toBe(1);
    expect(result.value).toBeUndefined();
    expect(result.error).toMatchObject({ code: "TEST_FAILED", operationIndex: 1, path: "/value/list/1" });
    expect(original).toEqual({ value: { list: [1, 2] }, untouched: true });
    expect(applyJsonPatch(-0, [{ op: "test", path: "", value: 0 }])).toBe(-0);
  });

  it("handles root operations distinctly from an empty-name property", () => {
    expect(applyJsonPatch({ old: true }, [{ op: "replace", path: "", value: [1, 2] }])).toEqual([1, 2]);
    expect(applyJsonPatch({ old: true }, [{ op: "add", path: "", value: "root" }])).toBe("root");
    expect(applyJsonPatch({ "": "empty", other: true }, [{ op: "remove", path: "/" }])).toEqual({ other: true });
    expect(applyJsonPatch({ old: true }, [{ op: "remove", path: "" }])).toBeUndefined();
    expect(applyJsonPatch({ source: { id: 1 } }, [{ op: "copy", from: "/source", path: "" }])).toEqual({ id: 1 });
  });

  it("resolves escaped object members and safely handles __proto__", () => {
    const result = applyJsonPatch(
      { "a/b": { "m~n": 1 } },
      [
        { op: "replace", path: "/a~1b/m~0n", value: 2 },
        { op: "add", path: "/__proto__", value: { polluted: true } },
      ],
    ) as Record<string, unknown>;
    expect(result["a/b"]).toEqual({ "m~n": 2 });
    expect(Object.prototype).not.toHaveProperty("polluted");
    expect(Object.prototype.hasOwnProperty.call(result, "__proto__")).toBe(true);
  });

  it.each([
    ["/array/01", "INVALID_ARRAY_INDEX"],
    ["/array/-1", "INVALID_ARRAY_INDEX"],
    ["/array/x", "INVALID_ARRAY_INDEX"],
    ["/array/2", "INVALID_ARRAY_INDEX"],
  ])("rejects strict remove index %s", (path, code) => {
    expect(() => applyJsonPatch({ array: [1, 2] }, [{ op: "remove", path }])).toThrowError(expect.objectContaining({ code }));
  });

  it("allows add at the array length but rejects larger indexes and '-' elsewhere", () => {
    expect(applyJsonPatch([1], [{ op: "add", path: "/1", value: 2 }])).toEqual([1, 2]);
    expect(() => applyJsonPatch([1], [{ op: "add", path: "/2", value: 2 }])).toThrowError(JsonPatchError);
    expect(() => applyJsonPatch([1], [{ op: "replace", path: "/-", value: 2 }])).toThrowError(expect.objectContaining({ code: "INVALID_ARRAY_INDEX" }));
  });

  it("requires existing targets for remove and replace", () => {
    expect(() => applyJsonPatch({}, [{ op: "remove", path: "/missing" }])).toThrowError(expect.objectContaining({ code: "PATH_NOT_FOUND" }));
    expect(() => applyJsonPatch({}, [{ op: "replace", path: "/missing", value: 1 }])).toThrowError(expect.objectContaining({ code: "PATH_NOT_FOUND" }));
  });

  it("rejects moving a value into its descendant but permits a same-path no-op", () => {
    const document = { tree: { child: {} } };
    expect(() => applyJsonPatch(document, [{ op: "move", from: "/tree", path: "/tree/child/new" }])).toThrowError(expect.objectContaining({ code: "MOVE_INTO_DESCENDANT" }));
    expect(applyJsonPatch(document, [{ op: "move", from: "/tree", path: "/tree" }])).toEqual(document);
    expect(() => applyJsonPatch(document, [{ op: "move", from: "/missing", path: "/missing" }])).toThrowError(expect.objectContaining({ code: "PATH_NOT_FOUND" }));
  });

  it("returns typed errors for malformed operations and pointers", () => {
    const malformed = tryApplyJsonPatch({}, [{ op: "add", path: "/x" } as JsonPatch]);
    expect(malformed.error).toBeInstanceOf(JsonPatchError);
    expect(malformed.error).toMatchObject({ code: "MISSING_MEMBER", operationIndex: 0 });
    expect(() => applyJsonPatch({}, [{ op: "remove", path: "/bad~2" }])).toThrowError(expect.objectContaining({ code: "INVALID_POINTER" }));
    expect(() => applyJsonPatch({}, [{ op: "increment" } as unknown as JsonPatch])).toThrowError(expect.objectContaining({ code: "INVALID_OPERATION" }));
  });
});

describe("applicable JSON diff generation", () => {
  it.each([
    [{ list: [1, 2, 3, 4] }, { list: [1] }],
    [{ list: [1] }, { list: [1, 2, 3] }],
    [{ "a/b": { "~key": 1 }, remove: true }, { "a/b": { "~key": 2 }, added: null }],
    [null, { root: true }],
    [{ root: true }, [1, 2]],
  ])("generates a patch that transforms %# into %#", (left, right) => {
    const result = compareJsonObjects(left, right);
    expect(applyJsonPatch(left, result.patches)).toEqual(right);
  });

  it("deep-copies generated patch values", () => {
    const target = { nested: { value: 1 } };
    const result = compareJsonObjects({}, target);
    target.nested.value = 2;
    expect(applyJsonPatch({}, result.patches)).toEqual({ nested: { value: 1 } });
  });
});
