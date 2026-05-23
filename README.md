# DevTool Platform

DevTool Platform is a Next.js application that presents standalone developer tools and grouped studio sub-tools through one validated registry. Most transformations run in the browser; tools marked `server` or `hybrid` use server routes and may contact user-selected or documented third-party services.

**Live:** [devtool.dhpham.dev](https://devtool.dhpham.dev)

## Highlights

- **Typed Registry & Lazy Loading:** Single validated tool registry covering standalone tools and grouped studio workspaces with typed lazy-loaded views.
- **Rich In-Browser Editing:** CodeMirror 6 editors and browser-native file, diff, encoding, PDF, and image workflows.
- **Responsive Execution & Security:** Web Worker offloading with timeouts for heavy regex, hashing, and diff tasks; SSRF protections on server/hybrid network routes.
- **Automated Quality Gates:** CI runs dependency audit, ESLint, TypeScript checks, Vitest unit/registry suites, Playwright smoke tests, and production builds.

**Tech Stack:** Next.js 16 · React 19 · TypeScript · Tailwind CSS · Zustand · CodeMirror 6 · Radix UI · Vitest · Playwright

## Requirements

- Node.js 20.9 or newer
- npm with the committed lockfile

## Local development

```bash
npm ci
npm run dev
```

Open `http://localhost:3000`.

## Maintained commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Turbopack development server |
| `npm run lint` | Run the Next.js and TypeScript ESLint rules |
| `npm run typecheck` | Check TypeScript without emitting files |
| `npm test` | Run maintained Vitest unit and component tests |
| `npm run test:e2e` | Run Chromium smoke journeys with Playwright |
| `npm run validate:registry` | Validate registry and component invariants |
| `npm run build` | Create a production build |
| `npm run start` | Serve a completed production build |

## Adding a tool

Start with the scaffolding command rather than editing registry and loader files independently:

```bash
npm run create-tool -- your-tool --name "Your Tool" --dry-run
npm run create-tool -- your-tool --name "Your Tool"
```

The command generates a component, pure processor placeholder, test, and registry entry. Standalone tools are also added to the typed lazy-loader contract. Studio sub-tools print the remaining parent-layout wiring step.

See [Adding a tool](docs/ADDING_A_TOOL.md) for all options and required checks.

## Documentation

- [Documentation index](docs/INDEX.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Adding a tool](docs/ADDING_A_TOOL.md)
- [Testing](docs/TESTING.md)
- [Deployment](docs/DEPLOYMENT.md)
- [Security](docs/SECURITY.md)

Historical implementation reports and superseded guides are retained under [`docs/archive/`](docs/archive/README.md) and are not current instructions.
