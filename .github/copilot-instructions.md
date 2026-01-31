# DevTool Platform contributor instructions

DevTool Platform uses Next.js 16, React 19, TypeScript, Tailwind CSS, domain registries, lazy standalone loaders, and bespoke studio layouts.

Use the maintained documentation as the source of truth:

- Architecture: `docs/ARCHITECTURE.md`
- Adding a tool: `docs/ADDING_A_TOOL.md`
- Testing: `docs/TESTING.md`
- Deployment: `docs/DEPLOYMENT.md`
- Security: `docs/SECURITY.md`

Key rules:

- Navigate with the registry's `tool.path`.
- Scaffold tools with `npm run create-tool -- <tool-id>`.
- Keep deterministic transformation logic in `src/lib/processors/`.
- Add standalone components to the typed ID and lazy-loader contracts.
- Wire studio tabs into their parent layouts after scaffolding.
- Label actual processing as client, server, or hybrid.
- Route user-controlled outbound connections through the shared destination policy.
- Run lint, typecheck, tests, registry validation, build, and relevant browser journeys before handoff.

Documents under `docs/archive/` are historical and are not current guidance.
