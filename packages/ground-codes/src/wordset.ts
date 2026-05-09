import { toBaseN } from "./base-n.js";

export type SupportedLanguage = "english" | "korean" | "chinese";

export const wordSetBaseCount: Record<SupportedLanguage, number> = {
  english: 6000,
  korean: 5630,
  chinese: 5140,
};

export const encodeByWordSet = async ({
  n,
  language = "english",
}: {
  n: number;
  language?: SupportedLanguage;
}) => {
  let wordSet: string[] | null = null;
  const baseSet = toBaseN(n, wordSetBaseCount[language]);
  if (language.toLowerCase() === "english") {
    // @ts-ignore
    wordSet = (await import("@repo/codebook/codebook-dist/english.json"))
      .default as string[];
  } else if (language.toLowerCase() === "korean") {
    // @ts-ignore
    wordSet = (await import("@repo/codebook/codebook-dist/korean.json"))
      .default as string[];
  } else if (language.toLowerCase() === "chinese") {
    // @ts-ignore
    wordSet = (await import("@repo/codebook/codebook-dist/chinese.json"))
      .default as string[];
  } else {
    throw new Error(`Invalid language: ${language}`);
  }

  const encodedBaseSet = baseSet.map((digit) => wordSet![digit]);
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
  let wordSet: string[] = [];
  if (language.toLowerCase() === "english") {
    // @ts-ignore
    wordSet = (await import("@repo/codebook/codebook-dist/english.json"))
      .default as string[];
  } else if (language.toLowerCase() === "korean") {
    // @ts-ignore
    wordSet = (await import("@repo/codebook/codebook-dist/korean.json"))
      .default as string[];
  } else if (language.toLowerCase() === "chinese") {
    // @ts-ignore
    wordSet = (await import("@repo/codebook/codebook-dist/chinese.json"))
      .default as string[];
  } else {
    throw new Error(`Invalid language: ${language}`);
  }

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
