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
  | "arabic"
  | "russian"
  | "swahili"
  | "filipino"
  | "hausa"
  | "bengali"
  | "urdu"
  | "amharic"
  | "burmese"
  | "khmer"
  | "nepali"
  | "somali"
  | "pashto"
  | "lingala";

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
  russian: 5000,
  swahili: 5000,
  filipino: 5000,
  hausa: 5000,
  bengali: 5000,
  urdu: 5000,
  amharic: 5000,
  burmese: 5000,
  khmer: 5000,
  nepali: 5000,
  somali: 5000,
  pashto: 5000,
  lingala: 5000,
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
  } else if (language.toLowerCase() === "russian") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/russian.json"))
      .default as string[];
  } else if (language.toLowerCase() === "swahili") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/swahili.json"))
      .default as string[];
  } else if (language.toLowerCase() === "filipino") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/filipino.json"))
      .default as string[];
  } else if (language.toLowerCase() === "hausa") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/hausa.json"))
      .default as string[];
  } else if (language.toLowerCase() === "bengali") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/bengali.json"))
      .default as string[];
  } else if (language.toLowerCase() === "urdu") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/urdu.json"))
      .default as string[];
  } else if (language.toLowerCase() === "amharic") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/amharic.json"))
      .default as string[];
  } else if (language.toLowerCase() === "burmese") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/burmese.json"))
      .default as string[];
  } else if (language.toLowerCase() === "khmer") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/khmer.json"))
      .default as string[];
  } else if (language.toLowerCase() === "nepali") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/nepali.json"))
      .default as string[];
  } else if (language.toLowerCase() === "somali") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/somali.json"))
      .default as string[];
  } else if (language.toLowerCase() === "pashto") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/pashto.json"))
      .default as string[];
  } else if (language.toLowerCase() === "lingala") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/lingala.json"))
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
