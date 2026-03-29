const JSON_SCRIPT_ESCAPE_PATTERN = /[<>&\u2028\u2029]/g;
const JSON_SCRIPT_ESCAPES: Record<string, string> = {
  "<": "\\u003c",
  ">": "\\u003e",
  "&": "\\u0026",
  "\u2028": "\\u2028",
  "\u2029": "\\u2029",
};

/** Serializes JSON so it cannot terminate an HTML script element. */
export function serializeJsonForHtml(value: unknown): string {
  return (JSON.stringify(value) ?? "null").replace(
    JSON_SCRIPT_ESCAPE_PATTERN,
    (character) => JSON_SCRIPT_ESCAPES[character],
  );
}
