# DevTool Platform Codebase Improvement Plan

## Purpose

This plan improves correctness, maintainability, security, testing, and developer experience before the platform adds more tools. It is organized so that routing and metadata inconsistencies are fixed first, architecture changes follow on a stable base, and security and automation improvements are introduced with appropriate tests.

## Goals

- Make every tool link resolve to the intended standalone page or studio tab.
- Establish one authoritative definition for tool metadata and implementation.
- Remove obsolete category behavior and generate product claims from real data.
- Make tool logic easier to test and reuse independently of React.
- Protect server-side network utilities from SSRF and resource abuse.
- Provide automated checks that prevent registry and routing drift.
- Make adding a new tool predictable and low-risk.

## Non-goals

- Redesigning the visual identity or replacing the component library.
- Rewriting every existing tool in one release.
- Adding new tools before the correctness milestone is complete.
- Changing hosting providers or introducing user accounts.

## Guiding decisions

1. `tool.path` is the canonical navigation destination. Code should not reconstruct a tool URL from its ID.
2. Stable machine-readable category IDs are canonical. Display names are presentation data.
3. A standalone tool must have both metadata and a loadable component. A studio sub-tool must have a valid parent and tab path.
4. Privacy messaging must distinguish client, server, and hybrid processing.
5. New behavior requires automated tests proportional to its risk.

## Milestone 1: Correctness and consistency

**Priority:** Critical  
**Target:** First release

### 1.1 Use canonical tool paths

- [x] Replace every `href={`/tools/${tool.id}`}` construction with `href={tool.path}`.
- [x] Check the homepage, tools catalog, search results, bookmarks, navigation, featured lists, and classification views.
- [x] Verify studio sub-tools open the correct parent and selected tab.
- [x] Add a regression test covering at least one standalone tool and one sub-tool.

Likely files:

- `src/app/page.tsx`
- `src/app/tools/page.tsx`
- `src/components/interactive-tools.tsx`
- `src/components/tool-classification-view.tsx`
- `src/components/navigation.tsx`

Acceptance criteria:

- Every rendered tool link uses the registry's `path` value.
- `/tools/network-studio?tab=dns-lookup` and equivalent studio links open correctly.
- No catalog link sends a sub-tool to an unsupported `/tools/[sub-tool-id]` page.

### 1.2 Remove legacy category filtering

- [x] Replace `LEGACY_TOOL_CATEGORIES` with category definitions from `tool-classification.ts`.
- [x] Filter by category ID and display the corresponding category name and icon.
- [x] Remove the legacy category export after all consumers have migrated.
- [x] Test that every non-empty category appears and produces the expected tools.

Acceptance criteria:

- Category filters use IDs such as `text-processing` and `encoding-decoding`.
- No visible category tab is empty because of a name/ID mismatch.
- There is one category model in the active codebase.

### 1.3 Make product claims data-driven and accurate

- [x] Replace hard-coded "100+" counts with `TOOL_REGISTRY.length` or neutral wording.
- [x] Decide whether totals include studio sub-tools and apply the choice consistently.
- [x] Change "all processing happens locally" to wording that accounts for network APIs.
- [x] Review page metadata, structured data, manifest text, and documentation for the same claims.

Acceptance criteria:

- Visible counts and SEO metadata agree with the registry.
- Privacy statements clearly explain that most tools are local while network tools contact servers or third parties.

### 1.4 Add registry validation

- [x] Validate unique tool IDs and paths.
- [x] Validate known category and type values.
- [x] Validate that every sub-tool has an existing parent.
- [x] Validate that sub-tool paths point to their parent studio.
- [x] Validate that every standalone tool has a component mapping.
- [x] Fail CI or the production build when validation fails.

Acceptance criteria:

- Invalid or duplicate registry entries cannot be merged unnoticed.
- Validation errors identify the tool and the broken field.

## Milestone 2: Registry and loading architecture

**Priority:** High  
**Dependency:** Milestone 1

### 2.1 Split the registry by domain

- [x] Create `src/lib/registry/` with domain-specific registry files.
- [x] Suggested modules: text, data, generators, security, web, network, and file processing.
- [x] Combine modules through `src/lib/registry/index.ts`.
- [x] Keep the public helper API stable during migration where practical.

Suggested structure:

```text
src/lib/registry/
├── text-tools.ts
├── data-tools.ts
├── generator-tools.ts
├── security-tools.ts
├── web-tools.ts
├── network-tools.ts
├── file-tools.ts
├── validation.ts
└── index.ts
```

Acceptance criteria:

- No domain registry file becomes a new monolith.
- Existing consumers import the combined registry and helpers from one public module.
- Registry validation passes with unchanged tool behavior.

### 2.2 Define an explicit tool contract

