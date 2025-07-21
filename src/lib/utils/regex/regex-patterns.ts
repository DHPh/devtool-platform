/**
 * Regex Pattern Library
 * Common regex patterns for various use cases
 */

import { RegexPattern } from "./regex-tester";

export const REGEX_PATTERNS: Record<string, RegexPattern[]> = {
  validation: [
    {
      id: "email",
      name: "Email Address",
      pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
      description: "Validates email addresses",
      flags: "i",
      example: "user@example.com",
      category: "validation",
    },
    {
      id: "phone-us",
      name: "US Phone Number",
      pattern: "^\\+?1?[2-9]\\d{2}[2-9]\\d{2}\\d{4}$",
      description: "Validates US phone numbers",
      flags: "",
      example: "+1234567890",
      category: "validation",
    },
    {
      id: "url",
      name: "URL",
      pattern:
        "^https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_\\+.~#?&//=]*)$",
      description: "Validates HTTP/HTTPS URLs",
      flags: "i",
      example: "https://www.example.com",
      category: "validation",
    },
    {
      id: "ipv4",
      name: "IPv4 Address",
      pattern:
        "^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$",
      description: "Validates IPv4 addresses",
      flags: "",
      example: "192.168.1.1",
      category: "validation",
    },
    {
      id: "credit-card",
      name: "Credit Card",
      pattern:
        "^(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3[0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})$",
      description: "Validates major credit card numbers",
      flags: "",
      example: "4111111111111111",
      category: "validation",
    },
  ],
  text: [
    {
      id: "word-boundaries",
      name: "Whole Words",
      pattern: "\\b\\w+\\b",
      description: "Matches whole words",
      flags: "g",
      example: "hello world",
      category: "text",
    },
    {
      id: "numbers",
      name: "Numbers",
      pattern: "\\d+(?:\\.\\d+)?",
      description: "Matches integers and decimals",
      flags: "g",
      example: "123 45.67",
      category: "text",
    },
    {
      id: "html-tags",
      name: "HTML Tags",
      pattern: "<[^>]*>",
      description: "Matches HTML tags",
      flags: "g",
      example: "<div>content</div>",
      category: "text",
    },
    {
      id: "whitespace",
      name: "Whitespace",
      pattern: "\\s+",
      description: "Matches whitespace characters",
      flags: "g",
      example: "hello   world",
      category: "text",
    },
  ],
  programming: [
    {
      id: "hex-color",
      name: "Hex Color",
      pattern: "#(?:[0-9a-fA-F]{3}){1,2}\\b",
      description: "Matches hex color codes",
      flags: "g",
      example: "#ff0000 #fff",
      category: "programming",
    },
    {
      id: "variable-name",
      name: "Variable Name (camelCase)",
      pattern: "^[a-z][a-zA-Z0-9]*$",
      description: "Validates camelCase variable names",
      flags: "",
      example: "myVariable",
      category: "programming",
    },
    {
      id: "css-class",
      name: "CSS Class",
      pattern: "\\.[a-zA-Z][a-zA-Z0-9_-]*",
      description: "Matches CSS class selectors",
      flags: "g",
      example: ".my-class .btn_primary",
      category: "programming",
    },
    {
      id: "function-call",
      name: "Function Call",
      pattern: "\\b[a-zA-Z_][a-zA-Z0-9_]*\\s*\\(",
      description: "Matches function calls",
      flags: "g",
      example: "myFunction() test()",
      category: "programming",
    },
  ],
  advanced: [
    {
      id: "balanced-parentheses",
      name: "Balanced Parentheses",
      pattern: "\\((?:[^()]*|\\([^()]*\\))*\\)",
      description: "Matches balanced parentheses (single level)",
      flags: "g",
      example: "(hello (world)) (test)",
      category: "advanced",
    },
    {
      id: "lookahead",
      name: "Password with Requirements",
      pattern:
        "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$",
      description:
        "Password with uppercase, lowercase, digit, and special char",
      flags: "",
      example: "MyPass123!",
      category: "advanced",
    },
    {
      id: "named-groups",
      name: "Named Groups (Date)",
      pattern: "(?<year>\\d{4})-(?<month>\\d{2})-(?<day>\\d{2})",
      description: "Matches date with named groups",
      flags: "g",
      example: "2024-01-15",
      category: "advanced",
    },
  ],
};

/**
 * Get all patterns from all categories
 */
export function getAllPatterns(): RegexPattern[] {
  return Object.values(REGEX_PATTERNS).flat();
}

/**
 * Get patterns by category
 */
export function getPatternsByCategory(category: string): RegexPattern[] {
  return REGEX_PATTERNS[category] || [];
}

/**
 * Find pattern by ID
 */
export function getPatternById(id: string): RegexPattern | undefined {
  return getAllPatterns().find((pattern) => pattern.id === id);
}

/**
 * Search patterns by name or description
 */
export function searchPatterns(query: string): RegexPattern[] {
  const lowerQuery = query.toLowerCase();
  return getAllPatterns().filter(
    (pattern) =>
      pattern.name.toLowerCase().includes(lowerQuery) ||
      pattern.description.toLowerCase().includes(lowerQuery)
  );
}
