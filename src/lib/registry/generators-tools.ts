import { TOOL_CATEGORIES, TOOL_TYPES } from "@/lib/tool-classification";
import type { ToolMetadata } from "./types";

export const GENERATOR_TOOLS = [
  {
    id: "uuid-generator",
    kind: "standalone",
    processing: "client",
    name: "UUID Generator",
    description:
      "Generate cryptographic RFC 9562 UUIDv4 and monotonic UUIDv7 batches, or inspect UUID format, version, variant, and v7 timestamp",
    category: TOOL_CATEGORIES.GENERATORS.id,
    type: TOOL_TYPES.GENERATOR,
    types: [TOOL_TYPES.RANDOM],
    tags: ["uuid", "uuidv4", "uuidv7", "rfc-9562", "generator", "random", "inspector"],
    path: "/tools/uuid-generator",
    icon: "🆔",
    featured: true,
    complexity: "simple",
    inputDescription:
      "Choose UUID version (v4 or v7), how many to generate, and casing, or paste a UUID to inspect.",
    outputDescription:
      "A batch of RFC 9562 UUID strings, or a breakdown of a UUID's version, variant, and v7 timestamp.",
    example: {
      input: "Version: v4 · Count: 1",
      output: "d9428888-122b-4c4e-8f3a-4f6c1f7a9b2c (example)",
    },
  },
  {
    id: "lorem-ipsum",
    kind: "standalone",
    processing: "client",
    name: "Lorem Ipsum Generator",
    description: "Generate placeholder text in various formats",
    category: TOOL_CATEGORIES.GENERATORS.id,
    type: TOOL_TYPES.GENERATOR,
    types: [TOOL_TYPES.RANDOM],
    tags: ["lorem", "ipsum", "placeholder", "text"],
    path: "/tools/lorem-ipsum",
    icon: "📃",
    complexity: "simple",
    inputDescription:
      "Choose the amount and unit (words, sentences, or paragraphs) and whether to start with 'Lorem ipsum'.",
    outputDescription:
      "Generated Lorem Ipsum placeholder text of the requested length.",
    example: {
      input: "8 words, starting with 'Lorem ipsum'",
      output: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed…",
    },
  },
  {
    id: "qr-generator",
    kind: "standalone",
    processing: "client",
    name: "QR Code Generator",
    description: "Generate QR codes locally in your browser with PNG and SVG downloads",
    category: TOOL_CATEGORIES.GENERATORS.id,
    type: TOOL_TYPES.GENERATOR,
    tags: ["qr", "code", "generator", "local", "png", "svg"],
    path: "/tools/qr-generator",
    icon: "📱",
    complexity: "intermediate",
    inputDescription:
      "Enter text or a URL and choose error-correction level, size, and colors.",
    outputDescription:
      "A QR code rendered as SVG or PNG, with download buttons.",
    example: {
      input: "https://example.com",
      output: "[QR code image]",
    },
  },
  {
    id: "name-generator",
    kind: "standalone",
    processing: "client",
    name: "Name Generator",
    description:
      "Generate random names for people, companies, and software projects locally",
    category: TOOL_CATEGORIES.GENERATORS.id,
    type: TOOL_TYPES.GENERATOR,
    types: [TOOL_TYPES.RANDOM],
    tags: ["name", "generator", "random", "people", "company", "project"],
    path: "/tools/name-generator",
    icon: "👤",
    complexity: "simple",
    inputDescription:
      "Choose a name category (person, company, or project), optional gender filter, and batch count (1–50).",
    outputDescription:
      "A list of randomly generated names ready to copy individually or in bulk.",
    example: {
      input: "Type: Person · Gender: Unisex · Count: 2",
      output: "Alex Smith\nJordan Garcia (example)",
    },
  },
  {
    id: "number-generator",
    kind: "standalone",
    processing: "client",
    name: "Number Generator",
    description:
      "Generate random numbers within custom ranges with uniqueness, precision, base formatting, and summary statistics",
    category: TOOL_CATEGORIES.GENERATORS.id,
    type: TOOL_TYPES.GENERATOR,
    types: [TOOL_TYPES.RANDOM, TOOL_TYPES.CALCULATOR],
    tags: ["number", "generator", "random", "range", "statistics", "dice"],
    path: "/tools/number-generator",
    icon: "🔢",
    complexity: "simple",
    inputDescription:
      "Specify minimum, maximum, count, decimal precision, output base (decimal, binary, hex, octal), and duplicate policy.",
    outputDescription:
      "Generated random numbers in the chosen base plus count, sum, average, median, min, and max statistics.",
    example: {
      input: "Min: 1 · Max: 100 · Count: 3 · Format: Decimal",
      output: "14\n51\n88 (example)",
    },
  },
  {
    id: "random-wheel",
    kind: "standalone",
    processing: "client",
    name: "Random Wheel",
    description: "Spin a wheel to randomly select from your list of options",
    category: TOOL_CATEGORIES.UTILITIES.id,
    type: TOOL_TYPES.RANDOM,
    types: [TOOL_TYPES.UTILITY],
    tags: ["random", "wheel", "picker", "decision", "spinner"],
    path: "/tools/random-wheel",
    icon: "🎯",
    complexity: "simple",
    inputDescription: "Enter a list of options (one per line) with optional weights.",
    outputDescription: "A randomly selected option from the weighted wheel.",
    example: {
      input: "Pizza\nSushi\nTacos",
      output: "Sushi (example)",
    },
  },
] satisfies ToolMetadata[];
