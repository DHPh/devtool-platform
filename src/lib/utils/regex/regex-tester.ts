/**
 * Regex Tester Utilities
 * Core functions for regex pattern testing and validation
 */

export interface RegexMatch {
  match: string;
  index: number;
  length: number;
  groups: string[];
  namedGroups: Record<string, string>;
}

export interface RegexTestResult {
  isValid: boolean;
  matches: RegexMatch[];
  totalMatches: number;
  executionTime: number;
  error?: string;
}

export interface RegexFlags {
  global: boolean;
  ignoreCase: boolean;
  multiline: boolean;
  dotAll: boolean;
  unicode: boolean;
  sticky: boolean;
}

export interface RegexPattern {
  id: string;
  name: string;
  pattern: string;
  description: string;
  flags: string;
  example: string;
  category: string;
}

/**
 * Test regex pattern against input text
 */
export function testRegex(
  pattern: string,
  text: string,
  flags: string
): RegexTestResult {
  const startTime = performance.now();

  try {
    const regex = new RegExp(pattern, flags);
    const matches: RegexMatch[] = [];

    if (flags.includes("g")) {
      // Global search
      let match;
      while ((match = regex.exec(text)) !== null) {
        matches.push({
          match: match[0],
          index: match.index,
          length: match[0].length,
          groups: match.slice(1),
          namedGroups: match.groups || {},
        });

        // Prevent infinite loop
        if (match.index === regex.lastIndex) {
          regex.lastIndex++;
        }
      }
    } else {
      // Single match
      const match = regex.exec(text);
      if (match) {
        matches.push({
          match: match[0],
          index: match.index,
          length: match[0].length,
          groups: match.slice(1),
          namedGroups: match.groups || {},
        });
      }
    }

    const executionTime = performance.now() - startTime;

    return {
      isValid: true,
      matches,
      totalMatches: matches.length,
      executionTime,
    };
  } catch (error) {
    const executionTime = performance.now() - startTime;
    return {
      isValid: false,
      matches: [],
      totalMatches: 0,
      executionTime,
      error: error instanceof Error ? error.message : "Invalid regex pattern",
    };
  }
}

/**
 * Validate regex pattern syntax
 */
export function validateRegexPattern(
  pattern: string,
  flags: string
): { isValid: boolean; error?: string } {
  try {
    new RegExp(pattern, flags);
    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : "Invalid regex pattern",
    };
  }
}

/**
 * Convert flags object to string
 */
export function flagsToString(flags: RegexFlags): string {
  let flagString = "";
  if (flags.global) flagString += "g";
  if (flags.ignoreCase) flagString += "i";
  if (flags.multiline) flagString += "m";
  if (flags.dotAll) flagString += "s";
  if (flags.unicode) flagString += "u";
  if (flags.sticky) flagString += "y";
  return flagString;
}

/**
 * Convert flags string to object
 */
export function stringToFlags(flagString: string): RegexFlags {
  return {
    global: flagString.includes("g"),
    ignoreCase: flagString.includes("i"),
    multiline: flagString.includes("m"),
    dotAll: flagString.includes("s"),
    unicode: flagString.includes("u"),
    sticky: flagString.includes("y"),
  };
}

/**
 * Escape special regex characters
 */
export function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Get regex explanation (basic pattern breakdown)
 */
export function explainRegex(pattern: string): string[] {
  const explanations: string[] = [];

  // Basic pattern explanations
  if (pattern.includes("^")) explanations.push("^ - Start of string/line");
  if (pattern.includes("$")) explanations.push("$ - End of string/line");
  if (pattern.includes("."))
    explanations.push(". - Any character except newline");
  if (pattern.includes("*"))
    explanations.push("* - Zero or more of preceding element");
  if (pattern.includes("+"))
    explanations.push("+ - One or more of preceding element");
  if (pattern.includes("?"))
    explanations.push("? - Zero or one of preceding element");
  if (pattern.includes("[")) explanations.push("[] - Character class");
  if (pattern.includes("(")) explanations.push("() - Capturing group");
  if (pattern.includes("\\d")) explanations.push("\\d - Any digit (0-9)");
  if (pattern.includes("\\w"))
    explanations.push("\\w - Any word character (a-z, A-Z, 0-9, _)");
  if (pattern.includes("\\s"))
    explanations.push("\\s - Any whitespace character");
  if (pattern.includes("|")) explanations.push("| - Alternation (OR)");

  return explanations;
}
