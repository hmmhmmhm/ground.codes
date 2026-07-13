import { readFileSync } from "node:fs";

export const CODEBOOK_FILES = {
  english: "../packages/codebook/codebook-dist/english.json",
  korean: "../packages/codebook/codebook-dist/korean.json",
  chinese: "../packages/codebook/codebook-dist/chinese.json",
  japanese: "../packages/codebook/codebook-dist/japanese.json",
  spanish: "../packages/codebook/codebook-dist/spanish.json",
  french: "../packages/codebook/codebook-dist/french.json",
  german: "../packages/codebook/codebook-dist/german.json",
  portuguese: "../packages/codebook/codebook-dist/portuguese.json",
  indonesian: "../packages/codebook/codebook-dist/indonesian.json",
  thai: "../packages/codebook/codebook-dist/thai.json",
  vietnamese: "../packages/codebook/codebook-dist/vietnamese.json",
  hindi: "../packages/codebook/codebook-dist/hindi.json",
  arabic: "../packages/codebook/codebook-dist/arabic.json",
  russian: "../packages/codebook/codebook-dist/russian.json",
  swahili: "../packages/codebook/codebook-dist/swahili.json",
  filipino: "../packages/codebook/codebook-dist/filipino.json",
  hausa: "../packages/codebook/codebook-dist/hausa.json",
  bengali: "../packages/codebook/codebook-dist/bengali.json",
  urdu: "../packages/codebook/codebook-dist/urdu.json",
  amharic: "../packages/codebook/codebook-dist/amharic.json",
  burmese: "../packages/codebook/codebook-dist/burmese.json",
  khmer: "../packages/codebook/codebook-dist/khmer.json",
  nepali: "../packages/codebook/codebook-dist/nepali.json",
  somali: "../packages/codebook/codebook-dist/somali.json",
  pashto: "../packages/codebook/codebook-dist/pashto.json",
  lingala: "../packages/codebook/codebook-dist/lingala.json",
  mongolian: "../packages/codebook/codebook-dist/mongolian.json",
  lao: "../packages/codebook/codebook-dist/lao.json",
  malagasy: "../packages/codebook/codebook-dist/malagasy.json",
  dari: "../packages/codebook/codebook-dist/dari.json",
  oromo: "../packages/codebook/codebook-dist/oromo.json",
  chichewa: "../packages/codebook/codebook-dist/chichewa.json",
  tigrinya: "../packages/codebook/codebook-dist/tigrinya.json",
  bambara: "../packages/codebook/codebook-dist/bambara.json",
  fula: "../packages/codebook/codebook-dist/fula.json",
  wolof: "../packages/codebook/codebook-dist/wolof.json",
  sinhala: "../packages/codebook/codebook-dist/sinhala.json",
  tamil: "../packages/codebook/codebook-dist/tamil.json",
  kinyarwanda: "../packages/codebook/codebook-dist/kinyarwanda.json",
  kirundi: "../packages/codebook/codebook-dist/kirundi.json",
  krio: "../packages/codebook/codebook-dist/krio.json",
  ewe: "../packages/codebook/codebook-dist/ewe.json",
  fon: "../packages/codebook/codebook-dist/fon.json",
  sango: "../packages/codebook/codebook-dist/sango.json",
  moore: "../packages/codebook/codebook-dist/moore.json",
  kanuri: "../packages/codebook/codebook-dist/kanuri.json",
  quechua: "../packages/codebook/codebook-dist/quechua.json",
  aymara: "../packages/codebook/codebook-dist/aymara.json",
  guarani: "../packages/codebook/codebook-dist/guarani.json",
  kongo: "../packages/codebook/codebook-dist/kongo.json",
  zarma: "../packages/codebook/codebook-dist/zarma.json",
  tamasheq: "../packages/codebook/codebook-dist/tamasheq.json",
  songhay: "../packages/codebook/codebook-dist/songhay.json",
  twi: "../packages/codebook/codebook-dist/twi.json",
  dagbani: "../packages/codebook/codebook-dist/dagbani.json",
  luganda: "../packages/codebook/codebook-dist/luganda.json",
  acholi: "../packages/codebook/codebook-dist/acholi.json",
  dinka: "../packages/codebook/codebook-dist/dinka.json",
  nuer: "../packages/codebook/codebook-dist/nuer.json",
  shona: "../packages/codebook/codebook-dist/shona.json",
  ndebele: "../packages/codebook/codebook-dist/ndebele.json",
  tok_pisin: "../packages/codebook/codebook-dist/tok_pisin.json",
};

const SPANISH_REVIEW_FILES = [
  "../packages/codebook/codebook-dataset/spanish/standalone-review-2026-05-21.md",
];

const INDONESIAN_REVIEW_FILES = [
  "../packages/codebook/codebook-dataset/indonesian/standalone-review-2026-05-22.md",
  "../packages/codebook/codebook-dataset/indonesian/standalone-review-2026-05-22-v2.md",
  "../packages/codebook/codebook-dataset/indonesian/standalone-review-2026-05-24.md",
];

const GERMAN_REVIEW_FILES = [
  "../packages/codebook/codebook-dataset/german/standalone-review-2026-05-24.md",
];

const FRENCH_REVIEW_FILES = [
  "../packages/codebook/codebook-dataset/french/standalone-review-2026-05-24.md",
];

const PORTUGUESE_REVIEW_FILES = [
  "../packages/codebook/codebook-dataset/portuguese/standalone-review-2026-05-24.md",
];

const readReviewedSpanishStandaloneWords = () => {
  const words = new Set();

  for (const path of SPANISH_REVIEW_FILES) {
    const text = readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
    for (const match of text.matchAll(/`([A-Z][a-z]+)`/g)) {
      words.add(match[1]);
    }
  }

  return words;
};

export const SPANISH_REVIEWED_STANDALONE_WORDS =
  readReviewedSpanishStandaloneWords();

const readReviewedIndonesianStandaloneWords = () => {
  const words = new Set();

  for (const path of INDONESIAN_REVIEW_FILES) {
    const text = readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
    for (const match of text.matchAll(/`([A-Z][a-z]+)`/g)) {
      words.add(match[1]);
    }
  }

  return words;
};

export const INDONESIAN_REVIEWED_STANDALONE_WORDS =
  readReviewedIndonesianStandaloneWords();

const readReviewedGermanStandaloneWords = () => {
  const words = new Set();

  for (const path of GERMAN_REVIEW_FILES) {
    const text = readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
    for (const match of text.matchAll(/`([A-Z][a-z]+)`/g)) {
      words.add(match[1]);
    }
  }

  return words;
};

export const GERMAN_REVIEWED_STANDALONE_WORDS =
  readReviewedGermanStandaloneWords();

const readReviewedFrenchStandaloneWords = () => {
  const words = new Set();

  for (const path of FRENCH_REVIEW_FILES) {
    const text = readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
    for (const match of text.matchAll(/`([A-Z][a-z]+)`/g)) {
      words.add(match[1]);
    }
  }

  return words;
};

export const FRENCH_REVIEWED_STANDALONE_WORDS =
  readReviewedFrenchStandaloneWords();

const readReviewedPortugueseStandaloneWords = () => {
  const words = new Set();

  for (const path of PORTUGUESE_REVIEW_FILES) {
    const text = readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
    for (const match of text.matchAll(/`([A-Z][a-z]+)`/g)) {
      words.add(match[1]);
    }
  }

  return words;
};

export const PORTUGUESE_REVIEWED_STANDALONE_WORDS =
  readReviewedPortugueseStandaloneWords();
