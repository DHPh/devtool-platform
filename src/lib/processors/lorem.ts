export type LoremIpsumUnit = "words" | "sentences" | "paragraphs";

export interface LoremIpsumOptions {
  count: number;
  unit: LoremIpsumUnit;
  startWithLorem?: boolean;
  random?: () => number;
}

export const LOREM_WORDS = [
  "lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "adipiscing", "elit",
  "sed", "do", "eiusmod", "tempor", "incididunt", "ut", "labore", "et",
  "dolore", "magna", "aliqua", "enim", "ad", "minim", "veniam", "quis",
  "nostrud", "exercitation", "ullamco", "laboris", "nisi", "aliquip", "ex", "ea",
  "commodo", "consequat", "duis", "aute", "irure", "in", "reprehenderit",
  "voluptate", "velit", "esse", "cillum", "fugiat", "nulla", "pariatur",
  "excepteur", "sint", "occaecat", "cupidatat", "non", "proident", "sunt",
  "culpa", "qui", "officia", "deserunt", "mollit", "anim", "id", "est", "laborum",
] as const;

const LOREM_SENTENCE = "Lorem ipsum dolor sit amet, consectetur adipiscing elit.";
const LOREM_PARAGRAPH =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.";

function assertRandomValue(value: number): number {
  if (!Number.isFinite(value) || value < 0 || value >= 1) {
    throw new Error("Lorem ipsum random source must return a number in [0, 1)");
  }
  return value;
}

function randomInteger(random: () => number, min: number, max: number): number {
  return min + Math.floor(assertRandomValue(random()) * (max - min + 1));
}

function generateWords(count: number, random: () => number): string {
  return Array.from({ length: count }, () => {
    const index = Math.floor(assertRandomValue(random()) * LOREM_WORDS.length);
    return LOREM_WORDS[index];
  }).join(" ");
}

function generateSentence(random: () => number): string {
  const words = generateWords(randomInteger(random, 8, 17), random);
  return `${words.charAt(0).toUpperCase()}${words.slice(1)}.`;
}

function generateParagraph(random: () => number): string {
  return Array.from({ length: randomInteger(random, 3, 7) }, () =>
    generateSentence(random),
  ).join(" ");
}

/** Production generator used by the Lorem Ipsum tool. */
export function generateLoremIpsum(options: LoremIpsumOptions): string {
  const { count, unit, startWithLorem = true, random = Math.random } = options;
  if (!Number.isInteger(count) || count < 1 || count > 100) {
    throw new Error("Lorem ipsum count must be an integer between 1 and 100");
  }

  if (unit === "words") {
    if (!startWithLorem) return generateWords(count, random);
    if (count === 1) return "Lorem";
    if (count === 2) return "Lorem ipsum";
    return `Lorem ipsum ${generateWords(count - 2, random)}`;
  }

  if (unit === "sentences") {
    return Array.from({ length: count }, (_, index) =>
      index === 0 && startWithLorem ? LOREM_SENTENCE : generateSentence(random),
    ).join(" ");
  }

  if (unit === "paragraphs") {
    return Array.from({ length: count }, (_, index) =>
      index === 0 && startWithLorem ? LOREM_PARAGRAPH : generateParagraph(random),
    ).join("\n\n");
  }

  throw new Error(`Unsupported lorem ipsum unit: ${String(unit)}`);
}
