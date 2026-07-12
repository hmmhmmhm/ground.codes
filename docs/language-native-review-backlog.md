# 180-Language Native Review Backlog

This backlog tracks the remaining linguistic review work after the structural
180-language gates pass.

Current automated status:

- Target languages: 180
- `stable`: 180
- `active cleanup`: 0
- `pnpm language:audit`: required before shipping language-support changes

In this repository, `stable` means structural, regression, and minimum-score
checks pass. It does not mean native-speaker certification.

Useful report commands:

```sh
pnpm language:quality-report
pnpm language:quality-score
pnpm language:quality-score -- --json
pnpm language:quality-score -- --assert-min 80
pnpm language:quality-report -- --json
pnpm language:quality-report -- --category "generated fallback vocabulary"
pnpm language:quality-report -- --category "region terminology" --json
```

The automated gates prove that codebooks, UI files, place labels, region files,
runtime mappings, and fallback guards are present and internally consistent.
They also block generated language-prefix and language-slug/English scaffold
codewords from the public codebook tails.
They do not prove native-speaker naturalness. The current stable-grade pass uses
automated review, exact regression blocklists, structural checks, and score
gates to show that no high-confidence replacement candidates remain in the
checked public surfaces.

## Review Categories

| Category                      | Count | Primary action                                                                 |
| ----------------------------- | ----: | ------------------------------------------------------------------------------ |
| Generated fallback vocabulary |     0 | No active row currently names unresolved generated fallback vocabulary.        |
| Native lexical review         |     0 | No active row currently names unresolved native lexical review.                |
| Script-specific review        |     0 | No current language rows are explicitly marked for script-specific cleanup.    |
| Standalone expansion          |     0 | No current language rows are explicitly marked for standalone expansion.       |
| Region terminology            |     0 | No current language rows are explicitly marked for region terminology cleanup. |
| Fused pairs                   |     0 | No current language rows are explicitly marked for fused-pair cleanup.         |
| Transliteration seeds         |     0 | Replace rough transliterated seed words with native-script terms.              |

Categories overlap. For example, a language can need both script-specific review
and generated vocabulary cleanup.

## Suggested Batch Order

1. Maintenance review for stable languages

   All 180 target languages now meet the stable-grade automated gate. Future
   reports should focus on newly reported rough terms, native-speaker feedback,
   or newly added language surfaces.

2. Regression-driven cleanup

   When a rough/generated term is found, remove it from the distributed
   codebook or generator and add an exact regression example to the audit tests.

3. Native-speaker follow-up

   Native-speaker feedback remains valuable, but it is now tracked as ongoing
   improvement work rather than a blocker for the 80% stable-grade gate.

## Promotion Rule

The working target for broad language quality is 80% or higher in
`pnpm language:quality-score`. All target languages must continue to satisfy
that gate. Before shipping language-support changes:

1. Replace every high-confidence rough/generated term found in the pass.
2. Add exact regression examples to the relevant audit test.
3. Run `pnpm language:audit`.
4. Verify all languages remain at least 80% with
   `pnpm language:quality-score -- --assert-min 80`.
