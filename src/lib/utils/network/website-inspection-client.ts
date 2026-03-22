export const WEBSITE_DIAGNOSTIC_OPERATIONS = [
  "redirect-tracer",
  "security-header-analyzer",
  "cors-analyzer",
  "robots-inspector",
  "sitemap-validator",
  "open-graph-inspector",
  "email-dns-analyzer",
  "dns-propagation-checker",
] as const;

export type WebsiteDiagnosticOperation =
  (typeof WEBSITE_DIAGNOSTIC_OPERATIONS)[number];

export async function runWebsiteDiagnostic(
  operation: WebsiteDiagnosticOperation,
  input: string,
  recordType = "A",
): Promise<unknown> {
  const dnsOperation =
    operation === "email-dns-analyzer" ||
    operation === "dns-propagation-checker";
  const endpoint = dnsOperation
    ? "/api/network/dns-inspection"
    : "/api/network/website-inspection";
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(
      dnsOperation
        ? {
            operation,
            domain: input,
            ...(operation === "dns-propagation-checker" ? { recordType } : {}),
          }
        : { operation, url: input },
    ),
  });
  const body = (await response.json()) as { result?: unknown; error?: string };
  if (!response.ok) throw new Error(body.error || "Website diagnostic failed.");
  return body.result;
}
