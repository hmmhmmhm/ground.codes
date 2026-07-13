import { readFileSync } from "node:fs";

import { compoundSuffixesAsia } from "./data/codebook-compound-suffixes-asia.mjs";
import { compoundSuffixesCore } from "./data/codebook-compound-suffixes-core.mjs";
import { compoundSuffixesEurope } from "./data/codebook-compound-suffixes-europe.mjs";
import { compoundSuffixesExpansion } from "./data/codebook-compound-suffixes-expansion.mjs";
import {
  CODEBOOK_FILES,
  FRENCH_REVIEWED_STANDALONE_WORDS,
  GERMAN_REVIEWED_STANDALONE_WORDS,
  INDONESIAN_REVIEWED_STANDALONE_WORDS,
  PORTUGUESE_REVIEWED_STANDALONE_WORDS,
  SPANISH_REVIEWED_STANDALONE_WORDS,
} from "./data/codebook-inventory-config.mjs";

const COMPOUND_SUFFIXES = {
  ...compoundSuffixesCore,
  ...compoundSuffixesEurope,
  ...compoundSuffixesAsia,
  ...compoundSuffixesExpansion,
};

const LANGUAGE_LABELS = {
  english: "English",
  korean: "Korean",
  chinese: "Chinese",
  japanese: "Japanese",
  spanish: "Spanish",
  french: "French",
  german: "German",
  portuguese: "Portuguese",
  indonesian: "Indonesian",
  thai: "Thai",
  vietnamese: "Vietnamese",
  hindi: "Hindi",
  arabic: "Arabic",
  russian: "Russian",
  swahili: "Swahili",
  filipino: "Filipino",
  hausa: "Hausa",
  bengali: "Bengali",
  urdu: "Urdu",
  amharic: "Amharic",
  burmese: "Burmese",
  khmer: "Khmer",
  nepali: "Nepali",
  somali: "Somali",
  pashto: "Pashto",
  lingala: "Lingala",
  mongolian: "Mongolian",
  lao: "Lao",
  malagasy: "Malagasy",
  dari: "Dari",
  oromo: "Oromo",
  chichewa: "Chichewa",
  tigrinya: "Tigrinya",
  bambara: "Bambara",
  fula: "Fula",
  wolof: "Wolof",
  sinhala: "Sinhala",
  tamil: "Tamil",
  kinyarwanda: "Kinyarwanda",
  kirundi: "Kirundi",
  krio: "Krio",
  ewe: "Ewe",
  fon: "Fon",
  sango: "Sango",
  moore: "Mooré",
  kanuri: "Kanuri",
  quechua: "Quechua",
  aymara: "Aymara",
  guarani: "Guarani",
  kongo: "Kongo",
  zarma: "Zarma",
  tamasheq: "Tamasheq",
  songhay: "Songhay",
  twi: "Twi",
  dagbani: "Dagbanli",
  luganda: "Luganda",
  acholi: "Acholi",
  dinka: "Dinka",
  nuer: "Nuer",
  shona: "chiShona",
  ndebele: "isiNdebele",
  tok_pisin: "Tok Pisin",
};

const TYPE_LABELS = {
  recognizedCompound: "recognized compound",
  shortStandalone: "short standalone",
  otherStandalone: "other standalone or unclassified",
};

const readCodebook = (language) =>
  JSON.parse(
    readFileSync(new URL(CODEBOOK_FILES[language], import.meta.url), "utf8"),
  );

const characterLength = (word) => [...word].length;

const fourCharStandaloneLanguages = new Set([
  "swahili",
  "filipino",
  "hausa",
  "bengali",
  "urdu",
  "amharic",
  "burmese",
  "khmer",
  "nepali",
  "somali",
  "pashto",
  "lingala",
  "mongolian",
  "lao",
  "malagasy",
  "dari",
  "oromo",
  "chichewa",
  "tigrinya",
  "bambara",
  "fula",
  "wolof",
  "sinhala",
  "tamil",
  "kinyarwanda",
  "kirundi",
  "krio",
  "ewe",
  "fon",
  "sango",
  "moore",
  "kanuri",
  "quechua",
  "aymara",
  "guarani",
  "kongo",
  "zarma",
  "tamasheq",
  "songhay",
  "twi",
  "dagbani",
  "luganda",
  "acholi",
  "dinka",
  "nuer",
  "shona",
  "ndebele",
  "tok_pisin",
  "english",
  "spanish",
  "french",
  "german",
  "portuguese",
  "indonesian",
  "vietnamese",
  "hindi",
  "arabic",
  "russian",
]);

const isShortStandalone = (language, word) => {
  const length = characterLength(word);

  if (fourCharStandaloneLanguages.has(language)) {
    return length <= 4;
  }

  if (language === "thai" || language === "hindi") {
    return length <= 3;
  }

  if (language === "korean" || language === "chinese") {
    return length === 1;
  }

  return length <= 2;
};

