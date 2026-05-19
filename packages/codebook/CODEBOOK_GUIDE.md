# Codebook Authoring Guide

This is the canonical guide for adding, regenerating, reviewing, or replacing
words in `@repo/codebook`.

The codebook is part of the public address surface of ground.codes. A word can
appear in a share URL, a marker label, a screenshot, a customer support report,
or an API response. Treat every entry as user-facing product copy, not as an
internal token.

## Quick Start

Before changing a codebook:

1. Read this guide.
2. Generate or edit candidate words in `codebook-dataset/<language>/`.
3. Remove disallowed words by category, not only by exact blocklist.
4. Preserve the expected distributed codebook length for the language.
5. Run the codebook and ground-codes audit tests.
6. Update review tests when a new rejected term teaches a reusable rule.

Current distributed word counts:

| Language | Count | Source file |
| --- | ---: | --- |
| English | 6000 | `codebook-dist/english.json` |
| Korean | 5630 | `codebook-dist/korean.json` |
| Chinese | 5140 | `codebook-dist/chinese.json` |
| Japanese | 5000 | `codebook-dist/japanese.json` |

## Product Principles

- Codes must feel neutral when attached to a real place.
- Codes must be short enough to read, say, copy, and share.
- Codes must avoid surprising, embarrassing, political, medical, violent, or
  adult associations.
- Codes must work across public URLs, browser search bars, screenshots,
  support tickets, and spoken conversation.
- A word that is technically valid but awkward in a place label should be
  rejected.

## Accepted Words

Prefer words that are:

- Common nouns in the target language.
- Short, concrete, and easy to pronounce.
- Neutral or gently positive in everyday use.
- Familiar to broad audiences, not only specialists.
- Stable over time and unlikely to become a brand, meme, or controversy.
- Naturally written in the target language's ordinary script.

Good categories:

- Household objects: `cup`, `basket`, `pillow`
- Nature and weather: `leaf`, `meadow`, `cloud`
- Food and materials when neutral: `rice`, `linen`, `paper`
- Simple actions as noun-like entries only when natural in the language
- Friendly abstract nouns when common and non-sensitive: `balance`, `calm`

## Accept / Reject Examples

Use examples to calibrate review decisions. The examples below describe the
reasoning pattern; they are not a request to add the exact accepted examples.

| Candidate pattern | Decision | Reason |
| --- | --- | --- |
| `basket`, `바구니`, `竹篮`, `かご` | Accept when common, neutral, concrete, and naturally written in the target language. | The word is readable in a public place label and has low semantic risk. |
| `cloud`, `구름`, `云朵`, `くも` | Accept when the meaning is broad, familiar, and not tied to a sensitive domain. | Nature words are usually safe unless they are place names, brands, or idioms with negative force. |
| `Seoul`, `서울`, `东京`, `とうきょう` | Reject when the word is a place name, even if ordinary users know it well. | Ground Codes already use region labels; coordinate payload words should not add extra geography. |
| `Poker`, `슬롯`, `彩票`, `ぱちんこ` | Reject when tied to gambling, betting, or games of chance. | Codes must not create embarrassing or regulated-domain associations. |
| `Clinic`, `당뇨`, `药`, `ちりょう` | Reject when medical, disease, medication, diagnosis, or treatment related. | A medical-looking address can be alarming or inappropriate in unrelated locations. |
| `Samsung`, `카카오`, `腾讯`, `やふおく` | Reject when a brand, platform, app, service, or product. | Brand terms create trademark, endorsement, and freshness problems. |
| `프로`, `시뮬`, `ぐぐ`, `foo` | Reject when clipped, generated-looking, foreign, or not a stable standalone word. | Fragment-like entries make codes look broken and reduce trust. |

When in doubt, reject the candidate and pick a simpler neutral replacement.
The codebook has enough surface area that marginal words are not worth keeping.

## Review Decision Tree

Apply this sequence to every new or suspicious candidate:

1. Is it a complete noun in the target language?
   If no, reject it.
2. Is it a person, place, brand, product, platform, landmark, demonym, title, or
   named entity?
   If yes, reject it.
3. Does it belong to a sensitive domain listed in this guide?
   If yes, reject it.
