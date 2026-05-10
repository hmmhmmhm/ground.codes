# Codebook Sub-Agent Review Checklist

Use this checklist when adding or regenerating codebook words. The automated
tests keep exact reviewed terms out, but they do not understand new words in the
same semantic class. A sub-agent review should therefore scan by pattern and
category, not only by exact blocklist membership.

## Why The Latest Korean Cases Were Missed

The previous test suite checked length, uniqueness, and explicit blocked words.
It did not flag:

- abbreviated foreign stems such as `프로코`, `시뮬`, and `에잇`
- ambiguous one-syllable words such as `체`, `채`, and `력`
- repeated-syllable fragments such as `기기` and `코코`
- domain-specific plant, herb, instrument, textile, game, and religious terms
- Korean place names or near-place terms unless the exact word was already
  blocked

## Shared Review Rules

- Flag proper names, surnames, cities, states, countries, demonyms, landmarks,
  brands, platforms, and product names.
- Flag sensitive domains: adult, gambling, alcohol, weapon, violent, military,
  medical, legal, political, religious, disaster, and risk terms.
- Flag narrow domain jargon: software, hardware, finance, instruments, herbs,
  medicines, specialized plants, textiles, and sports/game terminology.
- Flag generated-looking compounds, repeated syllables, awkward fragments, and
  malformed words.
- Prefer short, concrete, neutral, readable household or nature words.
- Keep every replacement unique within its language codebook, and preserve the
  codebook length.

## Korean

- Review all one-syllable entries manually unless already allowlisted.
- Flag Hangul foreign stems and abbreviations: `프로`, `시뮬`, `트레`, `카`, `스`,
  `프`, `브`, `클`, `딩`, `팅`.
- Flag repeated-syllable forms such as `기기`, `코코`, or other `AA` patterns
  unless they are explicitly approved.
- Flag Korean place names and district/island names, even when they are also
  ordinary-looking words.
- Flag herb, plant, instrument, textile, game, and religious loanwords.

## English

- Run a proper-noun pass for common first names, surnames, cities, states,
  countries, and demonyms.
- Flag capitalized software, web, brand, and product names.
- Flag long or hard-to-pronounce words, especially silent-letter and rare-cluster
  patterns such as `ough`, `augh`, `psy`, `sch`, `rhythm`, and `corps`.
- Flag coined-looking place or brand compounds ending in forms such as `brook`,
  `field`, `haven`, `ridge`, `stone`, `vale`, `fall`, `water`, and `leaf`.

## Chinese

- Scan single-character morphemes as well as compounds.
- Flag category roots and compounds around `酒`, `赌`, `奖`, `扑克`, `骰`,
  `医`, `药`, `病`, `症`, `诊`, `疗`, `神`, `庙`, `祭`, `圣`, `佛`, `寺`,
  `剑`, `弓`, `箭`, and combat terms.
- Flag contiguous generated runs with geography suffixes such as `江`, `河`,
  `湖`, `山`, `溪`, `湾`, `岭`, `园`, `港`, `塔`, `城`, and `村`.
- Flag Chinese and global brands, apps, platforms, and transliterated foreign
  instrument names.

## Japanese

- Keep hiragana-only shape checks, but also flag words normally written in
  katakana when hiragana looks unnatural.
- Flag common given-name and surname readings.
- Flag malformed or typo-like variants such as clipped adjective stems.
- Flag political, religious, gambling, medical, legal, military, violent, and
  risky terms even when the hiragana is valid and common.
