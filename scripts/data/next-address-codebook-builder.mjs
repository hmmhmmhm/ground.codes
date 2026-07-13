import { commonSeeds } from "./next-address-common-seeds.mjs";
import { nativeSeedsPart1 } from "./next-address-native-seeds-1.mjs";
import { latinSeedsPart1 } from "./next-address-latin-seeds-1.mjs";
import { nextWaveLatinSeedsPart1 } from "./next-address-next-wave-latin-seeds-1.mjs";
import { nextWaveQualityStandaloneSeedsPart1 } from "./next-address-next-wave-quality-standalone-seeds-1.mjs";
import { nextWaveQualityStandaloneSeedsPart2 } from "./next-address-next-wave-quality-standalone-seeds-2.mjs";
import { nextWaveExtraQualityStandaloneSeedsPart1 } from "./next-address-next-wave-extra-quality-standalone-seeds-1.mjs";
import { nextWaveBackfillSuffixesPart1 } from "./next-address-next-wave-backfill-suffixes-1.mjs";
import { qualityStandaloneSeedsPart1 } from "./next-address-quality-standalone-seeds-1.mjs";
import { qualityStandaloneSeedsPart2 } from "./next-address-quality-standalone-seeds-2.mjs";
import { extraQualityStandaloneSeedsPart1 } from "./next-address-extra-quality-standalone-seeds-1.mjs";
import { extraQualityStandaloneSeedsPart2 } from "./next-address-extra-quality-standalone-seeds-2.mjs";
import { extraQualityStandaloneSeedsPart3 } from "./next-address-extra-quality-standalone-seeds-3.mjs";
import { extraQualityStandaloneSeedsPart4 } from "./next-address-extra-quality-standalone-seeds-4.mjs";
import { qualityBackfillSuffixesPart1 } from "./next-address-quality-backfill-suffixes-1.mjs";
import { qualityBackfillSuffixesPart2 } from "./next-address-quality-backfill-suffixes-2.mjs";
import {
  qualityRejectPatterns,
  scriptPatterns,
  syllables,
  transliterationMaps,
} from "./next-address-codebook-config.mjs";

const nativeSeeds = {
  ...nativeSeedsPart1,
};

const latinSeeds = {
  ...latinSeedsPart1,
};

const nextWaveLatinSeeds = {
  ...nextWaveLatinSeedsPart1,
};

const nextWaveQualityStandaloneSeeds = {
  ...nextWaveQualityStandaloneSeedsPart1,
  ...nextWaveQualityStandaloneSeedsPart2,
};

const nextWaveExtraQualityStandaloneSeeds = {
  ...nextWaveExtraQualityStandaloneSeedsPart1,
};

const nextWaveBackfillSuffixes = {
  ...nextWaveBackfillSuffixesPart1,
};

const qualityStandaloneSeeds = {
  ...qualityStandaloneSeedsPart1,
  ...qualityStandaloneSeedsPart2,
};

const extraQualityStandaloneSeeds = {
  ...extraQualityStandaloneSeedsPart1,
  ...extraQualityStandaloneSeedsPart2,
  ...extraQualityStandaloneSeedsPart3,
  ...extraQualityStandaloneSeedsPart4,
};

const qualityBackfillSuffixes = {
  ...qualityBackfillSuffixesPart1,
  ...qualityBackfillSuffixesPart2,
};

