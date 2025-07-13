import React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TooltipWrapperProps {
  children: React.ReactNode;
  content: string;
  asChild?: boolean;
}

export function TooltipWrapper({
  children,
  content,
  asChild = true,
}: TooltipWrapperProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild={asChild}>{children}</TooltipTrigger>
      <TooltipContent>
        <p>{content}</p>
      </TooltipContent>
    </Tooltip>
  );
}

interface ToolTooltipProviderProps {
  children: React.ReactNode;
}

export function ToolTooltipProvider({ children }: ToolTooltipProviderProps) {
  return <TooltipProvider>{children}</TooltipProvider>;
}

// Predefined tooltips for common UI elements
export const commonTooltips = {
  clearAll: "Clear all inputs and reset the tool",
  copyResult: "Copy the result to clipboard",
  copyMatches: "Copy all matches to clipboard",
  loadSample: "Load a sample data for testing",
  format: "Format and beautify the code",
  minify: "Minify the code by removing whitespace",
  validate: "Validate the syntax and structure",
  process: "Process the input data",
  transform: "Transform the data to the specified format",
  analyze: "Analyze the input and show detailed information",
  generate: "Generate output based on the input",
  encode: "Encode the input text",
  decode: "Decode the input text",
  hash: "Generate hash from the input",
  encrypt: "Encrypt the input text",
  decrypt: "Decrypt the input text",
  compress: "Compress the input data",
  decompress: "Decompress the input data",
  convert: "Convert between different formats",
  export: "Export the result as a file",
  import: "Import data from a file",
  preview: "Preview the result",
  refresh: "Refresh or reload the data",
  settings: "Open settings and configuration",
  help: "Show help and documentation",
  info: "Show additional information",
  download: "Download the result",
  upload: "Upload a file",
  share: "Share the result",
  bookmark: "Add to bookmarks",
  fullscreen: "Enter fullscreen mode",
  collapse: "Collapse the section",
  expand: "Expand the section",
  reset: "Reset to default values",
  undo: "Undo the last action",
  redo: "Redo the last action",
  search: "Search within the content",
  filter: "Filter the results",
  sort: "Sort the results",
  group: "Group the results",
} as const;

// Specific tooltips for different tool types
export const toolSpecificTooltips = {
  // Text tools
  textTransform: {
    uppercase: "Convert all text to uppercase",
    lowercase: "Convert all text to lowercase",
    capitalize: "Capitalize the first letter of each word",
    sentence: "Capitalize the first letter of each sentence",
    camelCase: "Convert to camelCase format",
    pascalCase: "Convert to PascalCase format",
    snakeCase: "Convert to snake_case format",
    kebabCase: "Convert to kebab-case format",
  },

  // Code tools
  codeTools: {
    beautify: "Format and beautify the code with proper indentation",
    minify: "Remove unnecessary whitespace and comments",
    validate: "Check for syntax errors and validate structure",
    highlight: "Apply syntax highlighting",
    lineNumbers: "Show/hide line numbers",
    wordWrap: "Enable/disable word wrapping",
  },

  // Data tools
  dataTools: {
    parse: "Parse the input data and analyze structure",
    stringify: "Convert object to string representation",
    flatten: "Flatten nested structures",
    unflatten: "Unflatten flattened structures",
    filter: "Filter data based on criteria",
    sort: "Sort data by specified field",
    merge: "Merge multiple datasets",
    split: "Split data into multiple parts",
  },

  // Regex tools
  regexTools: {
    test: "Test the regex pattern against input text",
    match: "Find all matches in the text",
    replace: "Replace matches with specified text",
    flags: "Configure regex flags (global, case-insensitive, etc.)",
    groups: "Show capturing groups in matches",
    explain: "Explain the regex pattern in plain English",
  },

  // Hash/Crypto tools
  cryptoTools: {
    md5: "Generate MD5 hash (128-bit)",
    sha1: "Generate SHA-1 hash (160-bit)",
    sha256: "Generate SHA-256 hash (256-bit)",
    sha512: "Generate SHA-512 hash (512-bit)",
    base64Encode: "Encode text to Base64 format",
    base64Decode: "Decode Base64 text to original format",
    urlEncode: "Encode text for URL usage",
    urlDecode: "Decode URL-encoded text",
  },

  // Network tools
  networkTools: {
    ping: "Test network connectivity",
    dns: "Resolve domain name to IP address",
    whois: "Get domain registration information",
    port: "Check if a port is open",
    trace: "Trace network route to destination",
    speed: "Test network speed",
  },
} as const;
