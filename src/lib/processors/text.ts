export const TEXT_CASES = [
  "camelCase",
  "PascalCase",
  "snake_case",
  "SCREAMING_SNAKE_CASE",
  "kebab-case",
  "SCREAMING-KEBAB-CASE",
  "dot.case",
  "path/case",
  "Title Case",
  "Sentence case",
  "UPPERCASE",
  "lowercase",
] as const;

export type TextCase = (typeof TEXT_CASES)[number];

const splitWords = (text: string): string[] =>
  text
    .replace(/([a-z\d])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .match(/[\p{L}\p{N}]+/gu) ?? [];

const capitalize = (word: string) =>
  word ? `${word.charAt(0).toUpperCase()}${word.slice(1).toLowerCase()}` : "";

export function convertTextCase(text: string, textCase: TextCase): string {
  const words = splitWords(text);
  switch (textCase) {
    case "camelCase":
      return words
        .map((word, index) => index === 0 ? word.toLowerCase() : capitalize(word))
        .join("");
    case "PascalCase":
      return words.map(capitalize).join("");
    case "snake_case":
      return words.map((word) => word.toLowerCase()).join("_");
    case "SCREAMING_SNAKE_CASE":
      return words.map((word) => word.toUpperCase()).join("_");
    case "kebab-case":
      return words.map((word) => word.toLowerCase()).join("-");
    case "SCREAMING-KEBAB-CASE":
      return words.map((word) => word.toUpperCase()).join("-");
    case "dot.case":
      return words.map((word) => word.toLowerCase()).join(".");
    case "path/case":
      return words.map((word) => word.toLowerCase()).join("/");
    case "Title Case":
      return words.map(capitalize).join(" ");
    case "Sentence case":
      return words.length
        ? `${capitalize(words[0])}${words.slice(1).map((word) => ` ${word.toLowerCase()}`).join("")}`
        : "";
    case "UPPERCASE":
      return text.toUpperCase();
    case "lowercase":
      return text.toLowerCase();
  }
}

export const convertTextToAllCases = (
  text: string
): Array<{ name: TextCase; result: string }> =>
  TEXT_CASES.map((name) => ({ name, result: convertTextCase(text, name) }));
