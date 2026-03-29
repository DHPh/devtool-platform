# Security

## Processing and privacy

Registry metadata labels every tool as `client`, `server`, or `hybrid`:

- Client tools keep transformations in the browser unless their UI explicitly links elsewhere.
- Server tools send the necessary input to this deployment's API.
- Hybrid tools use both boundaries.

Network tools necessarily disclose requested destinations or lookup subjects to the deployment server and relevant remote service. UI and product copy must not claim that all processing is local.

## Browser and input boundaries

All routes receive a restrictive browser-security header baseline, including
Content Security Policy, HSTS, MIME sniffing protection, frame denial, and a
limited Permissions Policy. Structured-data scripts must use the shared
HTML-safe JSON serializer.

Network POST routes accept JSON bodies up to 16 KiB and reject unsupported
content types before parsing. SVG data-URI and optimizer tools accept only a
self-contained element and attribute allowlist; scripts, event handlers,
embedded HTML or CSS, document types, entities, and external references are
rejected.

## Outbound-request policy

User-controlled HTTP destinations pass through `src/lib/server/outbound-request-policy.ts`. It:

- accepts only HTTP and HTTPS and rejects URL credentials;
- resolves all hostname answers and rejects loopback, private, link-local, multicast, reserved, metadata, or mixed public/private answers;
- pins the socket to a validated address while retaining the original Host header and TLS SNI;
- revalidates every redirect destination;
- caps connection time at 5 seconds, response time at 10 seconds, total time at 20 seconds, redirects at 3, response bodies at 1 MB, request bodies at 256 KB, and concurrent policy requests at 8;
- returns stable safe error codes instead of raw socket or infrastructure details.

URL Test and File Link Check use this policy directly. Ping uses a bounded HTTP probe without shell execution. Speed Test uses bounded transfers. WebSocket and port-scan routes resolve the same public-address policy and pin their connections; WebSocket redirects are disabled.

Port scans accept at most 20 unique ports from 1 through 65535, use four concurrent sockets, and cap per-port timeouts at five seconds.

## Rate limiting and logs

High-risk network routes use endpoint-specific fixed-window limits keyed by a hashed client identifier. The in-process store is a safe fallback for one instance, not a distributed control. Multi-instance production deployments must enforce equivalent shared limits at the platform gateway or replace the store.

Security events are structured JSON with the `network_security` type. Allowed fields include endpoint, operation, outcome, hashed client ID, duration, item count, and stable error code. Do not add URLs, hostnames, DNS query names, response records, credentials, or request payloads.

## DNS

DNS Lookup uses one isolated resolver configured at process startup. The deployment host's system DNS is used by default. `DNS_RESOLVERS` opts into custom servers and their privacy/retention policies. Traditional DNS may be unencrypted depending on host configuration.

Queries validate normalized ASCII domain labels and a bounded record-type allowlist. Resolver attempts are 2.5 seconds, use two tries, and have a five-second route deadline. Logs do not contain queried domains or returned records.

## Deployment checklist

- Keep Node.js, Next.js, WebSocket, and lockfile dependencies patched.
- Never expose internal-only destinations by weakening address classification.
- Forwarded client-IP headers are ignored unless `VERCEL=1` or
  `TRUST_PROXY_HEADERS=true`. Enable the latter only when the edge overwrites
  incoming forwarding headers.
- Configure distributed rate limiting before horizontal scaling.
- Review external services used by network and IP-information tools and disclose them where appropriate.
- Keep errors user-safe and preserve detailed diagnostics only in protected infrastructure telemetry.
- Add tests for every new protocol, redirect, timeout, size, concurrency, or destination-policy behavior.

For configuration and CI requirements, see [Deployment](DEPLOYMENT.md).
