# Testing

## Commands

| Command | Boundary |
| --- | --- |
| `npm test` | All maintained Vitest tests |
| `npm run test:tools` | Node-only functional result contract for every executable tool |
| `npm run test:watch` | Vitest watch mode |
| `npm run test:e2e` | Playwright Chromium journeys |
| `npm run typecheck` | TypeScript contract check |
| `npm run lint` | Next.js, React, and TypeScript lint rules |
| `npm run validate:registry` | Focused registry validation suite |
| `npm run build` | Production compilation and static generation |

Vitest discovers `tests/**/*.test.ts` and `tests/**/*.test.tsx`. Processor, registry, route, and script tests use the Node environment. React Testing Library tests under `tests/component/` opt into jsdom and use shared matchers from `tests/setup.ts`.

The tool contract requires exactly one deterministic execution case for every
executable registry entry. Studio containers are navigation shells, so the
suite covers each of their sub-tools instead. A new executable tool without a
functional case fails the registry coverage guard.

## Browser tests

Install Chromium once:

```bash
npx playwright install chromium
```

By default Playwright starts the app at `http://localhost:3100`. To test an existing instance, set `PLAYWRIGHT_BASE_URL` to its origin. Keep `localhost` and `127.0.0.1` consistent because Next.js development resources enforce allowed origins.

The maintained smoke suite covers homepage-to-catalog-to-standalone navigation and homepage-to-studio-sub-tool navigation.

## What to test

- Pure processors: representative values, Unicode/binary boundaries, empty input, malformed input.
- Registry changes: uniqueness, category/type values, parent/tab paths, and component mappings.
- Server routes: input validation, safe errors, timeouts, resource caps, and blocked destinations without live external requests.
- Components: user-observable state and accessible roles rather than implementation details.
- Persistence: reset stores between tests and verify rehydration.

One-off investigations and fixtures belong under `scripts/diagnostics/`; they are excluded from maintained discovery.

## CI

GitHub Actions uses Node 20 and `npm ci`. The quality job runs lint, typecheck, Vitest, registry validation, and the production build. A dependent job installs Chromium and runs Playwright. Dependency downloads are cached, but generated output is not restored as a build cache.

Next 16's React effect and purity findings currently remain warnings for existing components. New code should avoid adding warnings, and targeted refactors should remove the documented exceptions rather than disabling the rules globally.