const minPrefixLength = (language) => {
  if (language === "korean" || language === "chinese") {
    return 1;
  }

  if (fourCharStandaloneLanguages.has(language)) {
    return 4;
  }

  if (language === "thai") {
    return 1;
  }

  return 3;
};

const latinSuffixLanguages = new Set([
  "english",
  "spanish",
  "french",
  "german",
  "portuguese",
  "indonesian",
  "vietnamese",
  "swahili",
  "filipino",
  "hausa",
  "somali",
  "lingala",
  "malagasy",
  "oromo",
  "chichewa",
  "bambara",
  "fula",
  "wolof",
  "kinyarwanda",
  "kirundi",
  "krio",
  "ewe",
  "fon",
  "sango",
  "moore",
  "kanuri",
  "quechua",
  "aymara",
  "guarani",
  "kongo",
  "zarma",
  "tamasheq",
  "songhay",
  "twi",
  "dagbani",
  "luganda",
  "acholi",
  "dinka",
  "nuer",
  "shona",
  "ndebele",
  "tok_pisin",
]);

const normalizeForSuffix = (language, word) => {
  if (latinSuffixLanguages.has(language)) {
    return word.toLowerCase();
  }

  return word;
};

const generatedAddressGapLanguages = new Set([
  "mongolian",
  "lao",
  "malagasy",
  "dari",
  "oromo",
  "chichewa",
  "tigrinya",
  "bambara",
  "fula",
  "wolof",
  "sinhala",
  "tamil",
  "kinyarwanda",
  "kirundi",
  "krio",
  "ewe",
  "fon",
  "sango",
  "moore",
  "kanuri",
  "quechua",
  "aymara",
  "guarani",
  "kongo",
  "zarma",
  "tamasheq",
  "songhay",
  "twi",
  "dagbani",
  "luganda",
  "acholi",
  "dinka",
  "nuer",
  "shona",
  "ndebele",
  "tok_pisin",
]);
const generatedSuffixCache = new Map();
const getGeneratedSuffixes = (language) => {
  const cached = generatedSuffixCache.get(language);
  if (cached) return cached;
  const suffixes = readCodebook(language)
    .slice(0, 5)
    .map((word) => normalizeForSuffix(language, word));
  generatedSuffixCache.set(language, suffixes);
  return suffixes;
};

const findCompoundSuffix = (language, word) => {
  if (language === "spanish" && SPANISH_REVIEWED_STANDALONE_WORDS.has(word)) {
    return undefined;
  }
  if (
    language === "indonesian" &&
    INDONESIAN_REVIEWED_STANDALONE_WORDS.has(word)
  ) {
    return undefined;
  }
  if (language === "german" && GERMAN_REVIEWED_STANDALONE_WORDS.has(word)) {
    return undefined;
  }
  if (language === "french" && FRENCH_REVIEWED_STANDALONE_WORDS.has(word)) {
    return undefined;
  }
  if (
    language === "portuguese" &&
    PORTUGUESE_REVIEWED_STANDALONE_WORDS.has(word)
  ) {
    return undefined;
  }

  const normalized = normalizeForSuffix(language, word);
  const suffixes =
    COMPOUND_SUFFIXES[language] ??
    (generatedAddressGapLanguages.has(language)
      ? getGeneratedSuffixes(language)
      : []);
  const minPrefix = minPrefixLength(language);

  return suffixes.find(
    (suffix) =>
      normalized.endsWith(suffix) &&
      characterLength(normalized) > characterLength(suffix) + minPrefix - 1,
  );
};

export const buildTypeInventory = () => {
  return Object.keys(CODEBOOK_FILES).map((language) => {
    const words = readCodebook(language);
    const examples = {
      recognizedCompound: [],
      shortStandalone: [],
      otherStandalone: [],
    };
    const counts = {
      recognizedCompound: 0,
      shortStandalone: 0,
      otherStandalone: 0,
    };

    for (const word of words) {
      const type = findCompoundSuffix(language, word)
        ? "recognizedCompound"
        : isShortStandalone(language, word)
          ? "shortStandalone"
          : "otherStandalone";

      counts[type] += 1;

      if (examples[type].length < 5) {
        examples[type].push(word);
      }
    }

    return {
      language,
      label: LANGUAGE_LABELS[language],
      total: words.length,
      counts,
      examples,
    };
  });
};

const formatPercent = (count, total) =>
  `${((count / total) * 100).toFixed(1)}%`;

const formatExamples = (examples) => examples.join(", ");

if (import.meta.url === `file://${process.argv[1]}`) {
  const rows = buildTypeInventory();

  console.log("| Language | Type | Count | Share | Examples |");
  console.log("| --- | --- | ---: | ---: | --- |");

  for (const row of rows) {
    for (const key of [
      "recognizedCompound",
      "shortStandalone",
      "otherStandalone",
    ]) {
      console.log(
        `| ${row.label} | ${TYPE_LABELS[key]} | ${row.counts[key]} | ${formatPercent(
          row.counts[key],
          row.total,
        )} | ${formatExamples(row.examples[key])} |`,
      );
    }
  }
}
