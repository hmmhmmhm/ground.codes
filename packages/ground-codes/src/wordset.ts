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
  | "turkish"
  | "italian"
  | "dutch"
  | "polish"
  | "ukrainian"
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
  | "lingala"
  | "mongolian"
  | "lao"
  | "malagasy"
  | "dari"
  | "oromo"
  | "chichewa"
  | "tigrinya"
  | "bambara"
  | "fula"
  | "wolof"
  | "sinhala"
  | "tamil"
  | "kinyarwanda"
  | "kirundi"
  | "krio"
  | "ewe"
  | "fon"
  | "sango"
  | "moore"
  | "kanuri"
  | "quechua"
  | "aymara"
  | "guarani"
  | "kongo"
  | "zarma"
  | "tamasheq"
  | "songhay"
  | "twi"
  | "dagbani"
  | "luganda"
  | "acholi"
  | "dinka"
  | "nuer"
  | "shona"
  | "ndebele"
  | "tok_pisin";

export const wordSetBaseCount: Record<SupportedLanguage, number> = {
  english: 6000,
  korean: 5630,
  chinese: 5140,
  japanese: 5000,
  spanish: 5000,
  french: 5000,
  german: 5000,
  portuguese: 5000,
  turkish: 5000,
  italian: 5000,
  dutch: 5000,
  polish: 5000,
  ukrainian: 5000,
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
  mongolian: 5000,
  lao: 5000,
  malagasy: 5000,
  dari: 5000,
  oromo: 5000,
  chichewa: 5000,
  tigrinya: 5000,
  bambara: 5000,
  fula: 5000,
  wolof: 5000,
  sinhala: 5000,
  tamil: 5000,
  kinyarwanda: 5000,
  kirundi: 5000,
  krio: 5000,
  ewe: 5000,
  fon: 5000,
  sango: 5000,
  moore: 5000,
  kanuri: 5000,
  quechua: 5000,
  aymara: 5000,
  guarani: 5000,
  kongo: 5000,
  zarma: 5000,
  tamasheq: 5000,
  songhay: 5000,
  twi: 5000,
  dagbani: 5000,
  luganda: 5000,
  acholi: 5000,
  dinka: 5000,
  nuer: 5000,
  shona: 5000,
  ndebele: 5000,
  tok_pisin: 5000,
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
  } else if (language.toLowerCase() === "turkish") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/turkish.json"))
      .default as string[];
  } else if (language.toLowerCase() === "italian") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/italian.json"))
      .default as string[];
  } else if (language.toLowerCase() === "dutch") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/dutch.json"))
      .default as string[];
  } else if (language.toLowerCase() === "polish") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/polish.json"))
      .default as string[];
  } else if (language.toLowerCase() === "ukrainian") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/ukrainian.json"))
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
  } else if (language.toLowerCase() === "mongolian") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/mongolian.json"))
      .default as string[];
  } else if (language.toLowerCase() === "lao") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/lao.json"))
      .default as string[];
  } else if (language.toLowerCase() === "malagasy") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/malagasy.json"))
      .default as string[];
  } else if (language.toLowerCase() === "dari") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/dari.json"))
      .default as string[];
  } else if (language.toLowerCase() === "oromo") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/oromo.json"))
      .default as string[];
  } else if (language.toLowerCase() === "chichewa") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/chichewa.json"))
      .default as string[];
  } else if (language.toLowerCase() === "tigrinya") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/tigrinya.json"))
      .default as string[];
  } else if (language.toLowerCase() === "bambara") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/bambara.json"))
      .default as string[];
  } else if (language.toLowerCase() === "fula") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/fula.json"))
      .default as string[];
  } else if (language.toLowerCase() === "wolof") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/wolof.json"))
      .default as string[];
  } else if (language.toLowerCase() === "sinhala") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/sinhala.json"))
      .default as string[];
  } else if (language.toLowerCase() === "tamil") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/tamil.json"))
      .default as string[];
  } else if (language.toLowerCase() === "kinyarwanda") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/kinyarwanda.json"))
      .default as string[];
  } else if (language.toLowerCase() === "kirundi") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/kirundi.json"))
      .default as string[];
  } else if (language.toLowerCase() === "krio") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/krio.json"))
      .default as string[];
  } else if (language.toLowerCase() === "ewe") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/ewe.json"))
      .default as string[];
  } else if (language.toLowerCase() === "fon") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/fon.json"))
      .default as string[];
  } else if (language.toLowerCase() === "sango") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/sango.json"))
      .default as string[];
  } else if (language.toLowerCase() === "moore") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/moore.json"))
      .default as string[];
  } else if (language.toLowerCase() === "kanuri") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/kanuri.json"))
      .default as string[];
  } else if (language.toLowerCase() === "quechua") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/quechua.json"))
      .default as string[];
  } else if (language.toLowerCase() === "aymara") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/aymara.json"))
      .default as string[];
  } else if (language.toLowerCase() === "guarani") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/guarani.json"))
      .default as string[];
  } else if (language.toLowerCase() === "kongo") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/kongo.json"))
      .default as string[];
  } else if (language.toLowerCase() === "zarma") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/zarma.json"))
      .default as string[];
  } else if (language.toLowerCase() === "tamasheq") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/tamasheq.json"))
      .default as string[];
  } else if (language.toLowerCase() === "songhay") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/songhay.json"))
      .default as string[];
  } else if (language.toLowerCase() === "twi") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/twi.json"))
      .default as string[];
  } else if (language.toLowerCase() === "dagbani") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/dagbani.json"))
      .default as string[];
  } else if (language.toLowerCase() === "luganda") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/luganda.json"))
      .default as string[];
  } else if (language.toLowerCase() === "acholi") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/acholi.json"))
      .default as string[];
  } else if (language.toLowerCase() === "dinka") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/dinka.json"))
      .default as string[];
  } else if (language.toLowerCase() === "nuer") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/nuer.json"))
      .default as string[];
  } else if (language.toLowerCase() === "shona") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/shona.json"))
      .default as string[];
  } else if (language.toLowerCase() === "ndebele") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/ndebele.json"))
      .default as string[];
  } else if (language.toLowerCase() === "tok_pisin") {
    // @ts-ignore
    return (await import("@repo/codebook/codebook-dist/tok_pisin.json"))
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
