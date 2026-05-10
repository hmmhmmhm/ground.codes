# Region Language Audit - 2026-05-10

This audit checked localized Earth region names after reports that Korean output
showed `개그투리` and `Portaux-Francais`.

## Findings

- `개그투리` came from the GeoNames base entry `Gaigeturi`
  (`33.46444, 126.31833`, GeoNames ID `1847050`). The source entry lists
  `Aewol` / `Aewol-li` as alternate names, so the Korean label was corrected to
  `애월`.
- `Portaux-Francais` (`-49.34916, 70.21937`, GeoNames ID `1546102`) had already
  been translated as `포르토프랑세` in the Korean pre-translation file, but the
  generated `region-2-korean.json` still contained the base English fallback.
- Chinese `region-2` still contained `FontaineFrancaise`; it was corrected to
  `方丹弗朗塞斯`.
- Japanese `region-2` had eight Georgian names with leftover Latin `q` fallback
  fragments. They were replaced with katakana labels.

## Remaining Scope

The current localized datasets still contain broader mixed-script fallback
classes:

| Dataset                  |    Rows | Names with Latin letters |
| ------------------------ | ------: | -----------------------: |
| `region-2-korean.json`   | 167,814 |                      920 |
| `region-2-chinese.json`  | 168,666 |                   55,087 |
| `region-2-japanese.json` | 173,528 |                        0 |
| `region-3-korean.json`   |  53,192 |                   39,211 |
| `region-3-chinese.json`  |  53,192 |                   39,236 |
| `region-3-japanese.json` |  53,192 |                        0 |

For Korean and Chinese Earth `region-2`, most remaining Latin-script rows are
not one-off typos but untranslated fallback names. For Korean and Chinese
`region-3`, most remaining Latin-script rows are Antarctic or marine feature
names that have not yet gone through a full localized naming pass.

## Regression Coverage

`packages/ground-codes/test/region-3-dataset.test.ts` now checks that the
reviewed Earth region corrections stay translated and that Japanese Earth
region labels do not contain Latin fallback fragments.
