import { readFileSync, writeFileSync } from "node:fs";

import {
  labelNounLimits,
  labelNounRejects,
} from "./data/european-label-policy.mjs";
import { labelPatternPrefixes } from "./data/european-label-prefixes.mjs";
import { europeanLanguagesCzech } from "./data/european-languages-czech.mjs";
import { europeanLanguagesEastA } from "./data/european-languages-east-a.mjs";
import { europeanLanguagesNorthA } from "./data/european-languages-north-a.mjs";
import { europeanLanguagesNorthB } from "./data/european-languages-north-b.mjs";
import { europeanLanguagesRomanian } from "./data/european-languages-romanian.mjs";
import { europeanLanguagesWest } from "./data/european-languages-west.mjs";

const targetLength = 5000;

const languages = {
  ...europeanLanguagesWest,
  ...europeanLanguagesEastA,
  ...europeanLanguagesRomanian,
  ...europeanLanguagesCzech,
  ...europeanLanguagesNorthA,
  ...europeanLanguagesNorthB,
};

const readWords = (language) =>
  JSON.parse(
    readFileSync(`packages/codebook/codebook-dist/${language}.json`, "utf8"),
  );

const addUnique = (target, seen, word) => {
  if (!word || seen.has(word)) return;
  seen.add(word);
  target.push(word);
};

const applyCorrections = (words, corrections) =>
  words.map((word) => corrections[word] ?? word);

const buildWords = (language, spec) => {
  const source = applyCorrections(
    spec.seed ?? readWords(language),
    spec.corrections,
  );
  const seed = [];
  const seen = new Set();

  for (const word of [...source.slice(0, 180), ...spec.extras]) {
    addUnique(seed, seen, word);
  }

  const words = [...seed];
  const allSeen = new Set(words);
  const nounSeed = labelNounLimits[language]
    ? seed
        .filter((word) => !labelNounRejects[language]?.has(word))
        .slice(0, labelNounLimits[language])
    : seed;
  const nouns = nounSeed.filter((word) => [...word].length >= 3);

  const addCombinations = (patterns) => {
    for (const pattern of patterns) {
      for (const noun of nouns) {
        if (words.length >= targetLength) return;
        const candidate = pattern(noun);
        if (candidate.includes(`${noun}${noun}`)) continue;
        addUnique(words, allSeen, candidate);
      }
    }
  };

  const labelPrefixes = labelPatternPrefixes[language];
  const patterns = labelPrefixes
    ? labelPrefixes.map(
        (prefix) => (noun) => (noun === prefix ? "" : `${prefix}${noun}`),
      )
    : [
        ...spec.prefixes.map(
          (prefix) => (noun) => (noun === prefix ? "" : `${prefix}${noun}`),
        ),
        ...spec.suffixes.map(
          (suffix) => (noun) => (noun === suffix ? "" : `${noun}${suffix}`),
        ),
      ];

  addCombinations(patterns);

  for (const word of source) {
    if (words.length >= targetLength) break;
    addUnique(words, allSeen, word);
  }

  if (words.length !== targetLength) {
    throw new Error(`${language} generated ${words.length} words`);
  }

  return words;
};

for (const [language, spec] of Object.entries(languages)) {
  const words = buildWords(language, spec);
  writeFileSync(
    `packages/codebook/codebook-dist/${language}.json`,
    `${JSON.stringify(words, null, 2)}\n`,
  );
  console.log(`${language}: ${words.length}`);
}
