export interface EmailSyntaxResult {
  email: string;
  normalizedEmail?: string;
  isValid: boolean;
  errors: string[];
  warnings: string[];
  scope: "syntax-only";
  deliverability: "not-checked";
}

const DOT_ATOM_LOCAL = /^[A-Za-z0-9!#$%&'*+/=?^_`{|}~.-]+$/;
// A DNS/IDN domain is not a URL. Reject URL delimiters and percent escapes before
// passing the value to WHATWG URL, which would otherwise decode some escapes.
const FORBIDDEN_DOMAIN_CHARACTERS = /[\s%/@:?#\[\]\\]/;

function normalizeIdnDomain(domain: string): string | null {
  if (!domain || FORBIDDEN_DOMAIN_CHARACTERS.test(domain)) return null;
  try {
    const hostname = new URL(`http://${domain.normalize("NFC")}`).hostname.toLowerCase();
    return hostname && !hostname.endsWith(".") ? hostname : null;
  } catch {
    return null;
  }
}

/**
 * Validate common RFC 5322 dot-atom mailbox syntax.
 * This deliberately does not perform DNS, SMTP, mailbox, or deliverability checks.
 */
export function validateEmailSyntax(input: string): EmailSyntaxResult {
  const email = input.trim();
  const errors: string[] = [];
  const warnings: string[] = [];
  const at = email.lastIndexOf("@");

  if (!email) errors.push("Email address is required");
  if (at <= 0 || at !== email.indexOf("@") || at === email.length - 1) {
    errors.push("Email must contain one @ separating a local part and domain");
  }

  const localPart = at > 0 ? email.slice(0, at) : "";
  const domainInput = at >= 0 ? email.slice(at + 1) : "";
  if (localPart.length > 64) errors.push("Local part cannot exceed 64 characters");
  if (
    localPart &&
    (!DOT_ATOM_LOCAL.test(localPart) || localPart.startsWith(".") || localPart.endsWith(".") || localPart.includes(".."))
  ) {
    errors.push("Local part must use supported dot-atom syntax without leading, trailing, or repeated dots");
  }

  const asciiDomain = normalizeIdnDomain(domainInput);
  if (domainInput && !asciiDomain) {
    errors.push("Domain is not a valid DNS or internationalized domain name");
  }
  if (asciiDomain) {
    const labels = asciiDomain.split(".");
    if (
      asciiDomain.length > 253 ||
      labels.some((label) =>
        !label || label.length > 63 || label.startsWith("-") || label.endsWith("-") || !/^[a-z0-9-]+$/.test(label),
      )
    ) {
      errors.push("Domain labels must be 1–63 letters, digits, or hyphens and cannot start or end with a hyphen");
    }
    if (labels.length === 1) {
      warnings.push("Single-label domains can be valid on private networks but are not public Internet mail domains");
    }
  }

  const normalizedEmail = asciiDomain && localPart ? `${localPart}@${asciiDomain}` : undefined;
  if ((normalizedEmail ?? email).length > 254) {
    errors.push("Email address cannot exceed 254 characters");
  }
  if (asciiDomain && asciiDomain !== domainInput.toLowerCase()) {
    warnings.push(`Internationalized domain normalized to ${asciiDomain}`);
  }
  warnings.push("Syntax only: DNS, SMTP server, mailbox existence, and deliverability are not checked");

  return {
    email,
    normalizedEmail,
    isValid: errors.length === 0,
    errors,
    warnings,
    scope: "syntax-only",
    deliverability: "not-checked",
  };
}
