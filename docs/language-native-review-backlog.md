# 180-Language Native Review Backlog

This backlog tracks the remaining linguistic review work after the structural
180-language gates pass.

Current automated status:

- Target languages: 180
- `stable`: 11
- `active cleanup`: 169
- `pnpm language:audit`: required before shipping language-support changes

Useful report commands:

```sh
pnpm language:quality-report
pnpm language:quality-report -- --json
pnpm language:quality-report -- --category "generated fallback vocabulary"
pnpm language:quality-report -- --category "region terminology" --json
```

The automated gates prove that codebooks, UI files, place labels, region files,
runtime mappings, and fallback guards are present and internally consistent.
They also block generated language-prefix and language-slug/English scaffold
codewords from the public codebook tails.
They do not prove native-speaker naturalness. A language should only move from
`active cleanup` to `stable` after a focused review finds no high-confidence
replacement candidates and adds regression tests for any fixes made.

## Review Categories

| Category                      | Count | Primary action                                                                 |
| ----------------------------- | ----: | ------------------------------------------------------------------------------ |
| Generated fallback vocabulary |     0 | No active row currently names unresolved generated fallback vocabulary.        |
| Native lexical review        |   148 | Review long-tail codebook and label naturalness before stable promotion.      |
| Script-specific review        |     0 | No current language rows are explicitly marked for script-specific cleanup.    |
| Standalone expansion          |     0 | No current language rows are explicitly marked for standalone expansion.       |
| Region terminology            |     0 | No current language rows are explicitly marked for region terminology cleanup. |
| Fused pairs                   |     0 | No current language rows are explicitly marked for fused-pair cleanup.         |
| Transliteration seeds         |     0 | Replace rough transliterated seed words with native-script terms.              |

Categories overlap. For example, a language can need both script-specific review
and generated vocabulary cleanup.

## Suggested Batch Order

1. Native lexical review-heavy 180-language batch

   Start with the active-cleanup languages whose focus now says structural
   fallback removals are complete but long-tail native lexical review remains.
   These are structurally complete and need vocabulary naturalness review before
   stable promotion.

2. Address-gap native lexical review languages

   Review the address-gap languages that already front-load useful nouns and now
   pass exact/common English, generated-prefix, and fused-pair guards. These are
   likely to produce the most visible URL quality improvement per reviewed batch.

3. Region and script long-tail native review

   No language rows are currently marked for standalone region terminology or
   script-specific cleanup. Hindi's high-frequency region terrain terms now pass
   the generator-backed review pass; remaining Latin fragments are primarily
   proper names and should be handled as long-tail native transliteration review.

4. Script and transliteration languages

   No language rows are currently marked for standalone script-family cleanup.
   Continue reviewing non-Latin and diacritic-heavy languages under generated
   native lexical review or administrative-label naturalness when their row text
   names those issues.

5. Post-fusion native review

   The formerly fused-pair-marked languages (`swahili`, `hausa`, `bengali`,
   `urdu`, and `amharic`) now have full-codebook extended fusion scans. Continue
   reviewing their address-place compounds for native naturalness. Somali's
   early copied-English fallback and Filipino's early exact-English fallback
   have been replaced; continue reviewing both under generated fallback
   vocabulary.

## Promotion Rule

Before changing a language from `active cleanup` to `stable`:

1. Run a focused native review of the codebook, UI labels, place labels, and
   representative region labels.
2. Replace every high-confidence rough/generated term found in that pass.
3. Add exact regression examples to the relevant audit test.
4. Run `pnpm language:audit`.
5. Update `packages/codebook/LANGUAGE_QUALITY.md` and verify with
   `pnpm language:quality-report -- --assert-current`.
