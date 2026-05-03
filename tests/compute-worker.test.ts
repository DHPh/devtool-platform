// @vitest-environment node

import { describe, expect, it, vi } from "vitest";
import { executeComputeTask } from "@/lib/workers/compute-tasks";
import {
  runComputeTask,
  runRegexTestWithTimeout,
  type WorkerLike,
} from "@/lib/workers/compute-client";

describe("compute worker tasks & timeout cancellation", () => {
  it("runs regex-test, regex-replace, text-diff, and file-hash tasks cleanly", async () => {
    const regexTest = await executeComputeTask({
      type: "regex-test",
      pattern: "\\d+",
      text: "order 42 and 99",
      flags: "g",
    });
    expect(regexTest.ok).toBe(true);
    if (regexTest.ok) {
      expect(regexTest.value.totalMatches).toBe(2);
    }

    const regexReplace = await executeComputeTask({
      type: "regex-replace",
      pattern: "foo",
      text: "foo bar foo",
      replacement: "baz",
      flags: "g",
    });
    expect(regexReplace.ok).toBe(true);
    if (regexReplace.ok) {
      expect(regexReplace.value.result).toBe("baz bar baz");
      expect(regexReplace.value.replacementCount).toBe(2);
    }

    const diffResult = await executeComputeTask({
      type: "text-diff",
      left: "a\nb",
      right: "a\nc",
      options: { level: "line", ignoreWhitespace: false, ignoreCase: false },
    });
    expect(diffResult.ok).toBe(true);
    if (diffResult.ok) {
      expect(diffResult.value.stats.additions).toBe(1);
      expect(diffResult.value.stats.deletions).toBe(1);
    }

    const bytes = new TextEncoder().encode("abc");
    const md5Hash = await executeComputeTask({
      type: "file-hash",
      bytes,
      algorithm: "md5",
    });
    expect(md5Hash).toEqual({
      ok: true,
      value: "900150983cd24fb0d6963f7d28e17f72",
    });
  });

  it("guards against excessive character-level diff matrix allocations", async () => {
    const longA = "a".repeat(2500);
    const longB = "b".repeat(2500);
    const oversized = await executeComputeTask({
      type: "text-diff",
      left: longA,
      right: longB,
      options: { level: "char", ignoreWhitespace: false, ignoreCase: false },
    });

    expect(oversized.ok).toBe(false);
    if (!oversized.ok) {
      expect(oversized.error).toContain("Character-level diff is limited");
    }
  });

  it("terminates a hanging worker immediately when timeout elapses", async () => {
    const terminateSpy = vi.fn();
    const postMessageSpy = vi.fn();
    const mockWorker: WorkerLike = {
      postMessage: postMessageSpy,
      terminate: terminateSpy,
      onmessage: null,
      onerror: null,
    };

    const result = await runRegexTestWithTimeout("(a+)+$", "aaaaaaaaaaaa!", "g", {
      timeoutMs: 25,
      workerFactory: () => mockWorker,
    });

    expect(postMessageSpy).toHaveBeenCalledTimes(1);
    expect(terminateSpy).toHaveBeenCalledTimes(1);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("timed out");
    }
  });

  it("terminates an active worker when aborted via AbortController", async () => {
    const terminateSpy = vi.fn();
    const mockWorker: WorkerLike = {
      postMessage: vi.fn(),
      terminate: terminateSpy,
      onmessage: null,
      onerror: null,
    };

    const controller = new AbortController();
    const pending = runComputeTask(
      { type: "regex-test", pattern: "abc", text: "abc", flags: "g" },
      { timeoutMs: 5000, signal: controller.signal, workerFactory: () => mockWorker },
    );

    controller.abort();
    const result = await pending;

    expect(terminateSpy).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ ok: false, error: "Task aborted." });
  });
});
