import { writeFileSync } from "node:fs";

import { candidateLanguagesGlobal } from "./data/candidate-languages-global.mjs";
import { candidateLanguagesIndicA } from "./data/candidate-languages-indic-a.mjs";
import { candidateLanguagesIndicB } from "./data/candidate-languages-indic-b.mjs";

const targetLength = 5000;

const languages = {
  ...candidateLanguagesIndicA,
  ...candidateLanguagesIndicB,
  ...candidateLanguagesGlobal,
};

const addUnique = (target, seen, word) => {
  if (!word || seen.has(word)) return;
  seen.add(word);
  target.push(word);
};

const buildWords = ({ seed, prefixes, suffixes }) => {
  const words = [];
  const seen = new Set();

  for (const word of seed) addUnique(words, seen, word);

  for (const prefix of prefixes) {
    for (const noun of seed) {
      if (words.length >= targetLength) return words;
      if (prefix === noun) continue;
      addUnique(words, seen, `${prefix}${noun}`);
    }
  }

  for (const suffix of suffixes) {
    for (const noun of seed) {
      if (words.length >= targetLength) return words;
      if (suffix === noun) continue;
      addUnique(words, seen, `${noun}${suffix}`);
    }
  }

  for (const prefix of prefixes) {
    for (const suffix of suffixes) {
      for (const noun of seed) {
        if (words.length >= targetLength) return words;
        if (prefix === noun || suffix === noun) continue;
        addUnique(words, seen, `${prefix}${noun}${suffix}`);
      }
    }
  }

  return words;
};

for (const [language, spec] of Object.entries(languages)) {
  const words = buildWords(spec);

  if (words.length !== targetLength) {
    throw new Error(`${language} generated ${words.length} words`);
  }

  writeFileSync(
    `packages/codebook/codebook-dist/${language}.json`,
    `${JSON.stringify(words, null, 2)}\n`,
  );
  console.log(`${language}: ${words.length}`);
}
