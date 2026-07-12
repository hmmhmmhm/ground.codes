# 180 Language Expansion Target

This document defines the working target for expanding Ground Codes to 180
languages with codebooks, web UI localization, and localized region labels.

## Target Definition

The target manifest is `config/language-expansion-targets.json`.

- Target count: 180 languages.
- Backbone source: Library of Congress ISO 639 data rows with ISO 639-1 alpha-2
  codes.
- Current project source: `apps/api-ground-codes/src/endpoints/v1/language.ts`.
- Current non-ISO-639-1 project languages remain in the target when already
  supported.
- Remaining target slots are filled from ISO 639-1 candidates not already
  represented by a current language alias.

The Library of Congress source used by the manifest generator was:

`https://www.loc.gov/standards/iso639-2/ISO-639-2_utf-8.txt`

## Completion Criteria

A target language is considered scaffolded when all of the following exist:

- Distributed 5,000-word codebook in `packages/codebook/codebook-dist`.
- API language entry in `apps/api-ground-codes/src/endpoints/v1/language.ts`.
- Runtime wordset type/count/loader in `packages/ground-codes/src/wordset.ts`.
- Web locale entry in `apps/web/i18n.ts`.
- Web locale message and place-type JSON files.
- Locale-to-Ground-Code mapping in `apps/web/lib/i18n/ground-code-language.ts`.

A target language is considered fully localized when it is scaffolded and also
has:

- Localized UI copy rather than English fallback. The completion audit requires
  at least 80 message leaves to differ from English, excluding language metadata.
- No non-brand `index.json` UI string may exactly match the English source.
  `Ground Code`, `Ground Codes`, and `Mars` are allowed as product/proper-name
  labels.
- Localized place-type labels with no exact English source-label fallback.
- Localized region files for Earth, Moon, and Mars:
  - `region-2-{language}.json`
  - `region-3-{language}.json`
  - `region-2-moon-{language}.json`
  - `region-2-mars-{language}.json`
  - `region-3-mars-{language}.json`
- Region quality checks include reviewed multilingual ocean labels and an
  expanded `region-3` representative ocean label guard for every target
  language.
- Distributed codebooks must preserve their expected counts, be unique,
  URL-safe single-token word lists, and avoid mirroring the English codebook.

English is the source locale and is treated as UI-localized by definition.

## Audit Commands

Run the full 180-language completion and quality gate:

```sh
pnpm language:audit
```

For a lighter summary report, run:

```sh
pnpm language:target-report
```

For the native-review backlog and `LANGUAGE_QUALITY.md` consistency report,
run:

```sh
pnpm language:quality-report
```

Use the completion gate only when the repository is expected to satisfy the full
180-language objective:

```sh
node scripts/language-expansion-target-report.mjs --assert-complete
```

`language:audit` expands to the scripted regression suite for the quality gates:

```sh
node scripts/language-quality-status-report.mjs --assert-current
node scripts/language-expansion-target-report.mjs --assert-complete
node --test scripts/language-support-completeness.test.mjs
node --test scripts/codebook-policy-audit.test.mjs
node --test scripts/address-gap-codebook-quality.test.mjs
node --test scripts/region-label-quality.test.mjs
pnpm --filter web check-types
```

## Current Baseline

Current verified baseline:

- Codebook/API/web scaffolded: 180/180.
- Fully localized UI and regions according to the scripted completion gate:
  180/180.
- `index.json` non-brand exact-English fallback: 0.
- `placeTypes.json` exact-English fallback: 0.
- Scaffold marker `·` in web messages: 0.
- Region representative `region-3` ocean label fallback covered by regression
  test for every non-English target language.
- Codebook count, uniqueness, URL-safety, and English-mirroring checks covered
  by `language-support-completeness.test.mjs`.

All 180 languages meet the repository's automated `stable` gate. Here,
`stable` means structural, regression, and minimum-score checks pass; it does
not mean native-speaker certification. Native-speaker review remains ongoing
maintenance tracked in `docs/language-native-review-backlog.md`.