const foldLatin = (value) =>
  String(value)
    .replace(/[Ɔɔ]/g, "o")
    .replace(/[Ɛɛ]/g, "e")
    .replace(/[Ʋʋ]/g, "v")
    .replace(/[Ƒƒ]/g, "f")
    .replace(/[Ŋŋ]/g, "ng")
    .replace(/[Ɲɲ]/g, "ny")
    .replace(/[Ɣɣ]/g, "gh")
    .replace(/[Ɗɗ]/g, "d")
    .replace(/[Ɓɓ]/g, "b")
    .replace(/[Ƴƴ]/g, "y")
    .normalize("NFD")
    .replace(/\p{Mark}/gu, "")
    .replace(/[’'`´/#?\-]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const titleAscii = (value) => {
  const compact = foldLatin(value)
    .replace(/[^A-Za-z]/g, "")
    .toLowerCase();
  if (!compact) return "";
  return `${compact[0].toUpperCase()}${compact.slice(1)}`;
};

const transliterate = (value, script) => {
  const map = transliterationMaps[script];
  let output = "";
  for (const char of foldLatin(value).toLowerCase()) {
    if (/\d/.test(char) || /\s/.test(char)) {
      output += char;
      continue;
    }
    output += map?.[char] ?? "";
  }
  return output.replace(/\s+/g, " ").trim();
};

const normalizeCodeWord = (spec, value) => {
  if (spec.script === "latin") {
    const candidate = titleAscii(value);
    return /^[A-Z][a-z]+$/.test(candidate) && candidate.length <= 18
      ? candidate
      : "";
  }

  let candidate = String(value)
    .normalize("NFC")
    .replace(/[\s’'`´/#?\-.,،]/g, "")
    .trim();
  if (!scriptPatterns[spec.script].test(candidate)) {
    candidate = transliterate(value, spec.script).replace(/\s+/g, "");
  }
  return scriptPatterns[spec.script].test(candidate) &&
    [...candidate].length <= 24
    ? candidate
    : "";
};

const soundKey = (spec, word) =>
  spec.script === "latin"
    ? String(word)
        .toLowerCase()
        .replace(/c/g, "k")
        .replace(/q/g, "k")
        .replace(/ph/g, "f")
        .replace(/([a-z])\1+/g, "$1")
    : String(word)
        .normalize("NFC")
        .replace(/[\u200c\u200d\s]/g, "")
        .replace(/(.)\1+/gu, "$1");

const generatedLanguagePrefixRejectPattern =
  /^[A-Z][a-z]{1,12}(?:Ala|Bela|Dara|Branch)[A-Z]/;

const shouldRejectQualityCandidate = (spec, word) => {
  const pattern = qualityRejectPatterns[spec.language];
  return (
    generatedLanguagePrefixRejectPattern.test(word) ||
    (pattern?.test(word) ?? false)
  );
};

const generatedStandaloneSeeds = () => {
  const words = [];
  for (const a of syllables) {
    for (const b of syllables) {
      if (a === b) continue;
      words.push(`${a}${b}`);
      if (words.length >= 260) return words;
    }
  }
  return words;
};

const buildQualityBackfill = (spec, seeds) => {
  const suffixes = [
    ...(qualityBackfillSuffixes[spec.language] ?? []),
    ...(nextWaveBackfillSuffixes[spec.language] ?? []),
  ];
  const maxBackfill =
    nextWaveBackfillSuffixes[spec.language] === undefined ? 180 : 240;
  const backfill = [];
  for (const suffix of suffixes) {
    for (const seed of seeds) {
      backfill.push(
        spec.script === "latin"
          ? `${seed}${titleAscii(suffix)}`
          : `${seed}${suffix}`,
      );
      if (backfill.length >= maxBackfill) return backfill;
    }
  }
  return backfill;
};

export const buildCodebook = (spec) => {
  const words = [];
  const seen = new Set();
  const seenSoundKeys = new Set();
  const add = (word) => {
    const candidate = normalizeCodeWord(spec, word);
    if (!candidate || seen.has(candidate)) return;
    if (shouldRejectQualityCandidate(spec, candidate)) return;
    const key = soundKey(spec, candidate);
    if (seenSoundKeys.has(key)) return;
    seen.add(candidate);
    seenSoundKeys.add(key);
    words.push(candidate);
  };

  const qualitySeeds = [
    ...(nativeSeeds[spec.language] ?? []),
    ...(latinSeeds[spec.language] ?? []),
    ...(nextWaveLatinSeeds[spec.language] ?? []),
    ...(qualityStandaloneSeeds[spec.language] ?? []),
    ...(nextWaveQualityStandaloneSeeds[spec.language] ?? []),
    ...(nextWaveExtraQualityStandaloneSeeds[spec.language] ?? []),
    ...(extraQualityStandaloneSeeds[spec.language] ?? []),
  ];

  for (const word of [
    ...qualitySeeds,
    ...buildQualityBackfill(spec, qualitySeeds),
    ...commonSeeds,
    ...generatedStandaloneSeeds(),
  ]) {
    add(word);
  }

  const standalone = words.slice();
  for (const prefix of standalone) {
    for (const suffix of standalone) {
      if (prefix === suffix) continue;
      add(`${prefix}${suffix}`);
      if (words.length >= 5000) return words.slice(0, 5000);
    }
  }
  throw new Error(
    `${spec.language} codebook generated only ${words.length} words`,
  );
};
