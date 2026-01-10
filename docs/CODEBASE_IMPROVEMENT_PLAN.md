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

- [ ] Replace `LEGACY_TOOL_CATEGORIES` with category definitions from `tool-classification.ts`.
- [ ] Filter by category ID and display the corresponding category name and icon.
- [ ] Remove the legacy category export after all consumers have migrated.
- [ ] Test that every non-empty category appears and produces the expected tools.

Acceptance criteria:

- Category filters use IDs such as `text-processing` and `encoding-decoding`.
- No visible category tab is empty because of a name/ID mismatch.
- There is one category model in the active codebase.

### 1.3 Make product claims data-driven and accurate

- [ ] Replace hard-coded "100+" counts with `TOOL_REGISTRY.length` or neutral wording.
- [ ] Decide whether totals include studio sub-tools and apply the choice consistently.
- [ ] Change "all processing happens locally" to wording that accounts for network APIs.
- [ ] Review page metadata, structured data, manifest text, and documentation for the same claims.

Acceptance criteria:

- Visible counts and SEO metadata agree with the registry.
- Privacy statements clearly explain that most tools are local while network tools contact servers or third parties.

### 1.4 Add registry validation

- [ ] Validate unique tool IDs and paths.
- [ ] Validate known category and type values.
- [ ] Validate that every sub-tool has an existing parent.
- [ ] Validate that sub-tool paths point to their parent studio.
- [ ] Validate that every standalone tool has a component mapping.
- [ ] Fail CI or the production build when validation fails.

Acceptance criteria:

- Invalid or duplicate registry entries cannot be merged unnoticed.
- Validation errors identify the tool and the broken field.

## Milestone 2: Registry and loading architecture

**Priority:** High  
**Dependency:** Milestone 1

### 2.1 Split the registry by domain

- [ ] Create `src/lib/registry/` with domain-specific registry files.
- [ ] Suggested modules: text, data, generators, security, web, network, and file processing.
- [ ] Combine modules through `src/lib/registry/index.ts`.
- [ ] Keep the public helper API stable during migration where practical.

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

- [ ] Add a processing mode: `client`, `server`, or `hybrid`.
- [ ] Distinguish standalone tools from studio sub-tools with a discriminated union.
- [ ] Make standalone component loaders and sub-tool parent/tab fields type-safe.
- [ ] Remove duplicate component-local metadata after the central definition is authoritative.

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

- [ ] Replace eager imports in `src/app/tools/[slug]/page.tsx` with typed dynamic loaders.
- [ ] Preserve static parameter and metadata generation.
- [ ] Add loading and failure states where necessary.
- [ ] Compare production bundle output before and after the change.

Acceptance criteria:

- Opening one tool does not require loading unrelated tool implementations in the client bundle.
- All static tool routes continue to build and render.
- Tool metadata remains available to server-rendered pages.

## Milestone 3: Separate domain logic from UI

**Priority:** High  
**Dependency:** Registry validation available

### 3.1 Extract pure processors incrementally

- [ ] Create `src/lib/processors/` for framework-independent logic.
- [ ] Start with Base64, JSON, CSV, URL encoding, and text conversion.
- [ ] Keep processors deterministic and free of browser/React state where possible.
- [ ] Make React components responsible for input state, presentation, and user feedback only.

Suggested structure:

```text
src/lib/processors/
├── base64.ts
├── json.ts
├── csv.ts
├── url.ts
└── text.ts
```

Acceptance criteria:

- Core transformations can be tested without rendering React.
- Existing UI behavior remains unchanged.
- Processing errors use consistent typed results or error classes.

### 3.2 Correct Unicode Base64 handling

- [ ] Replace direct text use of `btoa` and `atob` with byte-safe encoding helpers.
- [ ] Use `TextEncoder` and `TextDecoder` for UTF-8.
- [ ] Test Vietnamese text, emoji, ASCII, empty input, and malformed Base64.

Acceptance criteria:

