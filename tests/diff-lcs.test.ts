import { describe, expect, it } from "vitest";

import { calculateTextDiff } from "@/lib/processors/ui-primitives";

describe("LCS text diff algorithm", () => {
  it("handles top-of-file insertion without cascading false removals", () => {
    const result = calculateTextDiff("a\nb\nc", "HEADER\na\nb\nc");

    expect(result.stats).toEqual({
      additions: 1,
      deletions: 0,
      changes: 1,
    });
    expect(result.lines).toEqual([
      { type: "added", text: "HEADER", lineNumber: 1, newLineNumber: 1 },
      { type: "unchanged", text: "a", lineNumber: 1, oldLineNumber: 1, newLineNumber: 2 },
      { type: "unchanged", text: "b", lineNumber: 2, oldLineNumber: 2, newLineNumber: 3 },
      { type: "unchanged", text: "c", lineNumber: 3, oldLineNumber: 3, newLineNumber: 4 },
    ]);
    expect(result.splitRows).toEqual([
      { left: null, right: { type: "added", text: "HEADER", lineNumber: 1 } },
      {
        left: { type: "unchanged", text: "a", lineNumber: 1 },
        right: { type: "unchanged", text: "a", lineNumber: 2 },
      },
      {
        left: { type: "unchanged", text: "b", lineNumber: 2 },
        right: { type: "unchanged", text: "b", lineNumber: 3 },
      },
      {
        left: { type: "unchanged", text: "c", lineNumber: 3 },
        right: { type: "unchanged", text: "c", lineNumber: 4 },
      },
    ]);
  });

  it("handles trailing deletions cleanly", () => {
    const result = calculateTextDiff("keep\nremove1\nremove2", "keep");

    expect(result.stats).toEqual({
      additions: 0,
      deletions: 2,
      changes: 2,
    });
    expect(result.splitRows).toEqual([
      {
        left: { type: "unchanged", text: "keep", lineNumber: 1 },
        right: { type: "unchanged", text: "keep", lineNumber: 1 },
      },
      { left: { type: "removed", text: "remove1", lineNumber: 2 }, right: null },
      { left: { type: "removed", text: "remove2", lineNumber: 3 }, right: null },
    ]);
  });

  it("preserves line boundaries when ignoreWhitespace is true in line mode", () => {
    const result = calculateTextDiff(
      "  alpha   beta \nsecond line",
      "alpha beta\nsecond changed",
      { level: "line", ignoreWhitespace: true },
    );

    expect(result.lines[0]).toMatchObject({
      type: "unchanged",
      text: "  alpha   beta ",
      oldLineNumber: 1,
      newLineNumber: 1,
    });
    expect(result.stats).toEqual({
      additions: 1,
      deletions: 1,
      changes: 1,
    });
  });

  it("pairs replacements horizontally in aligned splitRows", () => {
    const result = calculateTextDiff("alpha\nbeta\ngamma", "alpha\nbeta-2\nadded\ngamma");

    expect(result.stats).toEqual({
      additions: 2,
      deletions: 1,
      changes: 2,
    });
    expect(result.splitRows).toEqual([
      {
        left: { type: "unchanged", text: "alpha", lineNumber: 1 },
        right: { type: "unchanged", text: "alpha", lineNumber: 1 },
      },
      {
        left: { type: "removed", text: "beta", lineNumber: 2 },
        right: { type: "added", text: "beta-2", lineNumber: 2 },
      },
      {
        left: null,
        right: { type: "added", text: "added", lineNumber: 3 },
      },
      {
        left: { type: "unchanged", text: "gamma", lineNumber: 3 },
        right: { type: "unchanged", text: "gamma", lineNumber: 4 },
      },
    ]);
  });
});
