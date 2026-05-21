# French Full Support Design

## Goal

Add French as a first-class Ground Codes language across codebooks, region
labels, public API, web UI, and verification.

## URL Policy

French public codes and share URL labels use ASCII-only title-case words.
Accents are normalized away, for example `Ecole` instead of `École`. This keeps
share URLs readable and prevents percent-encoded path segments.

## Scope

- Add `french` to the `SupportedLanguage` surface in `ground-codes`.
- Add a 5000-entry French codebook with the same quality bar as the Korean
  cleanup: common, neutral, concrete, pronounceable entries; no names, places,
  brands, sensitive terms, or generated-looking fragments.
- Add French Earth, Moon, and Mars region datasets:
  - `region-2-french.json`
  - `region-3-french.json`
  - `region-2-moon-french.json`
  - `region-2-mars-french.json`
  - `region-3-mars-french.json`
- Add French support to API validation, search fallback, examples, and docs.
- Add `fr` web locale, language picker labels, browser-language handling, place
  type labels, and weather language mapping.
- Extend quality audits and tests so French support is covered by CI.

## Region Label Strategy

Earth region labels start from existing English region data and normalize to
URL-safe ASCII labels. For global place names, preserving the established local
name is usually clearer than inventing French translations. French aliases are
added for high-signal country/capital and feature terms where they are natural
and recognizable.

Moon and Mars labels preserve official IAU proper names and translate common
feature descriptors only when doing so remains natural and URL-safe. This avoids
turning planetary nomenclature into unstable or obscure machine translations.

## Codebook Strategy

The French codebook starts with reviewed standalone nouns, then fills the
remaining capacity with conservative fused compounds built from safe natural or
material prefixes and everyday object suffixes. Generated compounds are bounded
by audit checks for shape, length, blocked terms, and saturation.

## Verification

Required checks:

- French codebook has exactly 5000 unique URL-safe entries.
- French entries pass shared codebook policy and French-specific blocked-term
  checks.
- French encode/decode works in `ground-codes`.
- French Earth/Moon/Mars region lookup and search load language-specific data.
- Web locale `fr` compiles and maps to `french`.
- API schemas accept `french` and reject unsupported languages.