- [x] Add a processing mode: `client`, `server`, or `hybrid`.
- [x] Distinguish standalone tools from studio sub-tools with a discriminated union.
- [x] Make standalone component loaders and sub-tool parent/tab fields type-safe.
- [x] Remove duplicate component-local metadata after the central definition is authoritative.

Proposed direction:

```ts
type ToolDefinition = StandaloneToolDefinition | StudioSubToolDefinition;

interface ToolMetadata {
  id: string;
  name: string;
  description: string;
  category: ToolCategoryId;
  path: string;
  processing: "client" | "server" | "hybrid";
}
```

Acceptance criteria:

- TypeScript prevents a sub-tool without a parent or tab destination.
- The UI can derive an accurate processing/privacy label from metadata.
- A tool's name, description, tags, and path have one authoritative source.

### 2.3 Lazy-load standalone tools and studios

- [x] Replace eager imports in `src/app/tools/[slug]/page.tsx` with typed dynamic loaders.
- [x] Preserve static parameter and metadata generation.
- [x] Add loading and failure states where necessary.
- [x] Compare production bundle output before and after the change.

Bundle measurement (2026-01-24, `next build`): JavaScript output changed from 18 chunks / 3,262,068 bytes to 57 chunks / 3,064,428 bytes. The largest chunk decreased from 847,519 to 602,200 bytes. Generated tool pages reference 14 shared initial chunks; representative JSON Formatter and Password Studio implementation chunks are deferred and absent from initial HTML.

Acceptance criteria:

- Opening one tool does not require loading unrelated tool implementations in the client bundle.
- All static tool routes continue to build and render.
- Tool metadata remains available to server-rendered pages.

## Milestone 3: Separate domain logic from UI

**Priority:** High  
**Dependency:** Registry validation available

### 3.1 Extract pure processors incrementally

- [x] Create `src/lib/processors/` for framework-independent logic.
- [x] Start with Base64, JSON, CSV, URL encoding, and text conversion.
- [x] Keep processors deterministic and free of browser/React state where possible.
- [x] Make React components responsible for input state, presentation, and user feedback only.

Suggested structure:

```text
src/lib/processors/
├── base64.ts
├── json.ts
├── csv.ts
├── url.ts
└── text.ts
```

Implementation note (2026-01-24): Base64, JSON, CSV, URL, and text transformations now live under `src/lib/processors/`, with compatibility exports retained for existing JSON and CSV imports. Eight processor tests exercise the core transformations without rendering React, and processor failures use the shared `ProcessorError` class.

Acceptance criteria:

- Core transformations can be tested without rendering React.
- Existing UI behavior remains unchanged.
- Processing errors use consistent typed results or error classes.

### 3.2 Correct Unicode Base64 handling

- [x] Replace direct text use of `btoa` and `atob` with byte-safe encoding helpers.
- [x] Use `TextEncoder` and `TextDecoder` for UTF-8.
- [x] Test Vietnamese text, emoji, ASCII, empty input, and malformed Base64.

Implementation note (2026-01-24): Base64 text now crosses the binary boundary through `TextEncoder` and a fatal UTF-8 `TextDecoder`. Tests cover exact ASCII, Vietnamese, and emoji encodings, empty input, malformed Base64, and Base64 containing invalid UTF-8 bytes.

Acceptance criteria:

- Values such as `Xin chào 👋` round-trip correctly.
- Invalid input produces a clear validation error without crashing the component.

## Milestone 4: Testing and CI

**Priority:** High  
**Can begin alongside:** Milestones 2 and 3

### 4.1 Establish the test stack

- [x] Add Vitest for registry and processor unit tests.
- [x] Add React Testing Library for interactive component tests.
- [x] Add Playwright for critical browser journeys.
- [x] Keep ad hoc diagnostic scripts separate from the maintained automated suite.

Implementation note (2026-01-24): Vitest discovery is restricted to maintained `*.test.ts(x)` files and includes shared Testing Library matchers. A jsdom component test verifies accessible loading feedback, while Playwright provides a Chromium catalog smoke journey with optional `PLAYWRIGHT_BASE_URL` support. Legacy debug programs and fixtures now live under `scripts/diagnostics/` outside automated discovery.

### 4.2 Required test coverage

- [x] Registry uniqueness, categories, parents, paths, and component availability.
- [x] All registered paths resolve to a supported page or studio tab.
- [x] Search and category filtering.
- [x] Bookmark persistence and theme persistence.
- [x] Representative formatter, converter, generator, and validator behavior.
- [x] API validation, timeouts, and blocked network destinations.
- [x] Homepage → catalog → standalone tool journey.
- [x] Homepage → studio sub-tool journey.

