export type ProcessorResult<T, E = string> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export function ok<T>(value: T): ProcessorResult<T, never> {
  return { ok: true, value };
}

export function err<E = string>(error: E): ProcessorResult<never, E> {
  return { ok: false, error };
}

export function tryProcess<T>(
  fn: () => T,
  fallbackMessage = "Processing failed.",
): ProcessorResult<T> {
  try {
    return ok(fn());
  } catch (error) {
    return err(
      error instanceof Error && error.message ? error.message : fallbackMessage,
    );
  }
}
