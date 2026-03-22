import { XMLValidator } from "fast-xml-parser";
import {
  requestOutbound,
  type OutboundRequestOptions,
  type OutboundResponse,
} from "./outbound-request-policy";
import {
  normalizeDnsDomain,
  normalizeDnsRecordTypes,
  performDnsLookup,
  type DnsLookupResult,
  type SupportedDnsRecordType,
} from "./dns-resolver";

export type WebsiteRequester = (
  url: string,
  options?: OutboundRequestOptions,
) => Promise<OutboundResponse>;

const REQUEST_HEADERS = {
  "user-agent": "DevToolPlatform-Diagnostics/1.0",
  accept:
    "text/html,application/xhtml+xml,text/plain,application/xml;q=0.9,*/*;q=0.1",
};

function decodeBody(response: OutboundResponse): string {
  return new TextDecoder("utf-8", { fatal: false }).decode(response.body);
}

export interface RedirectHop {
  from: string;
  to: string;
  status: number;
}
export interface RedirectTraceResult {
  finalUrl: string;
  status: number;
  hops: RedirectHop[];
}

export async function traceRedirects(
  url: string,
  request: WebsiteRequester = requestOutbound,
): Promise<RedirectTraceResult> {
  const hops: RedirectHop[] = [];
  const response = await request(url, {
    method: "GET",
    headers: REQUEST_HEADERS,
    maxRedirects: 5,
    maxResponseBytes: 64_000,
    totalTimeoutMs: 15_000,
    onRedirect: (hop) => hops.push(hop),
  });
  return { finalUrl: response.url, status: response.status, hops };
}

export interface SecurityHeaderCheck {
  header: string;
  value: string | null;
  status: "pass" | "warning" | "missing";
  recommendation: string;
}
export interface SecurityHeaderResult {
  url: string;
  status: number;
  score: number;
  checks: SecurityHeaderCheck[];
}

const SECURITY_HEADERS: Array<{
  header: string;
  recommendation: string;
  evaluate?: (value: string) => "pass" | "warning";
}> = [
  {
    header: "content-security-policy",
    recommendation: "Define a restrictive Content-Security-Policy.",
  },
  {
    header: "strict-transport-security",
    recommendation: "Enable HSTS on HTTPS responses.",
    evaluate: (value) =>
      /max-age=(?:[3-9]\d{7}|[1-9]\d{8,})/i.test(value) ? "pass" : "warning",
  },
  {
    header: "x-content-type-options",
    recommendation: "Set X-Content-Type-Options to nosniff.",
    evaluate: (value) =>
      value.toLowerCase() === "nosniff" ? "pass" : "warning",
  },
  {
    header: "referrer-policy",
    recommendation: "Set an explicit privacy-preserving Referrer-Policy.",
  },
  {
    header: "permissions-policy",
    recommendation:
      "Restrict unneeded browser capabilities with Permissions-Policy.",
  },
  {
    header: "cross-origin-opener-policy",
    recommendation:
      "Consider same-origin isolation with Cross-Origin-Opener-Policy.",
  },
];

export async function analyzeSecurityHeaders(
  url: string,
  request: WebsiteRequester = requestOutbound,
): Promise<SecurityHeaderResult> {
  const response = await request(url, {
    method: "HEAD",
    headers: REQUEST_HEADERS,
    maxRedirects: 3,
    maxResponseBytes: 0,
    totalTimeoutMs: 12_000,
  });
  const checks = SECURITY_HEADERS.map(
    ({ header, recommendation, evaluate }) => {
      const value = response.headers[header] ?? null;
      return {
        header,
        value,
        status: value ? (evaluate?.(value) ?? "pass") : "missing",
        recommendation,
      } satisfies SecurityHeaderCheck;
    },
  );
  const points = checks.reduce(
    (sum, check) =>
      sum +
      (check.status === "pass" ? 1 : check.status === "warning" ? 0.5 : 0),
    0,
  );
  return {
    url: response.url,
    status: response.status,
    score: Math.round((points / checks.length) * 100),
    checks,
  };
}