Implementation note (2026-01-24): Registry tests now prove every registered path maps to a standalone component or a known studio tab. Unit and jsdom tests cover search/category behavior, persisted bookmarks/themes, and representative formatter, converter, generator, and validator behavior. Network route tests cover malformed input, abort-driven timeouts, and direct local/private destinations without making external calls. Two Chromium journeys cover homepage-to-catalog-to-JSON Formatter and homepage-to-Network Studio DNS Lookup navigation.

### 4.3 Continuous integration

- [x] Run TypeScript, ESLint, unit tests, registry validation, and production build on pull requests.
- [x] Run browser smoke tests on an appropriate CI environment.
- [x] Cache dependencies without caching generated output that could hide failures.

Implementation note (2026-01-24): GitHub Actions uses Node 20 and lockfile installs. The quality job runs the maintained ESLint command, TypeScript, Vitest, registry validation, and a production build; a dependent browser job installs Chromium and runs Playwright. `actions/setup-node` caches npm's package download cache, while generated `.next`, test results, and browser reports are neither restored nor uploaded as build caches.

Acceptance criteria:

- A broken registry link fails CI.
- Core journeys are exercised automatically.
- The maintained test commands are documented in the root README.

## Milestone 5: Network security hardening

**Priority:** Critical for public deployment  
**Dependency:** API test harness

### 5.1 Create a shared outbound-request policy

- [x] Allow only explicitly supported protocols, normally HTTP and HTTPS.
- [x] Reject credentials embedded in URLs.
- [x] Resolve hostnames and block loopback, private, link-local, multicast, and reserved addresses.
- [x] Revalidate every redirect destination.
- [x] Define connection, response, and total request timeouts.
- [x] Limit redirect count, response size, request body size, and concurrency.
- [x] Return safe user-facing errors without exposing sensitive server details.

Implementation note (2026-01-24): `src/lib/server/outbound-request-policy.ts` resolves every hostname through the operating system resolver, rejects the entire answer set if any address is non-public, and pins the request socket to a validated address while preserving the original HTTP Host and TLS SNI. Redirects are followed manually through the same validation. Absolute caps cover connection/response/total time, three redirects, 1 MB responses, 256 KB request bodies, and eight concurrent requests. URL Test and File Link Check now return stable policy error codes without raw network details; remaining high-risk endpoint migrations are tracked in 5.2.

### 5.2 Protect high-risk endpoints

- [x] Audit URL test, file-link check, WebSocket test, port scan, ping, and speed-test routes.
- [x] Apply the shared destination policy to every applicable endpoint.
- [x] Constrain port ranges and scan concurrency.
- [x] Add per-client rate limiting or an equivalent platform-level control.
- [x] Add structured security logging without recording sensitive payloads.

Implementation note (2026-01-24): Ping now uses the bounded HTTP policy and no longer constructs shell commands. WebSocket handshakes and TCP scans reject non-public DNS answer sets and pin connections to a validated address; WebSocket redirects are disabled. Port scans accept at most 20 unique ports in the 1–65535 range, run four connections at a time, and cap per-port timeouts at five seconds. Speed tests use the shared request policy with a 1 MB download, 64 KB upload, and ten-second ceiling. All six high-risk routes use endpoint-specific, per-client fixed-window limits and structured JSON security events containing hashed client identifiers and no URL, host, or request payload. The limiter is process-local; multi-instance deployments should enforce an equivalent shared limit at the gateway or replace the store with distributed state.

### 5.3 Improve DNS route behavior

- [x] Configure DNS resolver behavior once rather than mutating global servers per lookup.
- [x] Validate domain names and record types before resolution.
- [x] Add lookup timeouts and consistent error mapping.
- [x] Document whether public resolvers are used and what privacy implications that has.

Implementation note (2026-01-24): DNS Lookup uses one instance-scoped Node.js resolver configured at module initialization with 2.5-second attempts, two tries, and a five-second route deadline. The deployment host's system resolvers are used by default; operators can opt into custom resolvers once at startup through `DNS_RESOLVERS`. Domains are normalized to ASCII and validated label-by-label, IP literals and malformed names are rejected, and requests are limited to eight supported record types. Stable error codes distinguish no-data/not-found, refusal, server failure, timeout, and temporary unavailability without returning resolver internals. DNS security logs contain only hashed client identifiers, timing, counts, and safe error codes. Resolver privacy and configuration are documented in `docs/network/DNS_RESOLVER_PRIVACY.md`.

Acceptance criteria:

- Requests cannot target localhost, private infrastructure, or cloud metadata endpoints.
- Redirects cannot bypass destination checks.
- Slow or oversized responses cannot hold server resources indefinitely.
- Security behavior is covered by automated tests.

## Milestone 6: Developer experience and maintenance

**Priority:** Medium  
**Dependency:** Finalized tool contract

### 6.1 Add a tool scaffolding command

