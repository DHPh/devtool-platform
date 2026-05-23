/**
 * Password Breach Checker Utilities
 * Functions for checking if passwords have been found in data breaches
 */

export interface BreachCheckResult {
  isBreached: boolean | null;
  breachCount?: number;
  message: string;
  severity: "safe" | "warning" | "danger";
  checkedAt: Date;
}

export interface BreachCheckOptions {
  useHashing: boolean;
  timeout: number;
}

/**
 * Check if password has been found in known data breaches
 * Uses SHA-1 hashing and k-anonymity for privacy
 */
export async function checkPasswordBreach(
  password: string,
  options: BreachCheckOptions = { useHashing: true, timeout: 5000 }
): Promise<BreachCheckResult> {
  try {
    if (!password || password.length === 0) {
      return {
        isBreached: null,
        message: "Please enter a password to check",
        severity: "warning",
        checkedAt: new Date(),
      };
    }

    // Hash the password using SHA-1
    const hash = await hashPassword(password);
    const prefix = hash.substring(0, 5);
    const suffix = hash.substring(5);

    // Query HaveIBeenPwned API using k-anonymity
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options.timeout);

    try {
      const response = await fetch(
        `https://api.pwnedpasswords.com/range/${prefix}`,
        {
          signal: controller.signal,
          headers: {
            "User-Agent": "DevTool-Platform-Password-Checker",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.text();
      const lines = data.trim().split(/\r?\n/);
      if (!lines.every((line) => /^[\da-f]{35}:\d+$/i.test(line))) {
        throw new Error("Invalid breach service response");
      }

      // Look for our password hash in the results
      for (const line of lines) {
        const [hashSuffix, count] = line.split(":");
        if (hashSuffix.toLowerCase() === suffix.toLowerCase() && Number(count) > 0) {
          const breachCount = parseInt(count.trim(), 10);
          return {
            isBreached: true,
            breachCount,
            message: `This password has been found ${breachCount.toLocaleString()} time${
              breachCount > 1 ? "s" : ""
            } in data breaches`,
            severity: breachCount > 10 ? "danger" : "warning",
            checkedAt: new Date(),
          };
        }
      }

      return {
        isBreached: false,
        breachCount: 0,
        message: "This password has not been found in known data breaches",
        severity: "safe",
        checkedAt: new Date(),
      };
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    // Handle network errors, timeouts, etc.
    console.warn("Password breach check failed:", error);
    return {
      isBreached: null,
      message: "Unable to check breach status. Try again later.",
      severity: "warning",
      checkedAt: new Date(),
    };
  }
}

/**
 * Batch check multiple passwords for breaches
 */
export async function checkMultiplePasswordBreaches(
  passwords: string[],
  options?: BreachCheckOptions
): Promise<Array<{ password: string; result: BreachCheckResult }>> {
  const results: Array<{ password: string; result: BreachCheckResult }> = [];

  // Process passwords with a delay to avoid rate limiting
  for (let i = 0; i < passwords.length; i++) {
    const password = passwords[i];
    const result = await checkPasswordBreach(password, options);
    results.push({ password, result });

    // Add delay between requests to be respectful to the API
    if (i < passwords.length - 1) {
      await delay(100);
    }
  }

  return results;
}

/**
 * Check if a password appears to be commonly used
 */
export function isCommonPassword(password: string): boolean {
  const commonPasswords = [
    "123456",
    "password",
    "123456789",
    "12345678",
    "12345",
    "111111",
    "1234567",
    "sunshine",
    "qwerty",
    "iloveyou",
    "princess",
    "admin",
    "welcome",
    "666666",
    "abc123",
    "football",
    "123123",
    "monkey",
    "654321",
    "!@#$%^&*",
    "charlie",
    "aa123456",
    "donald",
    "password1",
    "qwerty123",
  ];

  return commonPasswords.includes(password.toLowerCase());
}

/**
 * Generate security recommendations based on breach check
 */
export function generateSecurityRecommendations(
  password: string,
  breachResult: BreachCheckResult
): string[] {
  const recommendations: string[] = [];

  if (breachResult.isBreached === null) {
    recommendations.push("Retry the breach check to confirm the result.");
  }

  if (breachResult.isBreached) {
    recommendations.push("Change this password immediately");
    recommendations.push("Use a unique password for each account");
    recommendations.push("Consider using a password manager");
  }

  if (isCommonPassword(password)) {
    recommendations.push(
      'Avoid common passwords like "password" or "123456"'
    );
  }

  if (password.length < 12) {
    recommendations.push("Use at least 12 characters for better security");
  }

  if (!/[A-Z]/.test(password)) {
    recommendations.push("Include uppercase letters");
  }

  if (!/[a-z]/.test(password)) {
    recommendations.push("Include lowercase letters");
  }

  if (!/[0-9]/.test(password)) {
    recommendations.push("Include numbers");
  }

  if (!/[^a-zA-Z0-9]/.test(password)) {
    recommendations.push("Include special characters");
  }

  if (recommendations.length === 0) {
    recommendations.push("This appears to be a good password");
    recommendations.push("Consider enabling two-factor authentication");
  }

  return recommendations;
}

/**
 * Hash password using SHA-1 (for HaveIBeenPwned API compatibility)
 */
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-1", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hashHex.toUpperCase();
}

/**
 * Utility function to add delay
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Get default breach check options
 */
export function getDefaultBreachCheckOptions(): BreachCheckOptions {
  return {
    useHashing: true,
    timeout: 5000,
  };
}
