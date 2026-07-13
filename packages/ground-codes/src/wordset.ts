import { toBaseN } from "./base-n.js";

import {
  type SupportedLanguage,
  wordSetBaseCount,
} from "./wordset-language.js";

export {
  type SupportedLanguage,
  wordSetBaseCount,
} from "./wordset-language.js";

import { loadPrimaryWordSet } from "./wordset-loader-primary.js";
import { loadSecondaryWordSet } from "./wordset-loader-secondary.js";

const loadWordSet = async (language: SupportedLanguage) => {
  const wordSet =
    (await loadPrimaryWordSet(language)) ??
    (await loadSecondaryWordSet(language));
  if (wordSet) return wordSet;

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