4. Would it look neutral next to a home, school, hospital, business, memorial,
   or sacred site?
   If no, reject it.
5. Is it short, common, pronounceable, and easy to copy from a URL?
   If no, prefer a clearer replacement.
6. Is it visually or phonetically too close to many existing entries?
   If yes, replace it unless there is a strong reason to keep it.
7. Can a reviewer explain why it is safe in one sentence?
   If no, reject it.

Default rule: reject uncertain candidates. Review time should be spent finding
better replacements, not defending marginal words.

## Rejected Words

Reject any word in these categories, even when the exact term is not already in
a test blocklist.

### Identity, Names, and Places

- Personal names, surnames, nicknames, titles, dynasties, demonyms
- Cities, states, countries, islands, districts, landmarks, tourist sites
- Planet names when they can collide with the service domain or body names
- Brands, apps, platforms, products, franchises, model names

### Sensitive or Risky Domains

- Adult, sexual, dating, body-part, or underwear terms
- Gambling, lottery, casino, card-game, betting, and speculative finance terms
- Alcohol, tobacco, drug, medication, or addiction terms
- Weapon, combat, military, violent, disaster, crime, and threat terms
- Medical, disease, injury, hospital, surgery, symptom, and disability terms
- Political, legal, protest, election, regime, and policy terms
- Religious, ritual, deity, saint, temple, church, curse, ghost, and occult terms
- Insults, negative emotions, shame, failure, fear, and disgust terms

### Quality and Shape Problems

- Generated-looking compounds or poetic fragments
- Repeated-syllable filler unless explicitly accepted in the language
- One-character or one-syllable fragments that cannot stand alone naturally
- Foreign abbreviations, clipped loanwords, product jargon, and transliteration
  fragments
- Specialist terminology from software, hardware, medicine, finance,
  instruments, herbs, sports, games, textiles, or industrial processes
- Rare, archaic, hard-to-pronounce, or spelling-ambiguous words
- Words that are too visually similar to many other entries in the same
  language

## Language-Specific Rules

### English

- Prefer short common nouns in ordinary casing.
- Reject common first names, surnames, cities, states, countries, and demonyms.
- Reject capitalized brand, product, platform, software, and web terms.
- Avoid hard clusters and silent-letter patterns such as `ough`, `augh`, `psy`,
  `sch`, `rhythm`, and `corps`.
- Be skeptical of coined-looking compounds ending in `brook`, `field`, `haven`,
  `ridge`, `stone`, `vale`, `fall`, `water`, or `leaf`.

### Korean

- Prefer complete, natural Korean nouns written in Hangul.
- Review every one-syllable entry manually unless already allowlisted.
- Reject clipped foreign stems and abbreviations such as `프로`, `시뮬`, `트레`,
  `카`, `스`, `프`, `브`, `클`, `딩`, and `팅`.
- Reject repeated-syllable forms such as `기기` or `코코` unless explicitly
  approved.
- Reject Korean place names, island names, districts, brands, and loanword
  fragments.
- Be strict with plant, herb, instrument, textile, game, and religious loanwords.

### Chinese

- Review both single-character morphemes and compounds.
- Reject roots and compounds around alcohol, gambling, medicine, disease,
  religion, weapons, combat, and politics.
- Be strict with geography suffixes such as `江`, `河`, `湖`, `山`, `溪`, `湾`,
  `岭`, `园`, `港`, `塔`, `城`, and `村` when they create place-like labels.
- Reject Chinese and global brands, apps, platforms, and transliterated foreign
  product names.

### Japanese

- The distributed Japanese word set should remain kana-visible and natural.
- Prefer hiragana words that are normally acceptable in hiragana.
- Reject words normally written in katakana when hiragana looks unnatural.
- Reject common given-name and surname readings.
- Reject malformed adjective stems, clipped readings, typo-like variants, and
  adult, gambling, medical, political, religious, legal, military, violent, or
  risky terms.

## Automated Checks

Automated checks cannot replace human review, but they should catch repeatable
classes of mistakes.

Current required checks:

- Expected language counts and uniqueness.
- Exact reviewed blocklist terms.
- Japanese kana-visible and natural-word shape checks.
- Region label URL safety and localized label reports.
- Runtime guide discoverability via `scripts/codebook-guide.test.mjs`.

Checks to add when a review finds a repeatable pattern:

- Script-shape checks: one-character Chinese entries, one-syllable Korean
  entries, or Japanese entries with unnatural script forms.
- Substring/root checks for sensitive domains such as gambling, medicine,
  religion, weapons, and politics.
- Named-entity candidate checks for places, brands, apps, and personal names.
- Similarity checks for near-duplicates that differ only by suffix, spelling, or
  transliteration.
- URL readability checks for very long entries or entries likely to require
  confusing percent-encoding.

Do not add broad automated rejection rules without reviewing false positives.
Automated checks should point reviewers to suspicious candidates; exact
blocklists should remain conservative and explainable.

## Generation Prompt Rules

Generation prompts and refinement prompts must follow this guide.

Prompt summaries may be shorter, but they must preserve these hard rules:

- Only target-language noun entries.
- Common nouns are preferred; proper names are rejected.
- Short, neutral, concrete, familiar, readable words only.
- No country, city, region, landmark, person, brand, platform, or product names.
- No sensitive domains listed in this guide.
- No artificial compounds, jargon, fragments, or awkward loanwords.
- Return raw JSON arrays only when generating datasets.

## Review Workflow

For each changed language:

1. Run exact duplicate and expected-length checks.
2. Scan manually by rejected category, not only by exact blocklist.
3. Search for new semantic clusters that resemble removed terms.
4. Replace rejected words with neutral entries from accepted categories.
5. Add exact rejected terms to the relevant review test when they are likely to
   regress.
6. Update this guide if the issue reveals a new general rule.

The checklist at `codebook-dataset/subagent-review-checklist.md` is an
operational companion for review passes. It must not introduce rules that
contradict this guide.

## Compatibility Rules

The codebook order is part of the encoding contract. Reordering entries changes
existing decoded coordinates.

- Do not reorder a distributed codebook casually.
- Do not remove an entry without replacing it at the same index unless a planned
  versioned migration exists.
- Preserve language counts unless the encoder base and compatibility plan are
  updated together.
- Treat any broad replacement pass as a compatibility-sensitive change.
- When compatibility must change, document the migration in
  `packages/ground-codes/README.md` and API release notes.

## Versioning Playbook

Use this playbook before changing any distributed `codebook-dist/*.json` file.

### Safe Patch

Use a safe patch when a word is unacceptable but the language count and base stay
the same.

- Replace only the bad word at the same index.
- Keep every other index unchanged.
- Add the rejected word to review tests when useful.
- Verify existing known-pair tests and smoke paths.
- Document the reason in the commit message or PR body.

This preserves numeric decoding for the same index. It changes the visible word
for newly encoded values at that index, so support teams should still know what
changed.

### Compatibility-Sensitive Change

Treat the change as compatibility-sensitive when it does any of the following:

- Reorders entries.
- Adds or removes entries.
- Changes the language count or word-set base.
- Regenerates a large part of a language.
- Changes tokenization, casing, normalization, or decode lookup semantics.

For these changes, define a versioned migration before shipping:

- Keep legacy decode support for old codebook versions.
- Encode new values with the new version only after readers can decode both.
- Decide how share URLs identify the codebook version if needed.
- Add known-pair tests for old and new encodings.
- Document the migration in `packages/ground-codes/README.md`, API docs, and
  release notes.

### Emergency Removal

If a harmful term is already distributed:

1. Replace it at the same index with a safe neutral word.
2. Add an exact blocklist test for the removed term.
3. Run production smoke after deployment.
4. Record the visible-code impact for support.
5. Consider whether legacy decode aliases are needed for already shared URLs.

Emergency changes still need compatibility review; speed does not make index
changes safe.

## Required Checks

Run the narrowest relevant checks first, then broader checks before publishing:

```bash
pnpm --filter ground-codes test:data-audit
pnpm --filter ground-codes test
pnpm --filter @repo/codebook build
pnpm scripts:test
```

If a change touches only documentation, `pnpm scripts:test` is usually enough to
verify the guide is still discoverable from the main entry points.
