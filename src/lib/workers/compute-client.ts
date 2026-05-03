import type { FileHashAlgorithm } from "../processors/file-core";
import type { ProcessorResult } from "../processors/result";
import type { DiffLevel } from "../processors/ui-primitives";
import {
  executeComputeTask,
  type ComputeTaskRequest,
  type ComputeTaskResponse,
  type ComputeTaskValueMap,
  type RegexReplaceOutcome,
  type TextDiffOutcome,
} from "./compute-tasks";
import type { WorkerResponseEnvelope } from "./compute.worker";
import type { RegexTestResult } from "../utils/regex/regex-tester";

export interface WorkerLike {
  postMessage(message: unknown, transfer?: Transferable[]): void;
  terminate(): void;
  onmessage: ((event: MessageEvent<WorkerResponseEnvelope>) => void) | null;
  onerror: ((event: ErrorEvent) => void) | null;
}

export interface ComputeClientOptions {
  timeoutMs?: number;
  signal?: AbortSignal;
  transfer?: Transferable[];
  workerFactory?: () => WorkerLike;
}

let nextTaskId = 1;

/**
 * Executes a heavy compute task in an isolated Web Worker with hard timeout
 * and AbortSignal cancellation (calling `worker.terminate()` to kill runaway loops).
 * Falls back to direct execution when `Worker` is unavailable (SSR / jsdom tests).
 */
export async function runComputeTask<T extends ComputeTaskRequest>(
  task: T,
  options: ComputeClientOptions = {},
): Promise<ProcessorResult<ComputeTaskValueMap[T["type"]]>> {
  const { timeoutMs = 10_000, signal, transfer = [], workerFactory } = options;

  if (signal?.aborted) {
    return { ok: false, error: "Task aborted." };
  }

  const canUseWorker =
    typeof workerFactory === "function" || typeof Worker === "function";

  if (!canUseWorker) {
    const fallback = await executeComputeTask(task);
    if (signal?.aborted) {
      return { ok: false, error: "Task aborted." };
    }
    return fallback as ProcessorResult<ComputeTaskValueMap[T["type"]]>;
  }

  const worker: WorkerLike = workerFactory
    ? workerFactory()
    : (new Worker(
        new URL("./compute.worker.ts", import.meta.url),
      ) as unknown as WorkerLike);

  const taskId = nextTaskId++;

  return new Promise<ProcessorResult<ComputeTaskValueMap[T["type"]]>>(
    (resolve) => {
      let settled = false;
      let timerId: ReturnType<typeof setTimeout> | undefined;

      const finish = (result: ComputeTaskResponse) => {
        if (settled) return;
        settled = true;
        if (timerId !== undefined) clearTimeout(timerId);
        signal?.removeEventListener("abort", handleAbort);
        worker.onmessage = null;
        worker.onerror = null;
        worker.terminate();
        resolve(result as ProcessorResult<ComputeTaskValueMap[T["type"]]>);
      };

      const handleAbort = () => {
        finish({ ok: false, error: "Task aborted." });
      };

      if (signal) {
        signal.addEventListener("abort", handleAbort, { once: true });
      }

      if (timeoutMs > 0) {
        timerId = setTimeout(() => {
          finish({
            ok: false,
            error: `Operation timed out after ${timeoutMs}ms (possible infinite loop or overly complex pattern).`,
          });
        }, timeoutMs);
      }

      worker.onmessage = (event) => {
        if (event.data?.id !== taskId) return;
        finish(event.data.response);
      };

      worker.onerror = (event) => {
        finish({
          ok: false,
          error: event?.message || "Worker execution failed.",
        });
      };

      try {
        worker.postMessage({ id: taskId, task }, transfer);
      } catch (error) {
        finish({
          ok: false,
          error:
            error instanceof Error
              ? error.message
              : "Failed to post task to worker.",
        });
      }
    },
  );
}

export function runRegexTestWithTimeout(
  pattern: string,
  text: string,
  flags: string,
  options: Omit<ComputeClientOptions, "transfer"> = {},
): Promise<ProcessorResult<RegexTestResult>> {
  return runComputeTask(
    { type: "regex-test", pattern, text, flags },
    { timeoutMs: 1500, ...options },
  );
}

export function runRegexReplaceWithTimeout(
  pattern: string,
  text: string,
  replacement: string,
  flags: string,
  options: Omit<ComputeClientOptions, "transfer"> = {},
): Promise<ProcessorResult<RegexReplaceOutcome>> {
  return runComputeTask(
    { type: "regex-replace", pattern, text, replacement, flags },
    { timeoutMs: 1500, ...options },
  );
}

export function calculateTextDiffInWorker(
  left: string,
  right: string,
  diffOptions: {
    level: DiffLevel;
    ignoreWhitespace: boolean;
    ignoreCase: boolean;
  },
  options: Omit<ComputeClientOptions, "transfer"> = {},
): Promise<ProcessorResult<TextDiffOutcome>> {
  return runComputeTask(
    { type: "text-diff", left, right, options: diffOptions },
    { timeoutMs: 10_000, ...options },
  );
}

export async function hashFileInWorker(
  file: Pick<File, "arrayBuffer">,
  algorithm: FileHashAlgorithm = "sha256",
  options: Omit<ComputeClientOptions, "transfer"> = {},
): Promise<ProcessorResult<string>> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const transfer =
    typeof options.workerFactory === "function" || typeof Worker === "function"
      ? [buffer]
      : [];
  return runComputeTask(
    { type: "file-hash", bytes, algorithm },
    { timeoutMs: 30_000, ...options, transfer },
  );
}
