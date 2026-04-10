export type ProcessorResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };
