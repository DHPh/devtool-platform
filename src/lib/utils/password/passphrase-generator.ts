/**
 * Passphrase Generator Utilities
 * Functions for generating secure passphrases using word lists
 */

export interface PassphraseOptions {
  wordCount: number;
  separator: string;
  includeNumbers: boolean;
  includeSymbols: boolean;
  capitalizeWords: boolean;
  minWordLength: number;
  maxWordLength: number;
  customWordList?: string[];
}

export interface PassphraseResult {
  passphrase: string;
  words: string[];
  entropy: number;
  estimatedCrackTime: string;
  strength: "Weak" | "Fair" | "Good" | "Strong" | "Very Strong";
}

// Common word list for passphrase generation
const COMMON_WORDS = [
  "apple",
  "beach",
  "chair",
  "dance",
  "eagle",
  "forest",
  "guitar",
  "house",
  "island",
  "jungle",
  "kitten",
  "lemon",
  "mountain",
  "nature",
  "ocean",
  "planet",
  "queen",
  "river",
  "sunset",
  "tiger",
  "umbrella",
  "valley",
  "winter",
  "yellow",
  "bridge",
  "coffee",
  "garden",
  "happy",
  "light",
  "music",
  "peace",
  "smile",
  "storm",
  "travel",
  "water",
  "cloud",
  "dream",
  "flame",
  "magic",
  "shadow",
  "thunder",
  "wisdom",
  "crystal",
  "journey",
  "silver",
  "golden",
  "rainbow",
  "freedom",
  "castle",
  "dragon",
  "knight",
  "princess",
  "wizard",
  "treasure",
  "adventure",
  "mystery",
  "phoenix",
  "unicorn",
  "butterfly",
  "dolphin",
  "elephant",
  "giraffe",
  "leopard",
  "penguin",
  "rabbit",
  "squirrel",
  "turtle",
  "whale",
  "zebra",
  "anchor",
  "balloon",
  "candle",
  "diamond",
  "emerald",
  "feather",
  "glacier",
  "harvest",
  "lantern",
  "mirror",
  "nectar",
  "oasis",
  "prism",
  "quartz",
  "ribbon",
  "sapphire",
  "topaz",
  "velvet",
  "whisper",
];

const SYMBOLS = ["!", "@", "#", "$", "%", "^", "&", "*"];
const SEPARATORS = ["-", "_", ".", " ", "/", "|", "+", "="];

/**
 * Generate a secure passphrase
 */
export function generatePassphrase(
  options: PassphraseOptions
): PassphraseResult {
  const wordList = options.customWordList || COMMON_WORDS;

  // Filter words by length if specified
  const filteredWords = wordList.filter(
    (word) =>
      word.length >= options.minWordLength &&
      word.length <= options.maxWordLength
  );

  if (filteredWords.length < options.wordCount) {
    throw new Error(
      "Not enough words available with the specified length constraints"
    );
  }

  // Select random words
  const selectedWords: string[] = [];
  const usedIndices = new Set<number>();

  while (selectedWords.length < options.wordCount) {
    const index = Math.floor(Math.random() * filteredWords.length);
    if (!usedIndices.has(index)) {
      usedIndices.add(index);
      let word = filteredWords[index];

      if (options.capitalizeWords) {
        word = word.charAt(0).toUpperCase() + word.slice(1);
      }

      selectedWords.push(word);
    }
  }

  // Add numbers and symbols if requested
  const enhancedWords = selectedWords.map((word) => {
    let enhancedWord = word;

    if (options.includeNumbers) {
      enhancedWord += Math.floor(Math.random() * 100);
    }

    if (options.includeSymbols) {
      enhancedWord += SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
    }

    return enhancedWord;
  });

  const passphrase = enhancedWords.join(options.separator);

  // Calculate entropy and strength
  const entropy = calculatePassphraseEntropy(options, filteredWords.length);
  const estimatedCrackTime = calculateCrackTime(entropy);
  const strength = determinePassphraseStrength(entropy);

  return {
    passphrase,
    words: selectedWords,
    entropy,
    estimatedCrackTime,
    strength,
  };
}

/**
 * Generate multiple passphrases
 */
export function generateMultiplePassphrases(
  options: PassphraseOptions,
  count: number = 10
): PassphraseResult[] {
  const results: PassphraseResult[] = [];

  for (let i = 0; i < count; i++) {
    results.push(generatePassphrase(options));
  }

  return results;
}

/**
 * Calculate passphrase entropy
 */
function calculatePassphraseEntropy(
  options: PassphraseOptions,
  wordPoolSize: number
): number {
  let entropy = Math.log2(wordPoolSize) * options.wordCount;

  if (options.includeNumbers) {
    entropy += Math.log2(100) * options.wordCount; // 0-99
  }

  if (options.includeSymbols) {
    entropy += Math.log2(SYMBOLS.length) * options.wordCount;
  }

  return entropy;
}

/**
 * Determine passphrase strength based on entropy
 */
function determinePassphraseStrength(
  entropy: number
): "Weak" | "Fair" | "Good" | "Strong" | "Very Strong" {
  if (entropy >= 80) return "Very Strong";
  if (entropy >= 60) return "Strong";
  if (entropy >= 40) return "Good";
  if (entropy >= 25) return "Fair";
  return "Weak";
}

/**
 * Calculate estimated crack time
 */
function calculateCrackTime(entropy: number): string {
  const guessesPerSecond = 1e6; // 1 million guesses per second (more realistic for passphrases)
  const totalCombinations = Math.pow(2, entropy);
  const secondsToCrack = totalCombinations / (2 * guessesPerSecond);

  if (secondsToCrack < 60) {
    return "Less than a minute";
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
 * Get default passphrase options
 */
export function getDefaultPassphraseOptions(): PassphraseOptions {
  return {
    wordCount: 4,
    separator: "-",
    includeNumbers: false,
    includeSymbols: false,
    capitalizeWords: false,
    minWordLength: 4,
    maxWordLength: 8,
  };
}

/**
 * Get available separators
 */
export function getAvailableSeparators(): string[] {
  return SEPARATORS;
}

/**
 * Validate passphrase options
 */
export function validatePassphraseOptions(
  options: PassphraseOptions
): string[] {
  const errors: string[] = [];

  if (options.wordCount < 2) {
    errors.push("Word count must be at least 2");
  }

  if (options.wordCount > 10) {
    errors.push("Word count should not exceed 10 for practical use");
  }

  if (options.minWordLength < 3) {
    errors.push("Minimum word length should be at least 3");
  }

  if (options.maxWordLength < options.minWordLength) {
    errors.push("Maximum word length must be greater than minimum word length");
  }

  if (!options.separator) {
    errors.push("Separator cannot be empty");
  }

  return errors;
}
