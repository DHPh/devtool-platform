# Deployment

## Runtime and build

Use Node.js 20.9 or newer and install from the lockfile:

```bash
npm ci
npm run lint
npm run typecheck
npm test
npm run validate:registry
npm run build
npm run start
```

`npm run start` requires a successful production build. Network tools require a Node.js runtime with outbound DNS, TCP, HTTP, HTTPS, and WebSocket access; they are not compatible with a purely static export.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Canonical public origin |
| `NEXT_PUBLIC_SITE_NAME` | Public site name |
| `TWITTER_HANDLE` | Social metadata handle |
| `CONTACT_EMAIL` | Public contact address |
| `SUPPORT_URL` | Support destination |
| `GOOGLE_VERIFICATION_CODE` | Google site verification |
| `BING_VERIFICATION_CODE` | Bing site verification |
| `GOOGLE_ANALYTICS_ID` | Optional analytics property |
| `HOTJAR_ID` | Optional Hotjar property |
| `ENABLE_ANALYTICS` | Enables configured analytics when `true` |
| `SENTRY_DSN` | Optional error-monitoring destination |
| `ENABLE_ERROR_MONITORING` | Enables configured monitoring when `true` |
| `DNS_RESOLVERS` | Optional comma-separated DNS servers; system DNS is the default |

Replace placeholder site, contact, and verification values before production. Treat monitoring DSNs and deployment credentials according to the provider's secret-handling guidance.

## GitHub Actions and Vercel

The Vercel Git integration builds production deployments from `main` and manages preview deployments according to the Vercel project settings. It can start as soon as a commit is pushed.

GitHub Actions runs the quality and browser checks. For a push to `main`, the final job then verifies that the Vercel GitHub App reported a successful Production deployment for the exact commit SHA. This check uses the workflow's read-only GitHub deployment permission.

## Operational requirements

- Enforce HTTPS at the public edge.
- Apply a shared gateway or distributed rate limiter for multi-instance deployments; the application fallback is process-local.
- Restrict egress where possible while allowing intended public destinations and configured DNS.
- Send structured `network_security` events to the deployment logging system and alert on repeated blocks or rate limits.
- Review `npm audit` output. Do not apply `--force` changes that downgrade the framework without testing and an explicit migration decision.

See [Security](SECURITY.md) before exposing network utilities publicly.
