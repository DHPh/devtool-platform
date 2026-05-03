import type { ProcessorResult } from "../processors/result";
import {
  hashBytes,
  md5Bytes,
  type FileHashAlgorithm,
  type WebCryptoHashAlgorithm,
} from "../processors/file-core";
import {
  calculateTextDiff,
  type DiffEntry,
  type DiffLevel,
  type DiffSplitRow,
} from "../processors/ui-primitives";
import { regexReplace } from "../utils/regex/regex-replace";
import { testRegex, type RegexTestResult } from "../utils/regex/regex-tester";

export const MAX_WORKER_CHAR_DIFF_CELLS = 4_000_000;

export interface RegexReplaceOutcome {
  isValid: boolean;
  result: string;
  replacementCount: number;
  error?: string;
}

export interface TextDiffOutcome {
  lines: DiffEntry[];
  splitRows: DiffSplitRow[];
  stats: { additions: number; deletions: number; changes: number };
}

export type ComputeTaskRequest =
  | {
      type: "regex-test";
      pattern: string;
      text: string;
      flags: string;
    }
  | {
      type: "regex-replace";
      pattern: string;
      text: string;
      replacement: string;
      flags: string;
    }
  | {
      type: "text-diff";
      left: string;
      right: string;
      options: {
        level: DiffLevel;
        ignoreWhitespace: boolean;
        ignoreCase: boolean;
      };
    }
  | {
      type: "file-hash";
      bytes: Uint8Array;
      algorithm: FileHashAlgorithm;
    };

export type ComputeTaskValueMap = {
  "regex-test": RegexTestResult;
  "regex-replace": RegexReplaceOutcome;
  "text-diff": TextDiffOutcome;
  "file-hash": string;
};

export type ComputeTaskResponse<
  K extends ComputeTaskRequest["type"] = ComputeTaskRequest["type"],
> = ProcessorResult<ComputeTaskValueMap[K]>;

/**
 * Pure, DOM-free task dispatcher shared between the dedicated Web Worker
 * and fallback execution environments (SSR / tests without Worker).
 */
export async function executeComputeTask<
  T extends ComputeTaskRequest = ComputeTaskRequest,
>(request: T): Promise<ComputeTaskResponse<T["type"]>> {
  try {
    switch (request.type) {
      case "regex-test": {
        return {
          ok: true,
          value: testRegex(request.pattern, request.text, request.flags),
        } as ComputeTaskResponse<T["type"]>;
      }
      case "regex-replace": {
        const validation = testRegex(request.pattern, request.text, request.flags);
        if (!validation.isValid) {
          return {
            ok: true,
            value: {
              isValid: false,
              result: request.text,
              replacementCount: 0,
              error: validation.error,
            },
          } as ComputeTaskResponse<T["type"]>;
        }
        const replaced = regexReplace(
          request.text,
          request.pattern,
          request.replacement,
          request.flags,
        );
        return {
          ok: true,
          value: {
            isValid: true,
            result: replaced.result,
            replacementCount: replaced.replacements,
          },
        } as ComputeTaskResponse<T["type"]>;
      }
      case "text-diff": {
        if (
          request.options.level === "char" &&
          request.left.length * request.right.length > MAX_WORKER_CHAR_DIFF_CELLS
        ) {
          return {
            ok: false,
            error:
              "Character-level diff is limited to smaller inputs to prevent memory exhaustion. Switch to Line or Word level.",
          };
        }
        return {
          ok: true,
          value: calculateTextDiff(request.left, request.right, request.options),
        } as ComputeTaskResponse<T["type"]>;
      }
      case "file-hash": {
        if (request.algorithm === "md5") {
          return {
            ok: true,
            value: md5Bytes(request.bytes),
          } as ComputeTaskResponse<T["type"]>;
        }
        const algorithms: Record<
          Exclude<FileHashAlgorithm, "md5">,
          WebCryptoHashAlgorithm
        > = {
          sha1: "SHA-1",
          sha256: "SHA-256",
          sha512: "SHA-512",
        };
        const digest = await hashBytes(
          request.bytes,
          algorithms[request.algorithm],
        );
        return { ok: true, value: digest } as ComputeTaskResponse<T["type"]>;
      }
    }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Compute task failed.",
    };
  }
}
