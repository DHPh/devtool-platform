/**
 * Password Generator Utilities
 * Core functions for password generation, analysis, and security
 */

export interface PasswordOptions {
  length: number;
  includeUppercase: boolean;
  includeLowercase: boolean;
  includeNumbers: boolean;
  includeSymbols: boolean;
  excludeSimilar: boolean;
  excludeAmbiguous: boolean;
  customSymbols?: string;
  excludeCharacters?: string;
}

export interface PasswordStrength {
  score: number; // 0-100
  level: "Very Weak" | "Weak" | "Fair" | "Good" | "Strong" | "Very Strong";
  entropy: number;
  estimatedCrackTime: string;
  feedback: string[];
  characteristics: {
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumbers: boolean;
    hasSymbols: boolean;
    hasRepeats: boolean;
    hasSequential: boolean;
    hasCommonPatterns: boolean;
  };
}

export interface PasswordGenerationResult {
  password: string;
  strength: PasswordStrength;
  generatedAt: Date;
  options: PasswordOptions;
}

const UPPERCASE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWERCASE_CHARS = "abcdefghijklmnopqrstuvwxyz";
const NUMBER_CHARS = "0123456789";
const SYMBOL_CHARS = "!@#$%^&*()_+-=[]{}|;:,.<>?";
const SIMILAR_CHARS = "il1Lo0O";
const AMBIGUOUS_CHARS = "{}[]()/\\'\"`~,;.<>";

/**
 * Generate a secure password based on options
 */
export function generatePassword(options: PasswordOptions): string {
  let charset = "";

  if (options.includeUppercase) {
    charset += UPPERCASE_CHARS;
  }
  if (options.includeLowercase) {
    charset += LOWERCASE_CHARS;
  }
  if (options.includeNumbers) {
    charset += NUMBER_CHARS;
  }
  if (options.includeSymbols) {
    charset += options.customSymbols || SYMBOL_CHARS;
  }

  // Remove similar characters if requested
  if (options.excludeSimilar) {
    charset = charset
      .split("")
      .filter((char) => !SIMILAR_CHARS.includes(char))
      .join("");
  }

  // Remove ambiguous characters if requested
  if (options.excludeAmbiguous) {
    charset = charset
      .split("")
      .filter((char) => !AMBIGUOUS_CHARS.includes(char))
      .join("");
  }

  // Remove custom excluded characters
  if (options.excludeCharacters) {
    charset = charset
      .split("")
      .filter((char) => !options.excludeCharacters!.includes(char))
      .join("");
  }

  if (charset.length === 0) {
    throw new Error("No characters available for password generation");
  }

  // Generate password ensuring at least one character from each selected category
  let password = "";
  const requiredChars: string[] = [];

  if (options.includeUppercase) {
    const filtered = UPPERCASE_CHARS.split("").filter((char) =>
      charset.includes(char)
    );
    if (filtered.length > 0) {
      requiredChars.push(filtered[Math.floor(Math.random() * filtered.length)]);
    }
  }
  if (options.includeLowercase) {
    const filtered = LOWERCASE_CHARS.split("").filter((char) =>
      charset.includes(char)
    );
    if (filtered.length > 0) {
      requiredChars.push(filtered[Math.floor(Math.random() * filtered.length)]);
    }
  }
  if (options.includeNumbers) {
    const filtered = NUMBER_CHARS.split("").filter((char) =>
      charset.includes(char)
    );
    if (filtered.length > 0) {
      requiredChars.push(filtered[Math.floor(Math.random() * filtered.length)]);
    }
  }
  if (options.includeSymbols) {
    const symbols = options.customSymbols || SYMBOL_CHARS;
    const filtered = symbols.split("").filter((char) => charset.includes(char));
    if (filtered.length > 0) {
      requiredChars.push(filtered[Math.floor(Math.random() * filtered.length)]);
    }
  }

  // Add required characters first
  requiredChars.forEach((char) => {
    password += char;
  });

  // Fill the rest randomly
  for (let i = password.length; i < options.length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }

  // Shuffle the password to avoid predictable patterns
  return shuffleString(password);
}

/**
 * Analyze password strength and provide feedback
 */
