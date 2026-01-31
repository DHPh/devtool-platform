# Architecture

## Runtime shape

DevTool Platform uses Next.js 16 App Router and React 19. The catalog and tool metadata are server-renderable, while interactive tool implementations are loaded on demand in the browser. Network APIs run in the Node.js server runtime.

```text
Domain registries
  -> combined ordered registry
  -> catalog/search/metadata
  -> standalone lazy loader OR parent studio tab
  -> pure processor and/or bounded server API
```

## Tool registry

The authoritative metadata is split by domain under `src/lib/registry/`. `index.ts` combines the domain arrays and applies the intentional display order. Each entry is a discriminated union:

- `standalone`: owns `/tools/<id>` and requires a component ID plus lazy loader.
- `studio-subtool`: owns a parent path with `?tab=<tab>` and requires `parent` and `tab` fields.

Every tool also declares `processing: "client" | "server" | "hybrid"`. UI privacy labels derive from this value.

Registry validation checks IDs, paths, categories, types, processing modes, parents, tab paths, and standalone component mappings. It runs in tests, CI, and during production route initialization.

## Routing and loading

`src/app/tools/[slug]/page.tsx` statically generates standalone routes from `TOOL_COMPONENT_IDS`. `ToolRenderer` selects a typed loader from `src/lib/tool-components.ts`; unrelated tool implementations are not part of the selected tool's initial implementation chunk.

Studio sub-tools navigate to their registered parent. Each studio owns its tab presentation and component composition, while names, descriptions, paths, and processing modes remain registry data.

## Processing boundaries

Framework-independent transformations live in `src/lib/processors/`. Components should own input state, presentation, accessibility, and feedback—not transformation rules. Processor failures use stable typed errors where appropriate.

Server-side network routes live under `src/app/api/network/`. HTTP requests use the shared outbound policy in `src/lib/server/outbound-request-policy.ts`; endpoint rate limits and structured events are in `src/lib/server/network-security.ts`. See [Security](SECURITY.md) for the enforced boundaries.

## State and presentation

- Shared visual primitives: `src/components/ui/` and `src/components/layout/`
- Tool implementations: `src/lib/tools/`
- Persisted bookmarks and theme: `src/store/`
- Classification constants: `src/lib/tool-classification.ts`
- Site and SEO configuration: `src/config/site.ts`

## Change invariants

- Navigate with `tool.path`; never reconstruct a path from an ID.
- Add metadata only through a domain registry.
- Add every standalone ID to both the component-ID contract and lazy-loader map.
- Keep sub-tool parent and tab paths synchronized with the parent studio UI.
- Keep reusable logic outside React when it can be deterministic.
- Apply the shared outbound policy before connecting to user-controlled destinations.
