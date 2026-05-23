import { toBaseN } from "./base-n.js";

export type SupportedLanguage =
  | "english"
  | "korean"
  | "chinese"
  | "japanese"
  | "spanish"
  | "french"
  | "german"
  | "portuguese"
  | "indonesian"
  | "thai"
  | "vietnamese"
  | "hindi"
  | "arabic";

export const wordSetBaseCount: Record<SupportedLanguage, number> = {
  english: 6000,
  korean: 5630,
  chinese: 5140,
  japanese: 5000,
  spanish: 5000,
  french: 5000,
  german: 5000,
  portuguese: 5000,
  indonesian: 5000,
  thai: 5000,
  vietnamese: 5000,
  hindi: 5000,
  arabic: 5000,
};

const loadWordSet = async (language: SupportedLanguage) => {
  if (language.toLowerCase() === "english") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/english.json"))
      .default as string[];
  } else if (language.toLowerCase() === "korean") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/korean.json"))
      .default as string[];
  } else if (language.toLowerCase() === "chinese") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/chinese.json"))
      .default as string[];
  } else if (language.toLowerCase() === "japanese") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/japanese.json"))
      .default as string[];
  } else if (language.toLowerCase() === "spanish") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/spanish.json"))
      .default as string[];
  } else if (language.toLowerCase() === "french") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/french.json"))
      .default as string[];
  } else if (language.toLowerCase() === "german") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/german.json"))
      .default as string[];
  } else if (language.toLowerCase() === "portuguese") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/portuguese.json"))
      .default as string[];
  } else if (language.toLowerCase() === "indonesian") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/indonesian.json"))
      .default as string[];
  } else if (language.toLowerCase() === "thai") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/thai.json"))
      .default as string[];
  } else if (language.toLowerCase() === "vietnamese") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/vietnamese.json"))
      .default as string[];
  } else if (language.toLowerCase() === "hindi") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/hindi.json"))
      .default as string[];
  } else if (language.toLowerCase() === "arabic") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/arabic.json"))
      .default as string[];
  }

  throw new Error(`Invalid language: ${language}`);
};

export const encodeByWordSet = async ({
  n,
  language = "english",
}: {
  n: number;
  language?: SupportedLanguage;
}) => {
  const baseSet = toBaseN(n, wordSetBaseCount[language]);
  const wordSet = await loadWordSet(language);

  const encodedBaseSet = baseSet.map((digit) => wordSet[digit]);
  return encodedBaseSet.join("-");
};

/**
 * Decodes a word set encoded string back to a number.
 * This is the inverse of encodeByWordSet.
 */
export const decodeByWordSet = async ({
  encoded,
  language = "english",
}: {
  encoded: string;
  language?: SupportedLanguage;
}): Promise<number> => {
  if (!encoded) {
    throw new Error("Encoded string is required");
  }

  // Split the encoded string by hyphens to get individual words
  const words = encoded.split("-");

  // Load the appropriate word set based on language
  const wordSet = await loadWordSet(language);

  // Convert words back to their indices in the word set
  const indices = words.map((word) => {
    const index = wordSet.indexOf(word);
    if (index === -1) {
      throw new Error(`Word '${word}' not found in the ${language} word set`);
    }
    return index;
  });

  // Convert from base-N back to a single number
  // This is the inverse of toBaseN used in encodeByWordSet
  const base = wordSetBaseCount[language];
  let result = 0;
  for (let i = 0; i < indices.length; i++) {
    result = result * base + indices[i]!;
  }

  return result;
};
