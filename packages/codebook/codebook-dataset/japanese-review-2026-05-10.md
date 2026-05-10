# Japanese codebook review - 2026-05-10

The first Japanese codebook draft used deterministic prefix/suffix combinations.
That made the entries unique and readable, but it produced many uncommon compound-like
strings such as repeated season or nature prefixes.

The revised set uses frequency-guided candidates, converts accepted entries to
hiragana readings for reliable language detection, and keeps the distributed set
to 5,000 entries instead of forcing a generated 6,000-word grid. The curation filters remove:

- generated prefix/suffix grid patterns
- Latin letters, digits, punctuation, kanji-only forms, and katakana-only loanwords
- particles, auxiliary fragments, truncated conjugations, and function-only forms
- proper nouns, place names, and country names detected during review
- sensitive, sexual, insulting, violent, gambling, political, medical, and religious terms found during review

An additional review pass removed urgent and high-risk items found in the
5,000-word draft, including sexual slang, self-harm and weapon terms, gambling
terms, body-shaming terms, disease and injury terms, and name/place-like labels.
The test suite now keeps an explicit block list for those reviewed removals.

Temporary curation tooling used `wordfreq`, `fugashi`, and `unidic-lite` outside
the package dependency graph. The distributed package only ships the reviewed JSON
word set.
