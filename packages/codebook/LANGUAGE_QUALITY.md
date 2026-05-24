# Language Quality Status

This file tracks the current review state for each public codebook language.
`CODEBOOK_GUIDE.md` remains the policy source of truth; this file is the
operational status board for follow-up passes.

| Language | Count | Status | Current focus |
| -------- | ----: | ------ | ------------- |
| english | 6000 | stable | Keep ASCII-only URL labels and review newly reported obscure or brand-like words. |
| korean | 5630 | stable | Continue replacing weak fused compounds and pronunciation-confusable entries. |
| chinese | 5140 | stable | Keep simplified Chinese entries short and avoid generated material/object grids. |
| japanese | 5000 | stable | Keep kana-visible entries natural and avoid Latin fallback fragments. |
| spanish | 5000 | stable | Continue lowering fused template saturation with everyday standalone nouns. |
| french | 5000 | stable | Keep short reviewed French nouns ahead of BIP39-derived abstract candidates. |
| german | 5000 | stable | Keep reviewed standalone German nouns ahead of generated compound fallbacks. |
| portuguese | 5000 | stable | Keep Lusophone-neutral short nouns ahead of generated fallback compounds. |
| indonesian | 5000 | stable | Keep reviewed standalone growth ahead of generated Indonesian fallback compounds. |
| thai | 5000 | stable | Grow reviewed Thai-script standalone nouns before adding templates. |
| vietnamese | 5000 | stable | Keep native diacritics and avoid broad color, mood, and place templates. |
| hindi | 5000 | active cleanup | Remove broad descriptor compounds, obscure standalone entries, mixed-script region labels, and URL separator leftovers. |
| arabic | 5000 | active cleanup | Grow reviewed standalone nouns and keep abstract mood/value compounds out of public codes. |
| russian | 5000 | active cleanup | V3 keeps at least 250 short standalone nouns, lowers recognized generated compounds below 3,000, and blocks obscure or coined-looking leftovers. |

Review checklist:

1. Every public language must have a distributed codebook, earth region labels,
   moon labels, Mars labels, API support, web locale mapping, and production
   smoke coverage.
2. A language marked `active cleanup` can ship, but every new quality pass must
   add exact regression examples to the audit tests.
3. Do not raise a language to `stable` until the latest sub-agent review finds
   no high-confidence removal candidates.
