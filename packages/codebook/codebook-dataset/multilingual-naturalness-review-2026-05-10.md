# Multilingual Codebook Naturalness Review - 2026-05-10

This pass reviewed the distributed English, Korean, Chinese, and Japanese
codebooks for terms that are safe but poor address words: generated-looking
compounds, real places, brands, one-character or one-syllable fragments, rare
terms, and hard-to-recognize entries.

The pass intentionally does not remove every possible low-confidence item in
one change. It replaces high-confidence findings and records larger cleanup
classes for later review so the codebooks stay stable and testable.

## Summary

| Language | Replaced | Main issues found | Deferred cleanup |
| --- | ---: | --- | --- |
| English | 68 | `Elmcrest`-style generated compounds, places, names, technology proper nouns | Long abstract words and abbreviation fragments |
| Korean | 38 | Generated emotional compounds, one-syllable fragments, places, brands, loanwords | Large-scale generated prefix cleanup and one-syllable cleanup |
| Chinese | 58 | Brands/apps, real places and landmarks, poetic/generated compounds, rare characters | Large one-character fragment cleanup |
| Japanese | 67 | Brand/place-like terms, short fragments, awkward or literary compounds | Medium/low naturalness review for long-tail entries |

## Replacement Rules

- Replacement words must not already exist in the same codebook.
- Codebook length and uniqueness must remain unchanged.
- Replacements should be neutral, concrete, readable, and suitable as address
  words.
- High-confidence naturalness blocks are covered by tests so the same terms do
  not return in future regeneration or manual edits.

## Deferred Notes

- Korean has roughly 400 generated prefix compounds and 345 one-syllable
  fragments left to review in a separate bulk pass.
- Chinese has roughly 1,418 one-character entries. Some are valid words, but
  they reduce code-word distinctiveness and need a dedicated replacement pool.
- English still has a long tail of long abstract or administrative words.
  These are lower risk than generated place-like compounds.
