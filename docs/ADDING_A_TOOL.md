# Adding a tool

## Use the scaffolder

Preview a standalone tool:

```bash
npm run create-tool -- example-tool \
  --name "Example Tool" \
  --description "Transform example input" \
  --domain web \
  --category utilities \
  --type converter \
  --processing client \
  --dry-run
```

Remove `--dry-run` to write the files. The command refuses unsafe IDs, duplicate IDs or paths, unknown contract values, missing parents, and existing target files.

Supported registry domains are `text`, `data`, `generators`, `security`, `web`, `network`, and `file`. Run `npm run create-tool -- --help` for all options.

## Standalone output

A standalone scaffold creates:

- `src/lib/tools/<id>.tsx`
- `src/lib/processors/<id>.ts`
- `tests/<id>.test.ts`
- a definition in the selected domain registry
- an ordered registry ID
- a typed component ID and lazy loader

Replace the placeholder interface and processor while keeping the processor deterministic when possible.

## Studio sub-tools

```bash
npm run create-tool -- request-timeline \
  --kind studio-subtool \
  --parent network-studio \
  --tab timeline \
  --domain network \
  --processing server
```

Supported parents are Color, File Processing, JSON, Network, Password, and Regex studios. The command creates the tab component, processor, test, registry entry, and ordered ID. It does not rewrite the parent layout because studios have intentionally different state and presentation structures. Follow the printed instruction to export the tab, add it to the parent's tab configuration, and confirm the registered query parameter activates it.

## Metadata decisions

- `path` is the canonical navigation destination.
- `category` and `type` must use existing classification values.
- `processing` describes the real privacy boundary, not the preferred implementation.
- `tags` should describe searchable behavior and formats.
- A server or hybrid tool must document and test its external-data behavior.

## Required checks

```bash
npm run lint
npm run typecheck
npm test
npm run validate:registry
npm run build
npm run test:e2e
```

For a studio sub-tool, add or extend a browser journey when its navigation or state behavior differs from existing tabs.