export interface CorsAnalysisResult {
  url: string;
  status: number;
  allowOrigin: string | null;
  allowCredentials: boolean;
  allowMethods: string[];
  allowHeaders: string[];
  varyOrigin: boolean;
  issues: string[];
}

function splitHeader(value: string | undefined): string[] {
  return (
    value
      ?.split(",")
      .map((item) => item.trim())
      .filter(Boolean) ?? []
  );
}

export async function analyzeCors(
  url: string,
  request: WebsiteRequester = requestOutbound,
): Promise<CorsAnalysisResult> {
  const probeOrigin = "https://diagnostic.invalid";
  const response = await request(url, {
    method: "OPTIONS",
    headers: {
      ...REQUEST_HEADERS,
      origin: probeOrigin,
      "access-control-request-method": "GET",
    },
    maxRedirects: 2,
    maxResponseBytes: 16_000,
    totalTimeoutMs: 12_000,
  });
  const allowOrigin = response.headers["access-control-allow-origin"] ?? null;
  const allowCredentials =
    response.headers["access-control-allow-credentials"]?.toLowerCase() ===
    "true";
  const varyOrigin = splitHeader(response.headers.vary).some(
    (value) => value.toLowerCase() === "origin",
  );
  const issues: string[] = [];
  if (!allowOrigin)
    issues.push(
      "No Access-Control-Allow-Origin header was returned for the probe origin.",
    );
  if (allowOrigin === "*" && allowCredentials)
    issues.push(
      "Wildcard origin cannot be combined safely with credentialed CORS.",
    );
  if (allowOrigin === probeOrigin && !varyOrigin)
    issues.push(
      "A reflected origin should usually include Vary: Origin to protect caches.",
    );
  return {
    url: response.url,
    status: response.status,
    allowOrigin,
    allowCredentials,
    allowMethods: splitHeader(response.headers["access-control-allow-methods"]),
    allowHeaders: splitHeader(response.headers["access-control-allow-headers"]),
    varyOrigin,
    issues,
  };
}

export interface RobotsRule {
  userAgent: string;
  directive: "allow" | "disallow" | "sitemap" | "crawl-delay";
  value: string;
}
export interface RobotsInspectionResult {
  url: string;
  status: number;
  rules: RobotsRule[];
  sitemaps: string[];
  issues: string[];
}

