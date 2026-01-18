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
  text.replace(/\W+/g, " ").split(/ |\B(?=[A-Z])/);

export function convertTextCase(text: string, textCase: TextCase): string {
  switch (textCase) {
    case "camelCase":
      return text
        .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) =>
          index === 0 ? word.toLowerCase() : word.toUpperCase()
        )
        .replace(/\s+/g, "");
    case "PascalCase":
      return text
        .replace(/(?:^\w|[A-Z]|\b\w)/g, (word) => word.toUpperCase())
        .replace(/\s+/g, "");
    case "snake_case":
      return splitWords(text).map((word) => word.toLowerCase()).join("_");
    case "SCREAMING_SNAKE_CASE":
      return splitWords(text).map((word) => word.toUpperCase()).join("_");
    case "kebab-case":
      return splitWords(text).map((word) => word.toLowerCase()).join("-");
    case "SCREAMING-KEBAB-CASE":
      return splitWords(text).map((word) => word.toUpperCase()).join("-");
    case "dot.case":
      return splitWords(text).map((word) => word.toLowerCase()).join(".");
    case "path/case":
      return splitWords(text).map((word) => word.toLowerCase()).join("/");
    case "Title Case":
      return text
        .toLowerCase()
        .replace(/(?:^|\s)\w/g, (match) => match.toUpperCase());
    case "Sentence case":
      return text.toLowerCase().replace(/^\w/, (match) => match.toUpperCase());
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