- [x] Add a command such as `npm run create-tool -- <tool-id>`.
- [x] Generate a component, processor placeholder, tests, and registry definition.
- [x] Support standalone tools and studio sub-tools.
- [x] Validate kebab-case IDs and prevent overwriting existing files.
- [x] Print the generated files and required follow-up work.

Implementation note (2026-01-24): `npm run create-tool -- <tool-id>` generates an accessible client component or studio tab, a deterministic pure processor placeholder, a Vitest file, and domain registry metadata. Standalone scaffolds also update the ordered registry, component ID contract, and lazy loader; studio sub-tools validate one of the six supported parent studios and print the parent-layout wiring step because studio layouts remain intentionally bespoke. The command validates category, type, processing mode, safe kebab-case IDs, duplicate IDs and paths, required source anchors, and all target paths before writing. `--dry-run` previews the complete file set, and fixture-based tests cover both tool kinds and overwrite protection.

Acceptance criteria:

- A developer can scaffold a valid tool without manually synchronizing several files.
- Generated output passes registry validation and TypeScript checks.

### 6.2 Align dependencies and scripts

- [x] Align `next`, `eslint-config-next`, React, and related type packages.
- [x] Replace obsolete lint commands with a supported direct ESLint command.
- [x] Add explicit `typecheck`, `test`, `test:e2e`, and `validate:registry` scripts.
- [x] Review unused production dependencies after lazy-loading and processor extraction.

Implementation note (2026-01-24): Next and `eslint-config-next` now share the 16.2 release line, React and React DOM share 19.2, and the React type packages match that minor line. The project declares Node 20.9 or newer, retains ESLint 9 and TypeScript 5 stable release lines, and uses Next 16's native flat ESLint exports with the direct `eslint .` command. The maintained typecheck, Vitest, Playwright, and registry scripts were already established in milestones 4.1–4.3 and remain the CI contract. Unused direct runtime declarations for `@radix-ui/react-icons` and the unimplemented `@vercel/og` integration were removed; type-only and CSS-build packages moved to development dependencies, and redundant `@types/jszip` was removed because JSZip ships its own declarations. `ws` was updated to 8.21 to address its current security advisories. Next 16's newly enabled React effect/purity findings remain warnings pending targeted component refactors. The dependency audit retains two moderate reports for Next's bundled PostCSS version; npm offers only an unsafe Next 9 downgrade, so no forced audit change was applied.

Acceptance criteria:

- `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` work locally and in CI.
- Framework and lint configuration versions are compatible.

### 6.3 Consolidate documentation

- [ ] Maintain a small active documentation set: architecture, adding a tool, testing, deployment, and security.
- [ ] Move historical implementation summaries and completed fix notes to `archive/`.
- [ ] Update `docs/INDEX.md` and the root README.
- [ ] Clearly mark archived material as historical rather than current guidance.

Acceptance criteria:

- A new contributor can find current instructions without reading historical fix reports.
- Active documentation matches the implemented registry and routing model.

## Recommended delivery sequence

1. Canonical path fixes and route tests.
2. Category migration and accurate product claims.
3. Registry validation in CI.
4. Registry split and typed tool contract.
5. Lazy component loading.
6. Processor extraction and Unicode-safe Base64.
7. Network security policy and endpoint hardening.
8. Tool scaffolding, dependency alignment, and documentation cleanup.

## Pull request strategy

Keep changes reviewable and independently releasable:

1. **PR 1:** Canonical paths and regression tests.
2. **PR 2:** Category migration and claim corrections.
3. **PR 3:** Registry validation and CI checks.
4. **PR 4:** Registry module split with no behavior changes.
5. **PR 5:** Typed definitions and dynamic component loaders.
6. **PR 6+:** Processor extraction, one tool family at a time.
7. **Dedicated security PRs:** Shared outbound policy followed by endpoint migrations.
8. **Final maintenance PR:** Scaffold command, scripts, dependency alignment, and documentation archive.

## Definition of done

The improvement program is complete when:

- Every registered path is automatically validated and resolves correctly.
- Categories, counts, SEO claims, and privacy labels derive from current definitions.
- Standalone and studio sub-tools are represented by a type-safe contract.
- Tool implementations load independently where practical.
- Core processors have unit tests and are separated from React UI code.
- Public network endpoints enforce destination, timeout, size, redirect, and rate limits.
- CI runs linting, type checking, tests, registry validation, and a production build.
- A contributor can scaffold and document a new tool through a maintained workflow.

## Progress tracking

Update the checkboxes in this document as work lands. Each completed milestone should also record:

- The pull requests or commits that implemented it.
- Any deliberate deviations from this plan.
- New follow-up work discovered during implementation.
- Relevant before/after measurements, such as bundle size, route coverage, or test duration.