- Values such as `Xin chào 👋` round-trip correctly.
- Invalid input produces a clear validation error without crashing the component.

## Milestone 4: Testing and CI

**Priority:** High  
**Can begin alongside:** Milestones 2 and 3

### 4.1 Establish the test stack

- [ ] Add Vitest for registry and processor unit tests.
- [ ] Add React Testing Library for interactive component tests.
- [ ] Add Playwright for critical browser journeys.
- [ ] Keep ad hoc diagnostic scripts separate from the maintained automated suite.

### 4.2 Required test coverage

- [ ] Registry uniqueness, categories, parents, paths, and component availability.
- [ ] All registered paths resolve to a supported page or studio tab.
- [ ] Search and category filtering.
- [ ] Bookmark persistence and theme persistence.
- [ ] Representative formatter, converter, generator, and validator behavior.
- [ ] API validation, timeouts, and blocked network destinations.
- [ ] Homepage → catalog → standalone tool journey.
- [ ] Homepage → studio sub-tool journey.

### 4.3 Continuous integration

- [ ] Run TypeScript, ESLint, unit tests, registry validation, and production build on pull requests.
- [ ] Run browser smoke tests on an appropriate CI environment.
- [ ] Cache dependencies without caching generated output that could hide failures.

Acceptance criteria:

- A broken registry link fails CI.
- Core journeys are exercised automatically.
- The maintained test commands are documented in the root README.

## Milestone 5: Network security hardening

**Priority:** Critical for public deployment  
**Dependency:** API test harness

### 5.1 Create a shared outbound-request policy

- [ ] Allow only explicitly supported protocols, normally HTTP and HTTPS.
- [ ] Reject credentials embedded in URLs.
- [ ] Resolve hostnames and block loopback, private, link-local, multicast, and reserved addresses.
- [ ] Revalidate every redirect destination.
- [ ] Define connection, response, and total request timeouts.
- [ ] Limit redirect count, response size, request body size, and concurrency.
- [ ] Return safe user-facing errors without exposing sensitive server details.

### 5.2 Protect high-risk endpoints

- [ ] Audit URL test, file-link check, WebSocket test, port scan, ping, and speed-test routes.
- [ ] Apply the shared destination policy to every applicable endpoint.
- [ ] Constrain port ranges and scan concurrency.
- [ ] Add per-client rate limiting or an equivalent platform-level control.
- [ ] Add structured security logging without recording sensitive payloads.

### 5.3 Improve DNS route behavior

- [ ] Configure DNS resolver behavior once rather than mutating global servers per lookup.
- [ ] Validate domain names and record types before resolution.
- [ ] Add lookup timeouts and consistent error mapping.
- [ ] Document whether public resolvers are used and what privacy implications that has.

Acceptance criteria:

- Requests cannot target localhost, private infrastructure, or cloud metadata endpoints.
- Redirects cannot bypass destination checks.
- Slow or oversized responses cannot hold server resources indefinitely.
- Security behavior is covered by automated tests.

## Milestone 6: Developer experience and maintenance

**Priority:** Medium  
**Dependency:** Finalized tool contract

### 6.1 Add a tool scaffolding command

- [ ] Add a command such as `npm run create-tool -- <tool-id>`.
- [ ] Generate a component, processor placeholder, tests, and registry definition.
- [ ] Support standalone tools and studio sub-tools.
- [ ] Validate kebab-case IDs and prevent overwriting existing files.
- [ ] Print the generated files and required follow-up work.

Acceptance criteria:

- A developer can scaffold a valid tool without manually synchronizing several files.
- Generated output passes registry validation and TypeScript checks.

### 6.2 Align dependencies and scripts

- [ ] Align `next`, `eslint-config-next`, React, and related type packages.
- [ ] Replace obsolete lint commands with a supported direct ESLint command.
- [ ] Add explicit `typecheck`, `test`, `test:e2e`, and `validate:registry` scripts.
- [ ] Review unused production dependencies after lazy-loading and processor extraction.

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
