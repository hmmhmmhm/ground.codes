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
| french | 5000 | stable | Keep concrete French nouns ahead of BIP39-derived abstract candidates. |
| german | 5000 | stable | Keep compound saturation bounded and prefer natural German compounds. |
| portuguese | 5000 | stable | Keep Lusophone-neutral nouns and avoid Spanish-looking spellings. |
| indonesian | 5000 | stable | Prefer common Indonesian forms over Malay-leaning or weak fused compounds. |
| thai | 5000 | stable | Grow reviewed Thai-script standalone nouns before adding templates. |
| vietnamese | 5000 | stable | Keep native diacritics and avoid broad color, mood, and place templates. |
| hindi | 5000 | active cleanup | Remove broad descriptor compounds, obscure standalone entries, mixed-script region labels, and URL separator leftovers. |

Review checklist:

1. Every public language must have a distributed codebook, earth region labels,
   moon labels, Mars labels, API support, web locale mapping, and production
   smoke coverage.
2. A language marked `active cleanup` can ship, but every new quality pass must
   add exact regression examples to the audit tests.
3. Do not raise a language to `stable` until the latest sub-agent review finds
   no high-confidence removal candidates.
