import { afterEach, describe, expect, it, vi } from "vitest";

import {
  generateMultiplePassphrases,
  generateMultiplePasswords,
  generatePassphrase,
  generatePassword,
  getDefaultPassphraseOptions,
  getDefaultPasswordOptions,
  secureRandomInteger,
  type RandomIntegerSource,
} from "@/lib/utils/password";

function sequenceSource(...values: number[]): RandomIntegerSource {
  let index = 0;

  return (maxExclusive) => {
    if (index >= values.length) {
      throw new Error("Deterministic random sequence was exhausted");
    }

    const value = values[index++];
    if (value >= maxExclusive) {
      throw new Error(`${value} is outside deterministic bound ${maxExclusive}`);
    }
    return value;
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("secure random integer", () => {
  it("rejects the modulo-bias tail before returning a bounded value", () => {
    const values = [0xffff_ffff, 7];
    const getRandomValues = vi.fn((target: Uint32Array) => {
      target[0] = values.shift()!;
      return target;
    });
    vi.stubGlobal("crypto", { getRandomValues });

    expect(secureRandomInteger(10)).toBe(7);
    expect(getRandomValues).toHaveBeenCalledTimes(2);
  });

  it.each([0, -1, 1.5, 0x1_0000_0001])(
    "rejects invalid upper bound %s",
    (maxExclusive) => {
      expect(() => secureRandomInteger(maxExclusive)).toThrow(RangeError);
    },
  );
});

describe("password generation", () => {
  it("guarantees every selected category at the requested length", () => {
    const password = generatePassword(
      {
        ...getDefaultPasswordOptions(),
        length: 8,
        customSymbols: "!@",
      },
      sequenceSource(0, 1, 2, 1, 0, 1, 2, 3, 0, 0, 0, 0, 0, 0, 0),
    );

    expect(password).toHaveLength(8);
    expect(password).toMatch(/[A-Z]/);
    expect(password).toMatch(/[a-z]/);
    expect(password).toMatch(/[0-9]/);
    expect(password).toMatch(/[!@]/);
  });

  it("honors similar, ambiguous, and custom exclusions", () => {
    const password = generatePassword(
      {
        length: 12,
        includeUppercase: true,
        includeLowercase: false,
        includeNumbers: false,
        includeSymbols: false,
        excludeSimilar: true,
        excludeAmbiguous: true,
        excludeCharacters: "ABCXYZ",
      },
      () => 0,
    );

    expect(password).toHaveLength(12);
    expect(password).not.toMatch(/[ABCXYZLO]/);
    expect(password).toMatch(/^[A-Z]+$/);
  });

  it("uses the injected source for its Fisher-Yates shuffle", () => {
    const password = generatePassword(
      {
        length: 3,
        includeUppercase: true,
        includeLowercase: false,
        includeNumbers: false,
        includeSymbols: false,
        excludeSimilar: false,
        excludeAmbiguous: false,
      },
      sequenceSource(0, 1, 2, 0, 0),
    );

    expect(password).toBe("BCA");
  });

  it("rejects impossible and malformed options", () => {
    expect(() =>
      generatePassword({
        ...getDefaultPasswordOptions(),
        length: 3,
      }),
    ).toThrow("at least the number of selected character categories");

    expect(() =>
      generatePassword({
        ...getDefaultPasswordOptions(),
        includeUppercase: false,
        includeLowercase: false,
        includeNumbers: false,
        includeSymbols: false,
      }),
    ).toThrow("Select at least one character category");

    expect(() =>
      generatePassword({
        ...getDefaultPasswordOptions(),
        includeUppercase: false,
        includeLowercase: false,
        includeNumbers: false,
        includeSymbols: true,
        customSymbols: "@",
        excludeCharacters: "@",
      }),
    ).toThrow("No characters available");

    expect(() =>
      generateMultiplePasswords(getDefaultPasswordOptions(), -1),
    ).toThrow(RangeError);
  });
});

describe("passphrase generation", () => {
  it("selects unique words and applies capitalization, numbers, and symbols", () => {
    const result = generatePassphrase(
      {
        wordCount: 3,
        separator: ".",
        includeNumbers: true,
        includeSymbols: true,
        capitalizeWords: true,
        minWordLength: 5,
        maxWordLength: 5,
        customWordList: ["alpha", "bravo", "cider", "delta"],
      },
      sequenceSource(2, 0, 1, 7, 1, 42, 2, 99, 3),
    );

    expect(result.words).toEqual(["Cider", "Bravo", "Delta"]);
    expect(new Set(result.words).size).toBe(3);
    expect(result.passphrase).toBe("Cider7@.Bravo42#.Delta99$");
    expect(result.entropy).toBeCloseTo(34.9315685693);
  });

  it("deduplicates a custom word list before enforcing uniqueness", () => {
    expect(() =>
      generatePassphrase({
        ...getDefaultPassphraseOptions(),
        wordCount: 3,
        minWordLength: 5,
        maxWordLength: 5,
        customWordList: ["alpha", "alpha", "bravo"],
      }),
    ).toThrow("Not enough words available");
  });

  it("rejects invalid options and generation counts", () => {
    expect(() =>
      generatePassphrase({
        ...getDefaultPassphraseOptions(),
        wordCount: 1,
        separator: "",
      }),
    ).toThrow(/Word count must be at least 2.*Separator cannot be empty/);

    expect(() =>
      generatePassphrase({
        ...getDefaultPassphraseOptions(),
        minWordLength: 8,
        maxWordLength: 4,
      }),
    ).toThrow("Maximum word length must be greater");

    expect(() =>
      generateMultiplePassphrases(getDefaultPassphraseOptions(), 1.5),
    ).toThrow(RangeError);
  });
});