export async function inspectRobots(
  url: string,
  request: WebsiteRequester = requestOutbound,
): Promise<RobotsInspectionResult> {
  const robotsUrl = new URL("/robots.txt", url).toString();
  const response = await request(robotsUrl, {
    method: "GET",
    headers: { ...REQUEST_HEADERS, accept: "text/plain" },
    maxRedirects: 2,
    maxResponseBytes: 256_000,
    totalTimeoutMs: 12_000,
  });
  const rules: RobotsRule[] = [];
  const issues: string[] = [];
  let userAgent = "*";
  decodeBody(response)
    .split(/\r?\n/)
    .forEach((source, index) => {
      const line = source.replace(/\s+#.*$/, "").trim();
      if (!line) return;
      const separator = line.indexOf(":");
      if (separator < 1) {
        issues.push(`Line ${index + 1} is not a valid robots directive.`);
        return;
      }
      const name = line.slice(0, separator).trim().toLowerCase();
      const value = line.slice(separator + 1).trim();
      if (name === "user-agent") {
        userAgent = value || "*";
        return;
      }
      if (["allow", "disallow", "sitemap", "crawl-delay"].includes(name))
        rules.push({
          userAgent,
          directive: name as RobotsRule["directive"],
          value,
        });
    });
  return {
    url: response.url,
    status: response.status,
    rules,
    sitemaps: rules
      .filter(({ directive }) => directive === "sitemap")
      .map(({ value }) => value),
    issues,
  };
}

export interface SitemapValidationResult {
  url: string;
  status: number;
  kind: "urlset" | "sitemapindex";
  locations: string[];
  issues: string[];
  truncated: boolean;
}

export async function validateSitemap(
  url: string,
  request: WebsiteRequester = requestOutbound,
): Promise<SitemapValidationResult> {
  const response = await request(url, {
    method: "GET",
    headers: { ...REQUEST_HEADERS, accept: "application/xml,text/xml" },
    maxRedirects: 2,
    maxResponseBytes: 1_000_000,
    totalTimeoutMs: 15_000,
  });
  const body = decodeBody(response);
  const validation = XMLValidator.validate(body);
  if (validation !== true) throw new Error("Sitemap XML is malformed.");
  const kind = /<sitemapindex(?:\s|>)/i.test(body)
    ? "sitemapindex"
    : /<urlset(?:\s|>)/i.test(body)
      ? "urlset"
      : null;
  if (!kind)
    throw new Error(
      "Document must contain a sitemap urlset or sitemapindex root.",
    );
  const allLocations = [
    ...body.matchAll(/<loc(?:\s[^>]*)?>([\s\S]*?)<\/loc>/gi),
  ].map((match) => match[1].trim());
  const issues = allLocations
    .filter((location) => {
      try {
        return !/^https?:$/.test(new URL(location).protocol);
      } catch {
        return true;
      }
    })
    .map((location) => `Invalid sitemap location: ${location.slice(0, 120)}`);
  return {
    url: response.url,
    status: response.status,
    kind,
    locations: allLocations.slice(0, 500),
    issues,
    truncated: allLocations.length > 500,
  };
}

export interface OpenGraphInspectionResult {
  url: string;
  status: number;
  title: string | null;
  description: string | null;
  image: string | null;
  type: string | null;
  siteName: string | null;
  canonical: string | null;
  issues: string[];
}

function extractAttribute(tag: string, name: string): string | null {
  const match = new RegExp(
    `\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`,
    "i",
  ).exec(tag);
  return match ? (match[1] ?? match[2] ?? match[3]) : null;
}

export async function inspectOpenGraph(
  url: string,
  request: WebsiteRequester = requestOutbound,
): Promise<OpenGraphInspectionResult> {
  const response = await request(url, {
    method: "GET",
    headers: REQUEST_HEADERS,
    maxRedirects: 3,
    maxResponseBytes: 512_000,
    totalTimeoutMs: 15_000,
  });
  const html = decodeBody(response);
  const metadata = new Map<string, string>();
  for (const match of html.matchAll(/<meta\b[^>]*>/gi)) {
    const key =
      extractAttribute(match[0], "property") ??
      extractAttribute(match[0], "name");
    const content = extractAttribute(match[0], "content");
    if (key && content && !metadata.has(key.toLowerCase()))
      metadata.set(key.toLowerCase(), content);
  }
  const canonicalTag =
    html.match(/<link\b[^>]*\brel\s*=\s*["']canonical["'][^>]*>/i)?.[0] ??
    html.match(
      /<link\b[^>]*\bhref\s*=[^>]*\brel\s*=\s*["']canonical["'][^>]*>/i,
    )?.[0];
  const result = {
    title: metadata.get("og:title") ?? null,
    description: metadata.get("og:description") ?? null,
    image: metadata.get("og:image") ?? null,
    type: metadata.get("og:type") ?? null,
    siteName: metadata.get("og:site_name") ?? null,
    canonical: canonicalTag ? extractAttribute(canonicalTag, "href") : null,
  };
  const issues = Object.entries(result)
    .filter(
      ([key, value]) =>
        ["title", "description", "image"].includes(key) && !value,
    )
    .map(([key]) => `Missing og:${key}.`);
  return { url: response.url, status: response.status, ...result, issues };
}

export type DnsLookup = (
  domain: string,
  recordType: SupportedDnsRecordType,
) => Promise<DnsLookupResult>;
export interface EmailDnsAnalysisResult {
  domain: string;
  mx: string[];
  spf: string[];
  dmarc: string[];
  issues: string[];
}

export async function analyzeEmailDns(
  domainInput: string,
  lookup: DnsLookup = performDnsLookup,
): Promise<EmailDnsAnalysisResult> {
  const domain = normalizeDnsDomain(domainInput);
  const [mxResult, txtResult, dmarcResult] = await Promise.all([
    lookup(domain, "MX"),
    lookup(domain, "TXT"),
    lookup(`_dmarc.${domain}`, "TXT"),
  ]);
  const mx = mxResult.success ? mxResult.records : [];
  const spf = txtResult.success
    ? txtResult.records.filter((record) => /^v=spf1(?:\s|$)/i.test(record))
    : [];
  const dmarc = dmarcResult.success
    ? dmarcResult.records.filter((record) =>
        /^v=dmarc1(?:;|\s|$)/i.test(record),
      )
    : [];
  const issues: string[] = [];
  if (!mx.length) issues.push("No MX records were found.");
  if (!spf.length) issues.push("No SPF record was found.");
  if (spf.length > 1)
    issues.push(
      "Multiple SPF records were found; SPF requires a single policy record.",
    );
  if (!dmarc.length)
    issues.push("No DMARC record was found at the _dmarc subdomain.");
  if (dmarc.some((record) => /\bp=none\b/i.test(record)))
    issues.push("DMARC policy is monitoring-only (p=none).");
  return { domain, mx, spf, dmarc, issues };
}

const DOH_RESOLVERS = [
  { name: "Cloudflare", url: "https://cloudflare-dns.com/dns-query" },
  { name: "Google", url: "https://dns.google/resolve" },
  { name: "Quad9", url: "https://dns.quad9.net:5053/dns-query" },
] as const;

export interface DnsPropagationResolverResult {
  resolver: string;
  records: string[];
  success: boolean;
  error?: string;
}
export interface DnsPropagationResult {
  domain: string;
  recordType: SupportedDnsRecordType;
  consistent: boolean;
  results: DnsPropagationResolverResult[];
}

export async function checkDnsPropagation(
  domainInput: string,
  recordTypeInput: string,
  request: WebsiteRequester = requestOutbound,
): Promise<DnsPropagationResult> {
  const domain = normalizeDnsDomain(domainInput);
  const [recordType] = normalizeDnsRecordTypes([recordTypeInput]);
  const results = await Promise.all(
    DOH_RESOLVERS.map(
      async (resolver): Promise<DnsPropagationResolverResult> => {
        try {
          const url = `${resolver.url}?name=${encodeURIComponent(domain)}&type=${encodeURIComponent(recordType)}`;
          const response = await request(url, {
            method: "GET",
            headers: { ...REQUEST_HEADERS, accept: "application/dns-json" },
            maxRedirects: 0,
            maxResponseBytes: 128_000,
            totalTimeoutMs: 8_000,
          });
          const body = JSON.parse(decodeBody(response)) as {
            Status?: unknown;
            Answer?: Array<{ data?: unknown }>;
          };
          if (body.Status !== 0)
            return {
              resolver: resolver.name,
              records: [],
              success: false,
              error: "Resolver returned no successful answer.",
            };
          const records = (body.Answer ?? [])
            .map(({ data }) => (typeof data === "string" ? data : ""))
            .filter(Boolean)
            .sort();
          return {
            resolver: resolver.name,
            records,
            success: records.length > 0,
          };
        } catch {
          return {
            resolver: resolver.name,
            records: [],
            success: false,
            error: "Resolver request failed.",
          };
        }
      },
    ),
  );
  const successfulSets = results
    .filter(({ success }) => success)
    .map(({ records }) => JSON.stringify(records));
  return {
    domain,
    recordType,
    consistent: successfulSets.length > 1 && new Set(successfulSets).size === 1,
    results,
  };
}
