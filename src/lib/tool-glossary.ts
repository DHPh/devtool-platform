export interface ToolGlossaryTerm {
  term: string;
  definition: string;
}

const GLOSSARIES: Record<string, ToolGlossaryTerm[]> = {
  "base64-encoder": [
    { term: "Base64", definition: "A text encoding for binary data. It is not encryption and provides no secrecy." },
    { term: "Base64url", definition: "A URL-safe Base64 variant that replaces two characters and often omits trailing padding." },
    { term: "Canonical", definition: "The one standard spelling of encoded data, including valid padding and unused bits." },
    { term: "UTF-8", definition: "The byte encoding used to turn text into bytes before Base64 encoding." },
  ],
  "uuid-generator": [
    { term: "UUID", definition: "A 128-bit identifier designed to be unique without a central counter." },
    { term: "UUIDv4", definition: "A UUID whose identifying bits are generated randomly." },
    { term: "UUIDv7", definition: "A time-ordered UUID containing a Unix timestamp plus random data, which sorts well in databases." },
    { term: "Variant", definition: "Bits that identify the UUID layout family; this tool uses the RFC 9562 layout." },
  ],
  "timestamp-converter": [
    { term: "Unix timestamp", definition: "Elapsed seconds or milliseconds since 1970-01-01 00:00:00 UTC." },
    { term: "UTC", definition: "The global reference time standard, without a local daylight-saving offset." },
    { term: "ISO 8601", definition: "A standardized date-time format such as 2026-03-15T12:30:00Z." },
    { term: "IANA timezone", definition: "A named timezone such as Asia/Ho_Chi_Minh whose rules include historical offset changes." },
  ],
  "diff-checker": [
    { term: "Unified diff", definition: "A compact patch format that groups removed and added lines into contextual sections." },
    { term: "Hunk", definition: "One contiguous section of changes in a diff." },
    { term: "Whitespace-sensitive", definition: "Treats spaces, tabs, and line endings as meaningful differences." },
  ],
  "qr-generator": [
    { term: "Error correction", definition: "Extra QR data that allows recovery when part of the code is damaged or obscured." },
    { term: "Quiet zone", definition: "The empty margin around a QR code needed for reliable scanning." },
    { term: "SVG", definition: "A resolution-independent vector image format suitable for sharp printing and scaling." },
  ],
  "email-validator": [
    { term: "Syntax validation", definition: "Checks whether an address follows email formatting rules; it does not prove the mailbox exists." },
    { term: "Domain", definition: "The part after @ that identifies the mail destination." },
    { term: "Disposable address", definition: "An address from a temporary-email provider; classification can change over time." },
  ],
  "csv-viewer": [
    { term: "Delimiter", definition: "The character separating fields, commonly a comma, semicolon, or tab." },
    { term: "Header row", definition: "The first row when it contains column names rather than data." },
    { term: "Quoted field", definition: "A field wrapped in quotes so it can safely contain delimiters or line breaks." },
  ],
  "json-table-viewer": [
    { term: "Flattening", definition: "Converts nested objects into table columns represented by paths." },
    { term: "Nested value", definition: "An object or array stored inside another object rather than a simple scalar value." },
    { term: "Type inference", definition: "Guesses whether values are text, numbers, booleans, or dates from their contents." },
  ],
  "data-explorer": [
    { term: "Null", definition: "An explicit missing value, distinct from zero, false, or an empty string." },
    { term: "Cardinality", definition: "The number of distinct values found in a column." },
    { term: "Mean", definition: "The arithmetic average; unusually large or small values can strongly affect it." },
    { term: "Median", definition: "The middle sorted value, which is usually less sensitive to outliers than the mean." },
  ],
  "icon-pack-generator": [
    { term: "Density", definition: "A device pixel scale used to select an appropriately sized raster icon." },
    { term: "mdpi / xhdpi", definition: "Android density buckets; xhdpi uses twice the linear pixels of mdpi." },
    { term: "Adaptive icon", definition: "An Android icon with separate foreground and background layers that the launcher can mask." },
    { term: "Safe zone", definition: "The central area that remains visible across common icon masks and crops." },
  ],
  "password-studio": [
    { term: "Entropy", definition: "An estimate of unpredictability measured in bits; higher values generally require more guesses." },
    { term: "Character pool", definition: "The set of characters a generator may choose from." },
    { term: "Passphrase", definition: "A password made from multiple words, usually easier to remember at comparable strength." },
    { term: "Breach check", definition: "A lookup for exposure in known data breaches; a clean result does not guarantee safety." },
  ],
  "color-converter": [
    { term: "RGB", definition: "A display-oriented color model using red, green, and blue channels." },
    { term: "HSL", definition: "A cylindrical RGB representation using hue, saturation, and lightness; it is not perceptually uniform." },
    { term: "CMYK", definition: "A print-oriented ink model. A simple conversion is only an approximation without a printer color profile." },
    { term: "Luminance", definition: "A calculated measure of perceived brightness used in contrast formulas." },
  ],
  "color-studio": [
    { term: "Gamut", definition: "The range of colors a color space or display can represent." },
    { term: "sRGB", definition: "The standard web color space supported by nearly all displays and browsers." },
    { term: "Display-P3 / P3", definition: "A wider display color space that can represent more saturated colors than sRGB." },
    { term: "In gamut", definition: "The color can be represented in that color space without changing it." },
    { term: "Clipped preview", definition: "An out-of-range channel was limited to the nearest sRGB value, so the preview is an approximation." },
    { term: "OKLCH", definition: "A perceptual color model using lightness, chroma, and hue; similar numeric changes tend to look more consistent." },
    { term: "Chroma", definition: "Colorfulness relative to a neutral gray. The maximum available chroma depends on hue and lightness." },
    { term: "WCAG contrast", definition: "A text contrast ratio used by WCAG accessibility guidance; larger text has a lower required threshold." },
  ],
  "regex-studio": [
    { term: "Regular expression", definition: "A pattern language for finding or replacing text." },
    { term: "Flag", definition: "An option that changes matching, such as global, case-insensitive, multiline, or dot-all." },
    { term: "Capture group", definition: "A parenthesized sub-pattern whose matched text can be referenced separately." },
    { term: "Lookaround", definition: "A condition checked before or after a position without consuming matched characters." },
    { term: "Greedy", definition: "Consumes as much text as possible while still allowing the full pattern to match." },
  ],
  "json-studio": [
    { term: "JSONPath", definition: "A query syntax for selecting values from a JSON document using paths and filters." },
    { term: "JSON Schema", definition: "A vocabulary for describing and validating the allowed shape and values of JSON data." },
    { term: "Patch", definition: "A machine-readable operation such as add, remove, or replace that transforms one document into another." },
    { term: "Pointer", definition: "A slash-separated JSON Pointer path that identifies an exact location in a document." },
  ],
  "network-studio": [
    { term: "DNS", definition: "The distributed system that maps domain names to records such as IP addresses and mail servers." },
    { term: "TTL", definition: "Time To Live: how long a DNS answer or cached result may be reused." },
    { term: "A / AAAA record", definition: "DNS records mapping a name to an IPv4 or IPv6 address." },
    { term: "CNAME", definition: "A DNS alias pointing one hostname to another hostname." },
    { term: "Port", definition: "A numbered network endpoint used to reach a particular service on a host." },
    { term: "Latency", definition: "Round-trip delay, usually measured in milliseconds; lower is faster." },
    { term: "HTTP header", definition: "Metadata sent with an HTTP request or response, separate from its body." },
    { term: "WebSocket", definition: "A persistent, two-way connection between a client and server after an HTTP upgrade." },
  ],
  "website-diagnostics-studio": [
    { term: "Redirect chain", definition: "The sequence of HTTP responses that forwards one URL to another." },
    { term: "CORS", definition: "Browser-enforced rules controlling whether one web origin may read responses from another." },
    { term: "Preflight", definition: "An OPTIONS request a browser may send to check CORS permission before the real request." },
    { term: "SPF", definition: "A DNS policy listing servers authorized to send mail for a domain." },
    { term: "DMARC", definition: "An email-authentication policy telling receivers how to handle SPF or DKIM failures." },
    { term: "Canonical URL", definition: "A page’s declared preferred URL for indexing duplicate or similar content." },
    { term: "Open Graph", definition: "Page metadata used by social platforms to build link previews." },
    { term: "SSRF protection", definition: "Server-side checks that block requests to private or sensitive network destinations." },
  ],
  "file-processing-studio": [
    { term: "Lossless", definition: "Processing that preserves all original information when decoded." },
    { term: "Lossy", definition: "Processing that discards some information to reduce file size." },
    { term: "Metadata", definition: "Descriptive information stored with a file, such as dimensions, dates, or camera details." },
    { term: "EXIF", definition: "Image metadata commonly written by cameras and phones; it can include location data." },
    { term: "MIME type", definition: "A standardized label describing a file’s content format, such as image/png." },
    { term: "Hash", definition: "A fixed-length fingerprint of file bytes; matching strong hashes strongly suggests identical content." },
    { term: "Archive", definition: "A container such as ZIP that bundles files and may also compress them." },
  ],
  "encoding-serialization-studio": [
    { term: "Serialization", definition: "Converting structured data into text or bytes that can be stored or transferred." },
    { term: "YAML", definition: "A human-oriented data format where indentation controls structure." },
    { term: "TOML", definition: "A configuration format based on keys, values, tables, and arrays." },
    { term: "XML", definition: "A tagged document format with elements, attributes, and strict nesting rules." },
    { term: "Radix / base", definition: "The number of digit symbols in a numeral system, such as base 2, 10, or 16." },
  ],
  "devops-configuration-studio": [
    { term: "Cron expression", definition: "A compact schedule describing minute, hour, day, month, and weekday fields." },
    { term: "IANA timezone", definition: "A named timezone whose database rules include daylight-saving and historical changes." },
    { term: "chmod", definition: "The Unix command and permission model for read, write, and execute access." },
    { term: "Octal permissions", definition: "Three digits representing owner, group, and other permissions; read=4, write=2, execute=1." },
    { term: "Semantic version", definition: "A MAJOR.MINOR.PATCH version where each part communicates compatibility changes." },
    { term: "Container image", definition: "A packaged filesystem and metadata used to start isolated application processes." },
    { term: "Kubernetes manifest", definition: "YAML or JSON declaring a desired Kubernetes resource and its configuration." },
  ],
  "data-api-studio": [
    { term: "SQL dialect", definition: "A database-specific variation of SQL, such as PostgreSQL, MySQL, or SQLite." },
    { term: "Escaped literal", definition: "A value quoted so its special characters are treated as data rather than SQL syntax." },
    { term: "OpenAPI", definition: "A machine-readable description of HTTP API endpoints, inputs, and responses." },
    { term: "GraphQL", definition: "A typed API query language in which clients request specific fields." },
    { term: "Seed", definition: "A starting number that makes pseudo-random generated data repeatable." },
    { term: "Flatten", definition: "Converts nested data into path-like keys; unflatten reverses that representation." },
  ],
  "security-identity-studio": [
    { term: "JWT", definition: "A signed or unsigned token containing Base64url-encoded claims; decoding alone does not establish trust." },
    { term: "HMAC", definition: "A keyed hash that verifies both integrity and possession of a shared secret." },
    { term: "JWK", definition: "A JSON representation of a cryptographic key and its parameters." },
    { term: "SRI", definition: "Subresource Integrity: a browser-checked hash for externally loaded scripts or styles." },
    { term: "TOTP", definition: "A short-lived one-time code derived from a shared secret and the current time." },
    { term: "PEM / DER", definition: "Common text-armored and binary encodings for certificates and cryptographic keys." },
    { term: "Fingerprint", definition: "A hash of certificate bytes used as a compact identity check." },
    { term: "Self-signed", definition: "A certificate signed by its own private key rather than a separate certificate authority." },
  ],
  "web-development-studio": [
    { term: "Data URI", definition: "A URL that embeds content directly instead of referring to a separate file." },
    { term: "viewBox", definition: "An SVG coordinate system that controls scaling and the visible drawing region." },
    { term: "Clamp", definition: "A CSS function that keeps a responsive value between a minimum and maximum." },
    { term: "Open Graph", definition: "Metadata that controls how many social platforms display a shared page." },
    { term: "Web app manifest", definition: "JSON metadata describing how an installable web app should appear and launch." },
    { term: "Minification", definition: "Removing or shortening nonessential source text to reduce transfer size without changing behavior." },
    { term: "Name mangling", definition: "Renaming local identifiers to shorter names during minification." },
  ],
};

export function getToolGlossary(toolId: string): ToolGlossaryTerm[] {
  return GLOSSARIES[toolId] ?? [];
}
