export interface UrlTestOutcomeInput {
  accessible: boolean;
  statusCode?: number;
  error?: string;
}

export type UrlTestOutcome = "success" | "http-error" | "failure";

export function classifyUrlTestOutcome(
  result: UrlTestOutcomeInput,
): UrlTestOutcome {
  if (!result.accessible || result.error) return "failure";
  if (result.statusCode !== undefined && result.statusCode >= 400) {
    return "http-error";
  }
  return "success";
}
