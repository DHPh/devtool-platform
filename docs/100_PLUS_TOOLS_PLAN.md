# 100+ Executable Tools Plan

Status: Complete

Created: 2026-01-24

Updated: 2026-02-19

Target: 105 executable tools

> **PLAN COMPLETE — Phase 5, Serverless Website Diagnostics.**
>
> Phases 0–5 are complete. The platform now has 105 executable tools and 117
> registry entries.

## Roadmap at a glance

| Phase | Purpose | Executable-tool target | Status |
| --- | --- | ---: | --- |
| Phase 0 | Fix existing security, correctness, standards, privacy, and capability gaps | 57 | Complete |
| Phase 1 | Make studios and processors easier to scaffold and register | 57 | Complete |
| Phase 2 | Deliver 16 quick browser tools | 73 | Complete |
| Phase 3 | Deliver 16 developer and data tools | 89 | Complete |
| Phase 4 | Deliver 8 advanced browser tools | 97 | Complete |
| **Phase 5** | **Deliver 8 serverless website diagnostics** | **105** | **Complete** |

## 1. Objective

Grow DevTool Platform beyond 100 useful, independently executable tools while
keeping browser performance, Vercel compatibility, security, automated test
coverage, and maintenance cost under control.

The target counts actual operations rather than inflating the number with
navigation containers:

| Metric | Current | Planned addition | Target |
| --- | ---: | ---: | ---: |
| Executable tools and studio sub-tools | 65 | 40 | 105 |
| Studio containers | 7 | 5 | 12 |
| Total registry entries | 72 | 45 | 117 |

Studio containers provide navigation and shared state but are not counted as
executable tools in the public 100+ goal.

## 2. Product principles

1. Prefer browser processing for deterministic transformations, generators,
   cryptography, and file operations.
2. Use Vercel Functions only when the operation requires remote HTTP, DNS, or
   another server capability.
3. Build shared processing engines rather than isolated component logic.
4. Require a Node-callable processor and deterministic result test for every
   executable registry entry.
5. Do not add a tool solely to increase the count. Each tool must solve a
   distinct user task and have a clear input/output contract.
6. Keep secrets, private keys, and sensitive file contents in the browser when
   server processing is unnecessary.

## 2.1 Mandatory current-tool modernization

Expansion must not begin by building new tools on top of processors with known
correctness, security, privacy, or standards gaps. Complete the following audit
work in Phase 0 before the first new-tool delivery phase.

### Priority 0: correctness and security

| Area | Current issue | Required change |
| --- | --- | --- |
| Markdown Preview | Regex-generated HTML is rendered with `dangerouslySetInnerHTML` without sanitization | Use a maintained CommonMark/GFM parser, sanitize output, and restrict link and image URL schemes |
| Regex Tester | User text and matches are inserted through `dangerouslySetInnerHTML` without escaping | Render escaped React text nodes and explicit `<mark>` elements |
| Password Studio | Password and passphrase generation uses `Math.random()` despite being described as secure | Use unbiased sampling from `crypto.getRandomValues()` for every security-sensitive choice and shuffle |
| File Hasher | Hashing failures return random strings of the expected digest length | Remove fabricated fallback results and return a typed failure |
| Duplicate Finder | Only the first 32 bytes are compared | Hash the complete file with SHA-256, preferably in a worker or incremental implementation |
| Archive Manager | Uploaded archive contents are simulated; only ZIP extraction is implemented | Remove simulated results and advertise only genuinely supported formats |
| IP Information API | The route bypasses the shared outbound policy and rate limiting, uses upstream HTTP, and leaks error details | Apply the shared network policy, use HTTPS, validate reserved/private addresses, rate limit, and return safe errors |
| JSON Schema | The custom validator rejects integers for schemas with `type: "number"` and only partially implements the specification | Adopt or build against Draft 2020-12 conformance tests |
| Functional tests | Some result cases call helpers that the production component does not use | Require every case to import the exact processor used by the production tool |

Acceptance criteria:

