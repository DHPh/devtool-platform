import { FAQSection } from "@/components/ui/faq-section";

// Regex Tester FAQ data
export const regexTesterFAQ = [
  {
    question: "What is a regular expression (regex)?",
    answer:
      "A regular expression is a sequence of characters that defines a search pattern. It's used for pattern matching within strings, data validation, text processing, and search operations. Regex provides a powerful and flexible way to match, search, and manipulate text.",
  },
  {
    question: "How do I test my regex pattern?",
    answer:
      "Enter your regex pattern in the Pattern field, add your test text in the Test Text area, and configure the appropriate flags. The tool will automatically show you all matches in real-time, including capturing groups and match positions.",
  },
  {
    question: "What do the different flags mean?",
    answer:
      "Flags modify how the regex pattern behaves: Global (g) finds all matches, Ignore Case (i) makes matching case-insensitive, Multiline (m) treats ^ and $ as line boundaries, Dot All (s) makes . match newlines, Unicode (u) enables proper Unicode support, and Sticky (y) matches only at lastIndex position.",
  },
  {
    question: "Can I use capturing groups?",
    answer:
      "Yes! Use parentheses () to create capturing groups. The tool will show you the content of each capturing group for every match. This is useful for extracting specific parts of your matches, like extracting domain names from email addresses.",
  },
  {
    question: "What are some common regex patterns?",
    answer:
      "Common patterns include: Email validation (\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b), Phone numbers (\\(\\d{3}\\)\\s\\d{3}-\\d{4}), URLs (https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_\\+.~#?&//=]*)), and Date formats (\\d{1,2}\\/\\d{1,2}\\/\\d{4}).",
  },
  {
    question: "Why are Global and Sticky flags conflicting?",
    answer:
      "The Global (g) flag finds all matches in the string, while the Sticky (y) flag only matches at the exact position specified by lastIndex. When used together, the behavior can be unpredictable because Sticky expects to match at a specific position, while Global expects to find all matches throughout the string.",
  },
  {
    question: "Is my data secure when using this tool?",
    answer:
      "Yes, absolutely! All regex testing happens entirely in your browser - no data is sent to any server. Your patterns and test text remain completely private and secure on your device.",
  },
  {
    question: "Can I save or share my regex patterns?",
    answer:
      "Currently, you can copy your matches using the 'Copy Matches' button. The patterns are not automatically saved, but you can bookmark the page and manually save your patterns in a text file or note-taking app.",
  },
];

// JSON Formatter FAQ data
export const jsonFormatterFAQ = [
  {
    question: "What is JSON formatting?",
    answer:
      "JSON formatting, also called 'pretty printing', transforms compact or minified JSON into a readable format with proper indentation, line breaks, and spacing. This makes it easier for developers to read, debug, and understand the JSON structure.",
  },
  {
    question: "What's the difference between formatting and minifying JSON?",
    answer:
      "Formatting adds whitespace, indentation, and line breaks to make JSON human-readable. Minifying removes all unnecessary whitespace to reduce file size, making it more efficient for data transmission but harder to read.",
  },
  {
    question: "Can this tool validate JSON syntax?",
    answer:
      "Yes! The tool automatically validates your JSON as you paste or type it. If there are syntax errors (like missing quotes, brackets, or commas), it will highlight the errors and provide helpful error messages to fix them.",
  },
  {
    question: "What should I do if my JSON is invalid?",
    answer:
      "Check for common issues: missing or extra commas, unmatched brackets or braces, unquoted property names, trailing commas, or invalid escape sequences. The error message will usually point you to the specific line and character where the problem occurs.",
  },
  {
    question: "Is there a size limit for JSON files?",
    answer:
      "The tool can handle reasonably large JSON files (several MBs) since processing happens in your browser. However, extremely large files might slow down your browser. For very large files, consider using desktop tools or command-line utilities.",
  },
  {
    question: "Can I format JSON arrays and nested objects?",
    answer:
      "Absolutely! The tool handles complex JSON structures including nested objects, arrays, mixed data types, and deeply nested hierarchies. It will properly indent and format all levels of nesting.",
  },
  {
    question: "Is my JSON data secure?",
    answer:
      "Yes! All JSON processing happens entirely in your browser - no data is sent to any servers. Your JSON data remains completely private and secure on your device.",
  },
  {
    question: "Can I copy the formatted result?",
    answer:
      "Yes, you can select and copy the formatted JSON from the output area. Most browsers also support Ctrl+A to select all and Ctrl+C to copy the entire formatted result.",
  },
];