export function analyzePasswordStrength(password: string): PasswordStrength {
  const characteristics = {
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumbers: /[0-9]/.test(password),
    hasSymbols: /[^a-zA-Z0-9]/.test(password),
    hasRepeats: hasRepeatingCharacters(password),
    hasSequential: hasSequentialCharacters(password),
    hasCommonPatterns: hasCommonPatterns(password),
  };

  // Calculate entropy
  let charset = 0;
  if (characteristics.hasLowercase) charset += 26;
  if (characteristics.hasUppercase) charset += 26;
  if (characteristics.hasNumbers) charset += 10;
  if (characteristics.hasSymbols) charset += 32;

  const entropy = Math.log2(charset) * password.length;

  // Calculate base score
  let score = 0;

  // Length scoring
  if (password.length >= 8) score += 25;
  if (password.length >= 12) score += 15;
  if (password.length >= 16) score += 10;

  // Character variety scoring
  if (characteristics.hasLowercase) score += 5;
  if (characteristics.hasUppercase) score += 5;
  if (characteristics.hasNumbers) score += 5;
  if (characteristics.hasSymbols) score += 10;

  // Deductions
  if (characteristics.hasRepeats) score -= 10;
  if (characteristics.hasSequential) score -= 15;
  if (characteristics.hasCommonPatterns) score -= 20;
  if (password.length < 8) score -= 25;

  score = Math.max(0, Math.min(100, score));

  // Determine level
  let level: PasswordStrength["level"];
  if (score >= 90) level = "Very Strong";
  else if (score >= 75) level = "Strong";
  else if (score >= 60) level = "Good";
  else if (score >= 40) level = "Fair";
  else if (score >= 20) level = "Weak";
  else level = "Very Weak";

  // Generate feedback
  const feedback: string[] = [];

  if (password.length < 8) {
    feedback.push("Use at least 8 characters");
  }
  if (password.length < 12) {
    feedback.push("Consider using 12+ characters for better security");
  }
  if (!characteristics.hasUppercase) {
    feedback.push("Add uppercase letters");
  }
  if (!characteristics.hasLowercase) {
    feedback.push("Add lowercase letters");
  }
  if (!characteristics.hasNumbers) {
    feedback.push("Add numbers");
  }
  if (!characteristics.hasSymbols) {
    feedback.push("Add symbols for extra security");
  }
  if (characteristics.hasRepeats) {
    feedback.push("Avoid repeating characters");
  }
  if (characteristics.hasSequential) {
    feedback.push("Avoid sequential characters (abc, 123)");
  }
  if (characteristics.hasCommonPatterns) {
    feedback.push("Avoid common patterns and dictionary words");
  }

  if (feedback.length === 0) {
    feedback.push("Excellent password strength!");
  }

  const estimatedCrackTime = calculateCrackTime(entropy);

  return {
    score,
    level,
    entropy,
    estimatedCrackTime,
    feedback,
    characteristics,
  };
}

/**
 * Generate multiple passwords with options
 */
export function generateMultiplePasswords(
  options: PasswordOptions,
  count: number = 10
): PasswordGenerationResult[] {
  const results: PasswordGenerationResult[] = [];

  for (let i = 0; i < count; i++) {
    const password = generatePassword(options);
    const strength = analyzePasswordStrength(password);

    results.push({
      password,
      strength,
      generatedAt: new Date(),
      options: { ...options },
    });
  }

  return results;
}

/**
 * Check if password contains repeating characters
 */
function hasRepeatingCharacters(password: string): boolean {
  for (let i = 0; i < password.length - 2; i++) {
    if (password[i] === password[i + 1] && password[i] === password[i + 2]) {
      return true;
    }
  }
  return false;
}

/**
 * Check if password contains sequential characters
 */
function hasSequentialCharacters(password: string): boolean {
  const sequences = ["abc", "123", "qwe", "asd", "zxc"];
  const lowerPassword = password.toLowerCase();

  for (const seq of sequences) {
    if (
      lowerPassword.includes(seq) ||
      lowerPassword.includes(seq.split("").reverse().join(""))
    ) {
      return true;
    }
  }

  // Check for ascending/descending sequences
  for (let i = 0; i < password.length - 2; i++) {
    const a = password.charCodeAt(i);
    const b = password.charCodeAt(i + 1);
    const c = password.charCodeAt(i + 2);

    if ((b === a + 1 && c === b + 1) || (b === a - 1 && c === b - 1)) {
      return true;
    }
  }

  return false;
}

/**
 * Check if password contains common patterns
 */
function hasCommonPatterns(password: string): boolean {
  const commonPatterns = [
    "password",
    "123456",
    "qwerty",
    "admin",
    "letmein",
    "welcome",
    "monkey",
    "dragon",
    "master",
    "shadow",
  ];

  const lowerPassword = password.toLowerCase();

  return commonPatterns.some((pattern) => lowerPassword.includes(pattern));
}

/**
 * Shuffle string characters randomly
 */
function shuffleString(str: string): string {
  const arr = str.split("");
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.join("");
}

/**
 * Calculate estimated crack time based on entropy
 */
function calculateCrackTime(entropy: number): string {
  const guessesPerSecond = 1e9; // 1 billion guesses per second
  const totalCombinations = Math.pow(2, entropy);
  const secondsToCrack = totalCombinations / (2 * guessesPerSecond);

  if (secondsToCrack < 60) {
    return "Instant";
  } else if (secondsToCrack < 3600) {
    return `${Math.round(secondsToCrack / 60)} minutes`;
  } else if (secondsToCrack < 86400) {
    return `${Math.round(secondsToCrack / 3600)} hours`;
  } else if (secondsToCrack < 31536000) {
    return `${Math.round(secondsToCrack / 86400)} days`;
  } else if (secondsToCrack < 31536000000) {
    return `${Math.round(secondsToCrack / 31536000)} years`;
  } else {
    return "Centuries";
  }
}

/**
 * Get default password options
 */
export function getDefaultPasswordOptions(): PasswordOptions {
  return {
    length: 12,
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSymbols: true,
    excludeSimilar: false,
    excludeAmbiguous: false,
  };
}