- No user-controlled string reaches `dangerouslySetInnerHTML` without a
  sanitizer and an explicit reason.
- Password and passphrase generation contain no `Math.random()` calls.
- A failed hash operation can never produce a value that resembles a valid
  digest.
- Duplicate detection compares complete file content.
- Network routes all use the shared security and error-response contracts.
- Every executable-tool test is linked to production processing code.

### Color Studio modernization

The current color engine accepts only three- and six-digit hex values. CSS
Color Module Level 4 includes modern RGB/HSL syntax, HWB, Lab, LCH, OKLab,
OKLCH, wide-gamut `color()` values such as Display P3, alpha, interpolation,
serialization, and gamut handling.

There is also a current correctness defect: accessibility helpers generate
`hsl(...)` strings and pass them to `getColorInfo()`, but `getColorInfo()` only
parses hex. Accessible-color discovery and adjustment can therefore return
incomplete or incorrect results.

Required shared color model:

- Store color space, components, alpha, original serialization, and gamut
  status.
- Use a colorimetric canonical representation rather than assuming every color
  is an eight-bit sRGB hex value.
- Parse and serialize `#rgb`, `#rgba`, `#rrggbb`, `#rrggbbaa`, modern and legacy
  `rgb()`, `hsl()`, `hwb()`, `lab()`, `lch()`, `oklab()`, `oklch()`,
  `color(display-p3 ...)`, named colors, and `transparent`.
- Preserve alpha through conversions.
- Report whether a color is outside sRGB or Display P3 and expose a documented
  gamut-mapping result rather than silently clipping components.

Required tool updates:

| Tool | Modification |
| --- | --- |
| Color Converter | Add OKLCH, OKLab, Lab, LCH, HWB, Display P3, alpha, modern CSS syntax, and gamut reporting |
| Color Picker | Permit OKLCH lightness/chroma/hue editing and show sRGB/P3 boundaries |
| Palette Generator | Generate perceptually consistent palettes in OKLCH instead of relying only on HSL |
| Gradient Creator | Offer sRGB, linear-sRGB, OKLab, and OKLCH interpolation with hue-path controls |
| Gradient Color Picker | Sample using the selected interpolation color space and preserve alpha |
| Contrast Checker | Update the label to WCAG 2.2 and the sRGB linearization threshold from `0.03928` to `0.04045` |
| Color Blindness Simulator | Document the simulation model and replace raw RGB difference with a perceptual metric |
| Accessibility Palette | Use WCAG 2.2 contrast plus perceptual distinguishability; treat APCA only as optional experimental information |

Color acceptance criteria:

- CSS Color 4 fixtures round-trip within documented numeric tolerances.
- Conversion tests include transparent colors, out-of-gamut colors, powerless
  hue cases, and sRGB/Display P3 boundaries.
- Palette lightness changes are perceptually ordered.
- Black-on-white remains 21:1 and WCAG AA/AAA thresholds remain 4.5:1, 3:1,
  and 7:1 as applicable.
- Internal helpers never send a color format back to a parser that cannot
  accept that format.

### Standards and capability upgrades

| Tool family | Required modernization |
| --- | --- |
| UUID Generator | Add RFC 9562 UUIDv7, keep cryptographic UUIDv4, add validation/version inspection, and remove the custom simplified UUIDv1 implementation |
| JSONPath | Implement RFC 9535 or rename the tool to clearly state that it supports only basic paths |
| JSON Schema | Support Draft 2020-12 semantics including numeric subtype behavior, `prefixItems`, dynamic references, and vocabularies |
| JSON Diff/Patch | Implement all RFC 6902 operations (`add`, `remove`, `replace`, `move`, `copy`, `test`) and stop on the first error |
| CSV Viewer/Data Explorer | Parse quoted multiline fields, escaped quotes, CRLF/LF records, unequal columns, and safe spreadsheet exports |
| QR Generator | Generate QR data locally in the browser instead of sending content to a third-party image service |
| HTML/CSS formatters | Replace regex transformations with syntax-aware parsers that preserve valid embedded content and comments |
| Base64/URL tools | Add Base64url, strict/forgiving modes, binary input, and clear UTF-8 behavior |
| Timestamp Converter | Add strict ISO 8601/RFC 3339 input, IANA timezones, micro/nanoseconds with `BigInt`, and DST ambiguity reporting |
| Email Validator | Label results as syntax checks, support IDN normalization, and distinguish syntax validity from deliverability |