// Base64 Encoder FAQ data
export const base64EncoderFAQ = [
  {
    question: "What is Base64 encoding?",
    answer:
      "Base64 is a binary-to-text encoding scheme that represents binary data in ASCII string format. It uses 64 printable characters (A-Z, a-z, 0-9, +, /) to encode data, making it safe for transmission over text-based protocols like email or HTTP.",
  },
  {
    question: "When should I use Base64 encoding?",
    answer:
      "Use Base64 when you need to embed binary data in text formats (like images in CSS/HTML), send binary data through text-based protocols, or store binary data in JSON or XML. Base64 does not detect corruption or provide integrity protection; use a cryptographic hash or authenticated protocol for that.",
  },
  {
    question: "Does Base64 encoding provide security?",
    answer:
      "No! Base64 is NOT encryption or security - it's just encoding. Anyone can easily decode Base64 data. Never use Base64 to hide sensitive information like passwords or API keys. Use proper encryption methods for security.",
  },
  {
    question: "Why is my Base64 encoded data larger than the original?",
    answer:
      "Base64 encoding increases data size by approximately 33% (4 characters for every 3 bytes of input). This overhead is the trade-off for making binary data text-safe and transferable through text-based systems.",
  },
  {
    question: "What does the padding (=) at the end mean?",
    answer:
      "The equals signs (=) are padding characters used when the input data length isn't divisible by 3. Base64 processes data in 3-byte chunks, so padding ensures the output length is always divisible by 4.",
  },
  {
    question: "Can I encode files with this tool?",
    answer:
      "Yes. Choose a file with the Binary file input and the tool will encode its bytes locally in your browser as Base64 or Base64url. You can also decode Base64 into bytes and download the result.",
  },
  {
    question: "Is URL-safe Base64 different from regular Base64?",
    answer:
      "Yes! URL-safe Base64 replaces '+' with '-' and '/' with '_', and often omits padding. This prevents issues when using Base64 in URLs where '+' and '/' have special meanings.",
  },
  {
    question: "Is my data secure when using this tool?",
    answer:
      "Yes! All encoding and decoding happens entirely in your browser - no data is sent to any servers. Your information remains completely private and secure on your device.",
  },
];

// UUID Generator FAQ data
export const uuidGeneratorFAQ = [
  {
    question: "What is a UUID?",
    answer:
      "UUID stands for Universally Unique Identifier. It's a 128-bit number used to uniquely identify information in computer systems. UUIDs are designed to be unique across space and time without requiring a central authority.",
  },
  {
    question: "What's the difference between UUID versions?",
    answer:
      "This tool generates RFC 9562 UUIDv4 and UUIDv7. UUIDv4 uses cryptographic random bits and contains no timestamp. UUIDv7 begins with a Unix millisecond timestamp, making generated values naturally time-ordered; it does not embed a MAC address.",
  },
  {
    question: "Are UUIDs really unique?",
    answer:
      "No finite random identifier can guarantee uniqueness. UUIDv4 has 122 random bits, so collision risk is negligible at ordinary application volumes, but databases should still enforce a unique constraint. UUIDv7 combines its timestamp with a random or monotonic field and should be treated with the same engineering discipline.",
  },
  {
    question: "Can I use UUIDs as database primary keys?",
    answer:
      "Yes. UUIDv4 avoids centralized allocation but its random ordering can fragment indexes. UUIDv7 retains distributed generation while improving index locality through its leading timestamp. Both use 16 bytes, and UUIDv7 reveals approximate creation time, so choose based on your storage and privacy requirements.",
  },
  {
    question: "What format should I use for UUIDs?",
    answer:
      "The canonical format is 8-4-4-4-12 hexadecimal digits separated by hyphens (for example, 550e8400-e29b-41d4-a716-446655440000). The inspector accepts uppercase or lowercase canonical UUIDs and normalizes them to lowercase; it intentionally rejects braces, URNs, and unhyphenated input.",
  },
  {
    question: "Are these UUIDs cryptographically secure?",
    answer:
      "The tool uses your browser's cryptographic random-number generator for UUIDv4 and for UUIDv7's random field. UUID uniqueness does not make an identifier an authentication secret, so use a purpose-built security token when unpredictability is the primary requirement.",
  },
  {
    question: "Can I generate multiple UUIDs at once?",
    answer:
      "Yes. You can generate and copy batches of up to 100 UUIDs. UUIDv7 values produced during the same or a backwards-moving millisecond are kept monotonic within the current page session.",
  },
  {
    question: "How do I use UUIDs in my code?",
    answer:
      "Most programming languages have UUID libraries: JavaScript (crypto.randomUUID()), Python (import uuid; uuid.uuid4()), Java (UUID.randomUUID()), C# (Guid.NewGuid()), PHP (uniqid() or random_bytes()), etc.",
  },
  {
    question: "What does the UUID inspector validate?",
    answer:
      "It requires the canonical 8-4-4-4-12 hexadecimal form, reports the UUID version and variant, and decodes the embedded Unix millisecond timestamp for RFC-variant UUIDv7 values. Braced, URN, and unhyphenated forms are intentionally rejected.",
  },
];

export const timestampConverterFAQ = [
  {
    question: "Which date-time formats does the Timestamp Converter accept?",
    answer:
      "It accepts strict RFC 3339 instants such as 2024-01-15T10:30:00Z or 2024-01-15T10:30:00+07:00. It also accepts offset-less YYYY-MM-DD HH:mm:ss values, which are interpreted in the selected UTC, local, or IANA timezone. Locale-specific formats are intentionally rejected because their meaning varies by browser and region.",
  },
  {
    question: "Does it preserve microseconds and nanoseconds?",
    answer:
      "Yes. Unix values are parsed as decimal text and converted with BigInt arithmetic, preserving precision through nanoseconds without passing through floating-point numbers. The live browser clock itself normally supplies only millisecond precision.",
  },
  {
    question: "What happens during daylight-saving time changes?",
    answer:
      "An offset-less local time in a DST gap is reported as nonexistent. A time in a DST overlap is reported as ambiguous with both possible Unix timestamps. The converter does not silently choose one occurrence.",
  },
  {
    question: "What timezone names can I use?",
    answer:
      "Use UTC, local, or an IANA timezone supported by your browser, such as America/New_York, Europe/Paris, or Asia/Ho_Chi_Minh. Invalid and unsupported names are rejected.",
  },
];

export { FAQSection };
