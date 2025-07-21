/**
 * Regex Replace Utilities
 * Functions for find and replace operations with regex
 */

export interface ReplaceResult {
  result: string;
  replacements: number;
  matches: Array<{
    original: string;
    replacement: string;
    index: number;
  }>;
}

/**
 * Perform regex find and replace
 */
export function regexReplace(
  text: string,
  pattern: string,
  replacement: string,
  flags: string
): ReplaceResult {
  try {
    const regex = new RegExp(pattern, flags);
    const matches: Array<{
      original: string;
      replacement: string;
      index: number;
    }> = [];
    let replacementCount = 0;

    // Track matches before replacement
    if (flags.includes("g")) {
      let match;
      const tempRegex = new RegExp(pattern, flags);
      while ((match = tempRegex.exec(text)) !== null) {
        matches.push({
          original: match[0],
          replacement: replacement,
          index: match.index,
        });
        replacementCount++;

        if (match.index === tempRegex.lastIndex) {
          tempRegex.lastIndex++;
        }
      }
    } else {
      const match = regex.exec(text);
      if (match) {
        matches.push({
          original: match[0],
          replacement: replacement,
          index: match.index,
        });
        replacementCount = 1;
      }
    }

    const result = text.replace(regex, replacement);

    return {
      result,
      replacements: replacementCount,
      matches,
    };
  } catch (error) {
    throw new Error(
      `Replace error: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Generate replacement preview showing changes
 */
export function generateReplacePreview(
  text: string,
  pattern: string,
  replacement: string,
  flags: string
): string {
  try {
    const regex = new RegExp(pattern, flags);
    let result = text;

    if (flags.includes("g")) {
      let match;
      const matches = [];
      while ((match = regex.exec(text)) !== null) {
        matches.push(match);
        if (match.index === regex.lastIndex) {
          regex.lastIndex++;
        }
      }

      // Process matches in reverse order to maintain indices
      for (let i = matches.length - 1; i >= 0; i--) {
        const match = matches[i];
        const before = result.substring(0, match.index);
        const after = result.substring(match.index + match[0].length);
        result = before + `[REPLACE: ${match[0]} → ${replacement}]` + after;
      }
    } else {
      const match = regex.exec(text);
      if (match) {
        const before = result.substring(0, match.index);
        const after = result.substring(match.index + match[0].length);
        result = before + `[REPLACE: ${match[0]} → ${replacement}]` + after;
      }
    }

    return result;
  } catch (error) {
    return `Error generating preview: ${
      error instanceof Error ? error.message : "Unknown error"
    }`;
  }
}
