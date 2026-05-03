# Processing engine conventions

Every executable registry entry has a production processor that can be called
from Node.js tests without rendering its UI.

- Keep deterministic transformation and validation logic in this directory or
  another shared `src/lib` engine imported by both the UI and its contract test.
- Return structured `ProcessorResult<T>` (`ok` / `err` / `tryProcess` from `src/lib/processors/result.ts`) or typed failures; never fabricate successful
  output after an exception.
- Inject clocks, randomness, network calls, and browser-only adapters when they
  affect results so tests remain deterministic.
- Keep server routes as policy and transport boundaries. Put reusable response
  interpretation in a shared processor.
- Add exactly one entry to `tests/tool-functions.test.ts` for every executable
  registry ID. That case may contain several success, invalid-input, boundary,
  or adversarial assertions.
- Run `npm run test:tools`, `npm run validate:registry`, and
  `npm run typecheck` before committing a new tool.

Studio containers are navigation and shared state only. Their sub-tools are the
executable entries and therefore require processors and functional contracts.
