# Maintained tests

The automated suite is split by test boundary:

- `*.test.ts` and `*.test.tsx` cover registries, processors, and React components with Vitest.
- `component/` contains React Testing Library tests running in jsdom.
- `e2e/` contains Playwright browser journeys.
- `setup.ts` installs shared Vitest matchers.

Run the maintained checks from the repository root:

```bash
npm test
npm run test:watch
npm run test:e2e
```

Playwright requires its Chromium binary once per environment:

```bash
npx playwright install chromium
```

By default, Playwright starts the app on port 3100. To test an already running
instance, set `PLAYWRIGHT_BASE_URL` to that instance before running
`npm run test:e2e`.

Legacy investigations, sample files, and one-off debugging programs live in
`scripts/diagnostics/`. They are intentionally excluded from automated test
discovery and should be promoted into this directory only after being rewritten
as deterministic assertions.
