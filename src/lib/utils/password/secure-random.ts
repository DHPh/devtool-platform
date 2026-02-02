export type RandomIntegerSource = (maxExclusive: number) => number;

const UINT32_RANGE = 0x1_0000_0000;

/**
 * Return an unbiased cryptographically secure integer in [0, maxExclusive).
 * Rejection sampling avoids the modulo bias produced by `% maxExclusive`.
 */
export const secureRandomInteger: RandomIntegerSource = (maxExclusive) => {
  if (
    !Number.isSafeInteger(maxExclusive) ||
    maxExclusive < 1 ||
    maxExclusive > UINT32_RANGE
  ) {
    throw new RangeError(
      `maxExclusive must be an integer between 1 and ${UINT32_RANGE}`,
    );
  }

  if (!globalThis.crypto?.getRandomValues) {
    throw new Error("Secure random number generation is unavailable");
  }

  const rejectionLimit =
    UINT32_RANGE - (UINT32_RANGE % maxExclusive);
  const values = new Uint32Array(1);

  do {
    globalThis.crypto.getRandomValues(values);
  } while (values[0] >= rejectionLimit);

  return values[0] % maxExclusive;
};

export function drawRandomInteger(
  maxExclusive: number,
  source: RandomIntegerSource = secureRandomInteger,
): number {
  const value = source(maxExclusive);

  if (!Number.isSafeInteger(value) || value < 0 || value >= maxExclusive) {
    throw new RangeError(
      `Random source must return an integer between 0 and ${maxExclusive - 1}`,
    );
  }

  return value;
}