### File and network capability corrections

- Archive Manager must list ZIP only until RAR, 7Z, TAR, and GZ are genuinely
  implemented.
- File Converter must not offer document, audio, video, GIF, BMP, or SVG
  conversions that the active implementation cannot produce correctly.
- Metadata Viewer must not report every document as one page or imply EXIF and
  document-property extraction when only basic browser metadata is available.
- Image tools must handle EXIF orientation, alpha, animated-image limitations,
  object URL cleanup, and per-format browser support explicitly.
- DNS Lookup must remove the WHOIS claim unless real server-side WHOIS/RDAP
  functionality is implemented.
- Simulated DNS propagation and WHOIS utilities must be removed from production
  code or clearly isolated as fixtures.
- API Tester and HTTP Client must disclose browser CORS limitations.
- QR Generator metadata must not claim browser-only privacy while it sends data
  to a remote QR service.
- WebSocket Tester documentation must distinguish a bounded outbound handshake
  from hosting a persistent WebSocket connection on Vercel.

References for the modernization work:

- [CSS Color Module Level 4](https://www.w3.org/TR/css-color-4/)
- [WCAG 2.2](https://www.w3.org/TR/WCAG22/)
- [W3C relative luminance definition](https://www.w3.org/WAI/WCAG21/Understanding/relative-luminance.html)
- [RFC 9562: UUIDs](https://www.rfc-editor.org/info/rfc9562/)
- [RFC 9535: JSONPath](https://www.rfc-editor.org/rfc/rfc9535.html)
- [JSON Schema Draft 2020-12](https://json-schema.org/draft/2020-12)
- [RFC 6902: JSON Patch](https://www.rfc-editor.org/rfc/rfc6902.html)
- [RFC 4180: CSV](https://www.rfc-editor.org/info/rfc4180/)
- [MDN `crypto.getRandomValues()`](https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues)
- [Vercel platform limits](https://vercel.com/docs/limits)

## 3. Proposed tool catalog

### 3.1 Encoding and Serialization Studio

Processing: browser

| # | Tool ID | Purpose |
| ---: | --- | --- |
| 1 | `yaml-formatter` | Format YAML with configurable indentation |
| 2 | `yaml-validator` | Validate YAML and report useful locations |
| 3 | `xml-formatter` | Format and normalize XML |
| 4 | `xml-validator` | Validate XML structure and syntax |
| 5 | `toml-formatter` | Parse, validate, and format TOML |
| 6 | `json-yaml-converter` | Convert JSON and YAML in both directions |
| 7 | `csv-json-converter` | Convert CSV and JSON in both directions |
| 8 | `number-base-converter` | Convert binary, octal, decimal, and hexadecimal |

Shared engine: `serialization-core`

### 3.2 Web Development Studio

Processing: browser

| # | Tool ID | Purpose |
| ---: | --- | --- |
| 9 | `javascript-formatter` | Format JavaScript and TypeScript source |
| 10 | `javascript-minifier` | Minify JavaScript with result-size reporting |
| 11 | `svg-optimizer` | Remove unnecessary SVG metadata and markup |
| 12 | `svg-data-uri-converter` | Convert SVG markup and data URIs |
| 13 | `css-unit-converter` | Convert px, rem, em, percent, and viewport units |
| 14 | `css-clamp-calculator` | Generate responsive CSS `clamp()` expressions |
| 15 | `open-graph-generator` | Generate Open Graph and social meta tags |
| 16 | `web-manifest-generator` | Generate and validate web app manifests |

Shared engine: `web-code-core`

### 3.3 DevOps and Configuration Studio

Processing: browser

| # | Tool ID | Purpose |
| ---: | --- | --- |
| 17 | `cron-expression-builder` | Build, parse, and explain cron expressions |
| 18 | `chmod-calculator` | Convert symbolic and numeric Unix permissions |
| 19 | `env-file-manager` | Parse, compare, and safely redact `.env` files |
| 20 | `semver-comparator` | Compare versions and evaluate version ranges |
| 21 | `dockerfile-linter` | Detect common Dockerfile correctness issues |
| 22 | `compose-validator` | Validate Docker Compose YAML structure |
| 23 | `kubernetes-validator` | Validate common Kubernetes manifest structure |
| 24 | `gitignore-generator` | Generate `.gitignore` files from selected stacks |

Shared engine: `devops-config-core`

### 3.4 Security and Identity Studio

Processing: browser by default; hybrid only when fetching a remote public key

| # | Tool ID | Purpose |
| ---: | --- | --- |
| 25 | `jwt-inspector` | Decode JWT headers and claims without implying trust |
| 26 | `jwt-signature-verifier` | Verify JWT signatures using supplied JWK or PEM data |
| 27 | `hash-hmac-generator` | Generate text hashes and keyed HMAC values |
| 28 | `symmetric-encryption` | Encrypt and decrypt text using authenticated encryption |
| 29 | `keypair-signature-tool` | Generate keys and sign or verify sample data |
| 30 | `sri-generator` | Generate Subresource Integrity hashes |
| 31 | `totp-tool` | Generate and validate time-based one-time passwords |
| 32 | `certificate-decoder` | Decode X.509 certificate fields and validity dates |

Shared engine: `crypto-core`, built around Web Crypto where supported. Security
tools must describe their limitations and must not claim that primitive-level
operations make an application secure.

### 3.5 Data and API Studio

Processing: browser

| # | Tool ID | Purpose |
| ---: | --- | --- |
| 33 | `sql-formatter` | Format common SQL dialects |
| 34 | `sql-query-builder` | Build parameterized SELECT queries visually |
| 35 | `json-typescript-generator` | Generate TypeScript types from JSON samples |
| 36 | `data-sql-generator` | Convert JSON or CSV rows into SQL statements |
| 37 | `openapi-validator` | Validate OpenAPI documents and references |
| 38 | `graphql-formatter` | Format and validate GraphQL documents |
| 39 | `json-flattener` | Flatten and unflatten nested JSON safely |
| 40 | `fake-data-generator` | Generate deterministic schema-driven test data |

Shared engine: `data-transform-core`

### 3.6 Website Diagnostics Studio

Processing: Vercel serverless

| # | Tool ID | Purpose |
| ---: | --- | --- |
| 41 | `redirect-tracer` | Follow and report a bounded redirect chain |
| 42 | `security-header-analyzer` | Analyze HTTP security headers |
| 43 | `cors-analyzer` | Inspect CORS response behavior safely |
| 44 | `robots-inspector` | Fetch and analyze `robots.txt` |
| 45 | `sitemap-validator` | Fetch and validate bounded sitemap documents |
| 46 | `open-graph-inspector` | Extract public page metadata with strict size limits |
| 47 | `email-dns-analyzer` | Analyze SPF, DMARC, and related DNS records |
| 48 | `dns-propagation-checker` | Compare results from bounded DNS-over-HTTPS resolvers |

Shared engine: `website-inspection-core`. Every remote destination must pass the
existing outbound request policy, redirect validation, DNS checks, timeouts,
response limits, concurrency controls, and rate limiting.

## 4. Delivery roadmap

### Phase 0: Existing Tool Remediation — START HERE

Goal: correct the existing tools before using them as foundations for six new
studios.

Milestones are implemented and verified in this order. Commit checkpoints are
created separately when requested.

#### Milestone 0.1: Eliminate HTML injection paths

- [x] Replace the Markdown Preview regex renderer with a maintained
  CommonMark/GFM parser and sanitized output.
- [x] Restrict Markdown link and image URL schemes.
- [x] Replace Regex Tester HTML-string highlighting with escaped React nodes
  and `<mark>` elements.
- [x] Add adversarial tests for raw HTML, event handlers, script URLs, broken
  markup, and matched text containing HTML.

#### Milestone 0.2: Secure password and passphrase randomness

- [x] Replace every security-sensitive `Math.random()` call with unbiased
  `crypto.getRandomValues()` sampling.
- [x] Inject the random-byte source so tests remain deterministic.
- [x] Test required character categories, exclusions, shuffle behavior, and
  invalid option combinations.

#### Milestone 0.3: Correct file integrity tools

- [x] Remove random fallback digests from File Hasher.
- [x] Hash complete files in Duplicate Finder using SHA-256.
- [x] Remove simulated archive contents and restrict Archive Manager to ZIP
  until other formats are implemented.
- [x] Run CPU-heavy full-file operations outside the rendering path.

#### Milestone 0.4: Secure remaining network behavior

- [x] Apply the shared rate limit, outbound policy, timeout, logging, and safe
  error contracts to IP Information.
- [x] Use an HTTPS upstream and define behavior for private, reserved, and
  special-use addresses.
- [x] Correct DNS/WHOIS, CORS, WebSocket, QR privacy, and processing-mode claims.

#### Milestone 0.5: Correct file capabilities and metadata

- [x] Show only conversions the active implementation can perform correctly.
- [x] Remove fake document page counts and unsupported metadata claims.
- [x] Handle EXIF orientation, alpha, animated-image limitations, format
  support, file-size bounds, and object URL cleanup.

#### Milestone 0.6: Modernize Color Studio

- [x] Introduce the shared CSS Color 4 model and parser.
- [x] Add OKLCH, OKLab, Lab, LCH, HWB, Display P3, alpha, and gamut reporting.
- [x] Update palettes and gradients to support perceptual interpolation.
- [x] Fix accessibility helpers that feed unsupported HSL strings to the
  hex-only parser.
- [x] Update WCAG labels and luminance math to WCAG 2.2.
- [x] Complete all Color Studio acceptance criteria in Section 2.1.

#### Milestone 0.7: Modernize structured-data tools

- [x] Bring JSON Schema behavior to Draft 2020-12.
- [x] Implement RFC 9535 JSONPath or clearly constrain the advertised scope.
- [x] Complete all RFC 6902 JSON Patch operations and failure semantics.
- [x] Support quoted multiline CSV records and safe spreadsheet export.

#### Milestone 0.8: Modernize identifiers and converters

- [x] Add UUIDv7 and remove the custom simplified UUIDv1 implementation.
- [x] Generate QR codes locally in the browser.
- [x] Add strict timestamp parsing, timezone behavior, and large timestamp
  precision.
- [x] Add Base64url and clarify email syntax-versus-deliverability results.
- [x] Replace regex-only HTML and CSS formatting with syntax-aware processing.

#### Milestone 0.9: Bind tests to production processors

- [x] Require each functional case to import the processor used by production.
- [x] Remove test-only duplicate implementations that can diverge from tools.
- [x] Add success, malformed-input, adversarial-input, and standards fixtures
  appropriate to each modified tool.
- [x] Run the complete quality gate before marking Phase 0 complete.

Acceptance criteria:

- All Priority 0 items and capability corrections in Section 2.1 are complete.
- Existing tool behavior has success, malformed-input, adversarial-input, and
  relevant standards fixtures.
- The registry contains accurate processing/privacy labels and capability
  descriptions.
- The full quality-gate command set passes before new studios are introduced.

### Phase 1: Expansion Infrastructure — COMPLETE

Goal: make adding six new studios and 48 sub-tools routine rather than bespoke.

- [x] Extend the scaffold command to discover supported studios from registry data
  instead of a fixed list of six parents.
- [x] Define a typed studio manifest containing tabs, labels, icons, and component
  loaders.
- [x] Add processing-engine conventions under `src/lib/processors/`.
- [x] Keep the functional test coverage guard mandatory for every executable tool.
- [x] Derive both `registryEntryCount` and `executableToolCount` from the registry.
- [x] Use the executable count for the public 100+ claim.

Acceptance criteria:

- [x] A new studio and its tabs can be scaffolded without editing several unrelated
  maps manually.
- [x] Registry validation distinguishes studio containers from executable entries.
- [x] CI fails when an executable entry has no functional result test.

### Phase 2: Quick Browser Tools — COMPLETE

Deliver the first 16 tools:

#### Milestone 2.1: Encoding and Serialization Studio — COMPLETE

- [x] YAML formatter and validator.
- [x] XML formatter and well-formedness validator.
- [x] TOML formatter and validator.
- [x] Bidirectional JSON/YAML and CSV/JSON converters.
- [x] Arbitrary-precision binary, octal, decimal, and hexadecimal converter.
- [x] Browser-only processing and Node functional contracts for all eight tools.

#### Milestone 2.2: DevOps quick tools

- [x] Cron expression builder.
- [x] Chmod calculator.
- [x] `.env` manager.
- [x] Semantic-version comparator.

#### Milestone 2.3: Data quick tools

- [x] JSON to TypeScript.
- [x] JSON flatten/unflatten.

#### Milestone 2.4: Security quick tools

- [x] JWT inspector.
- [x] Hash/HMAC generator.

Implementation note (2026-02-19): Three registry-backed studios add the eight
remaining Phase 2 operations. Shared processors cover cron parsing and run
previews, Unix permission conversion, `.env` parsing/comparison/redaction,
SemVer comparison and ranges, JSON-to-TypeScript inference, escaped-path JSON
flattening, unverified JWT inspection, and Web Crypto SHA-2/HMAC generation.
Every multi-value result has an individual copy action. Node functional
contracts cover all 73 executable tools, with focused processor and rendered
interaction tests for success, invalid-input, boundary, and copy behavior.

Original delivery grouping:

- Encoding and Serialization Studio: all 8 tools (complete).
- DevOps tools: cron builder, chmod calculator, `.env` manager, and semver
  comparator.
- Data tools: JSON to TypeScript and JSON flatten/unflatten.
- Security tools: JWT inspector and hash/HMAC generator.

Target after phase: 73 executable tools.

Acceptance criteria:

- All operations work without network access.
- Each processor has success, invalid-input, and boundary tests.
- Large parsing work can run in a Web Worker where it would otherwise block the
  main thread.

### Phase 3: Developer and Data Workflows

Deliver 16 tools:

#### Milestone 3.1: Web Development quick tools — COMPLETE

- [x] JavaScript and TypeScript formatter.
- [x] SVG data URI converter.
- [x] CSS unit converter.
- [x] CSS clamp calculator.
- [x] Open Graph generator.
- [x] Web manifest generator and validator.
- [x] Shared `web-code-core` processors with success, invalid-input, and
  boundary tests.

#### Milestone 3.2: DevOps validation tools — COMPLETE

- [x] Dockerfile linter.
- [x] Docker Compose validator.
- [x] Kubernetes manifest validator.
- [x] `.gitignore` generator.

#### Milestone 3.3: Data and API workflows — COMPLETE

- [x] SQL formatter.
- [x] SQL query builder.
- [x] Data-to-SQL generator.
- [x] OpenAPI validator.
- [x] GraphQL formatter.
- [x] Fake-data generator.

Target after phase: 89 executable tools.

Acceptance criteria:

- Generated SQL uses parameterized values or clearly labels unsafe literal
  output.
- Validators return structured errors with locations where possible.
- Formatting libraries are lazy-loaded and checked for bundle impact.

### Phase 4: Advanced Browser Processing

Deliver 8 tools:

- [x] JavaScript minifier and SVG optimizer.
- [x] Remaining six Security and Identity tools.

Target after phase: 97 executable tools.

Acceptance criteria:

- Cryptographic operations use vetted platform or maintained library APIs.
- Secret material is never logged, persisted, or sent to the server by default.
- CPU-intensive transformations are isolated from rendering.

### Phase 5: Serverless Website Diagnostics

Deliver all 8 Website Diagnostics tools.

Status: COMPLETE — shared bounded HTTP and DNS inspection engines, serverless
routes, studio UI, registry entries, and deterministic tests implemented.

- [x] Redirect tracer.
- [x] Security header analyzer.
- [x] CORS analyzer.
- [x] Robots.txt inspector.
- [x] Sitemap validator.
- [x] Open Graph inspector.
- [x] Email DNS analyzer.
- [x] DNS propagation checker.

Target after phase: 105 executable tools and 117 total registry entries.

Acceptance criteria:

- Every endpoint applies the shared outbound request policy.
- Tests mock external HTTP and DNS dependencies; CI does not rely on the public
  internet.
- Redirect count, response bytes, request duration, concurrency, and resolver
  fan-out are bounded.
- Errors do not expose internal addresses, credentials, payloads, or stack
  traces.

## 5. Browser and Vercel boundaries

### Browser-first operations

Keep formatting, validation, conversion, cryptography, and file transformation
in the browser. Use Web Workers for heavier CPU work and stream data where the
browser API permits it.

### Suitable Vercel Function operations

- Short, bounded public HTTP requests.
- DNS and DNS-over-HTTPS queries.
- Response-header inspection.
- Small public text documents such as robots files and bounded sitemaps.

### Operations to avoid on Vercel Functions

- General-purpose URL proxying.
- Large file uploads and conversions.
- Unrestricted scraping or recursive crawling.
- Broad or long-running port scans.
- Persistent monitoring processes.
- Hosting a WebSocket server.
- Work requiring durable local filesystem state.

Vercel Functions currently limit request and response bodies to 4.5 MB, making
browser-side file processing preferable. Vercel also states that Functions
cannot act as WebSocket servers.

References:

- [Vercel Function limits](https://vercel.com/docs/functions/limitations)
- [Vercel platform limits](https://vercel.com/docs/limits)
- [MDN SubtleCrypto](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto)

## 6. Standard implementation contract

Every new executable tool must include:

1. Registry metadata with an explicit `client`, `server`, or `hybrid` processing
   mode.
2. A pure or dependency-injected processor callable without React.
3. At least one deterministic functional result case in
   `tests/tool-functions.test.ts`.
4. Invalid-input and important boundary tests in a focused processor test.
5. Lazy component loading.
6. Accessible labels, keyboard operation, and useful error messages.
7. Documentation for privacy and remote processing behavior.
8. Resource bounds for files, input length, recursion, network calls, and
   generated output.

Server tools additionally require:

- Shared SSRF protection.
- Redirect destination revalidation.
- Request and response size limits.
- Timeouts and concurrency bounds.
- Rate limiting that can be moved to shared storage for multi-instance
  deployments.
- Structured logs that exclude destinations, secrets, and payloads.

## 7. Quality gates

Each phase must pass:

```bash
npm run lint
npm run typecheck
npm run test:tools
npm test
npm run validate:registry
npm run build
```

Browser journeys should be added for new studio navigation, but functional tool
correctness remains covered at the processor level rather than through UI tests.

## 8. Progress tracking

| Phase | New executable tools | Cumulative executable tools | Status |
| --- | ---: | ---: | --- |
| Baseline | 0 | 57 | Complete |
| **Phase 0: existing-tool remediation** | **0** | **57** | **Start here** |
| Phase 1: expansion infrastructure | 0 | 57 | Blocked by Phase 0 |
| Phase 2: quick browser tools | 16 | 73 | Blocked by Phase 1 |
| Phase 3: developer and data workflows | 16 | 89 | Blocked by Phase 2 |
| Phase 4: advanced browser processing | 8 | 97 | Blocked by Phase 3 |
| Phase 5: website diagnostics | 8 | 105 | Blocked by Phase 4 |

Update this table as changes land. Each completed phase should record its commit
or pull request, tool IDs delivered, test totals, bundle impact, and any deferred
security or compatibility work.