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

| Language   | Count | Source file                     |
| ---------- | ----: | ------------------------------- |
| English    |  6000 | `codebook-dist/english.json`    |
| Korean     |  5630 | `codebook-dist/korean.json`     |
| Chinese    |  5140 | `codebook-dist/chinese.json`    |
| Japanese   |  5000 | `codebook-dist/japanese.json`   |
| Spanish    |  5000 | `codebook-dist/spanish.json`    |
| French     |  5000 | `codebook-dist/french.json`     |
| German     |  5000 | `codebook-dist/german.json`     |
| Portuguese |  5000 | `codebook-dist/portuguese.json` |
| Indonesian |  5000 | `codebook-dist/indonesian.json` |

## Current Word Type Inventory

Use `node scripts/codebook-type-inventory.mjs` from the repository root to
regenerate this inventory after changing a distributed codebook.

The inventory is a maintenance heuristic, not a linguistic proof. Each entry is
counted once using this precedence:

1. Recognized compound: the word ends with a reviewed object/nature suffix for
   the language, such as `box`, `상자`, `盒`, `はこ`, or `caja`, and has a
   non-empty prefix.
2. Short standalone: English or Spanish entries of four characters or fewer,
   one-syllable Korean entries, one-character Chinese entries, or Japanese
   entries of two kana or fewer.
3. Other standalone or unclassified: entries that do not match the above
   repeatable shapes.

Current inventory:

| Language   | Type                             | Count | Share | Examples                                                             |
| ---------- | -------------------------------- | ----: | ----: | -------------------------------------------------------------------- |
| English    | Recognized compound              |  1760 | 29.3% | `Handbag`, `Dewdrop`, `Headlamp`, `Feltmat`, `Applebox`              |
| English    | Short standalone                 |   465 |  7.8% | `Dawn`, `Dune`, `Fern`, `Leaf`, `Lily`                               |
| English    | Other standalone or unclassified |  3775 | 62.9% | `Acorn`, `Alder`, `Arbor`, `Aspen`, `Aster`                          |
| Korean     | Recognized compound              |  3314 | 58.9% | `안방`, `사과상자`, `나무병`, `사과바구니`, `책받침`                 |
| Korean     | Short standalone                 |    87 |  1.5% | `빛`, `별`, `색`, `물`, `무`                                         |
| Korean     | Other standalone or unclassified |  2229 | 39.6% | `손전등`, `현관문`, `테이블`, `구두주걱`, `연필깎이`                 |
| Chinese    | Recognized compound              |  1528 | 29.7% | `苹果盒`, `苹果袋`, `苹果杯`, `青叶`, `青草`                         |
| Chinese    | Short standalone                 |   798 | 15.5% | `狮`, `声`, `米`, `麦`, `豆`                                         |
| Chinese    | Other standalone or unclassified |  2814 | 54.7% | `木杆`, `竹签`, `芦坯`, `木铲`, `青绳`                               |
| Japanese   | Recognized compound              |  1068 | 21.4% | `りんごはこ`, `りんごかご`, `りんごさら`, `りんごつぼ`, `りんごなべ` |
| Japanese   | Short standalone                 |   371 |  7.4% | `いえ`, `すき`, `かい`, `やる`, `つぎ`                               |
| Japanese   | Other standalone or unclassified |  3561 | 71.2% | `あさかけ`, `はなし`, `おもう`, `かんがえ`, `かんじ`                 |
| Spanish    | Recognized compound              |  2925 | 58.5% | `Papayatapa`, `Papayabote`, `Papayalata`, `Papayaolla`, `Papayacopa` |
| Spanish    | Short standalone                 |   280 |  5.6% | `Agua`, `Aire`, `Baul`, `Bota`, `Cafe`                               |
| Spanish    | Other standalone or unclassified |  1795 | 35.9% | `Aceite`, `Alfombra`, `Almendra`, `Arbol`, `Arbusto`                 |
| French     | Recognized compound              |  2399 | 48.0% | `Ruisseau`, `Vaisseau`, `Abricotabri`, `Acaciaabri`, `Amandeabri`    |
| French     | Short standalone                 |    51 |  1.0% | `Abri`, `Aire`, `Anis`, `Banc`, `Bois`                               |
| French     | Other standalone or unclassified |  2550 | 51.0% | `Album`, `Amande`, `Ancre`, `Aneth`, `Anneau`                        |
| German     | Recognized compound              |  3255 | 65.1% | `Sonnenhut`, `Ackerband`, `Ahornband`, `Apfelband`, `Bachband`       |
| German     | Short standalone                 |    55 |  1.1% | `Anis`, `Aue`, `Bach`, `Bank`, `Beet`                                |
| German     | Other standalone or unclassified |  1690 | 33.8% | `Acker`, `Ahorn`, `Akelei`, `Allee`, `Ampel`                         |
| Portuguese | Recognized compound              |  1424 | 28.5% | `Acaciafolha`, `Aloefolha`, `Amorafolha`, `Anilfolha`, `Arrozfolha`  |
| Portuguese | Short standalone                 |    58 |  1.2% | `Agua`, `Alho`, `Aloe`, `Anil`, `Bau`                                |
| Portuguese | Other standalone or unclassified |  3518 | 70.4% | `Acacia`, `Acucar`, `Agata`, `Alecrim`, `Algodao`                    |
| Indonesian | Recognized compound              |  4166 | 83.3% | `Akaralami`, `Alamalami`, `Anginalami`, `Awanalami`, `Bambualami`    |
| Indonesian | Short standalone                 |   144 |  2.9% | `Akar`, `Alam`, `Awan`, `Batu`, `Biji`                               |
| Indonesian | Other standalone or unclassified |   690 | 13.8% | `Angin`, `Bakul`, `Bambu`, `Bayam`, `Beras`                          |

Review implications:

- Spanish is now slightly below Korean's current recognized-compound share
  after the third standalone cleanup pass. Continue reducing fused template
  compounds in reviewed batches, but do not change indexes casually.
- Korean remains a high mixed-compound codebook. Keep reducing weak
  material/object compounds, but preserve settled everyday compounds.
- Chinese, English, and Japanese have lower recognized-compound shares, but the
  unclassified bucket still needs human review because the script intentionally
  avoids broad, risky inference.
- French is below the Korean and Spanish compound share after the first
  post-launch cleanup pass. That pass removed reviewed sensitive, abstract, and
  verb-like BIP39 seed terms, then replaced them with concrete standalone French
  nouns. Continue replacing weak fused compounds with natural French standalone
  words as review coverage grows.
- German now keeps template-style generated compounds below 70% and front-loads
  more natural landscape and plant compounds. Continue replacing weak generated
  compounds with reviewed everyday standalone nouns over time.
- Portuguese keeps a low recognized-compound share after the quality v2 cleanup,
  which removed Spanish-like entries, proper-name risks, and weak generated
  compounds. Keep it neutral and common across Lusophone regions, and do not
  raise template-compound saturation while filling future review gaps.
- Indonesian quality v7 replaces Malay-leaning `Halia` with `Jahe`, keeps
  `Pepaya` instead of `Papaya`, adds more everyday standalone nouns, and blocks
  weak fused pairings such as `Emaskuning`, `Garamwangi`, `Gulabening`,
  `Awankaleng`, `Bambubilik`, and `Tomatcawan`-style material/object
  combinations. The generator now prefers a larger adjective-composition pool
  before falling back to object pairings. The latest standalone batch is kept in
  `packages/codebook/codebook-dataset/indonesian/standalone-review-2026-05-22.md`
  and adds reviewed everyday words such as `Apel`, `Kamera`, `Kulkas`, `Meja`,
  `Pensil`, `Tenda`, and `Warung`. Continue replacing generated compounds with
  reviewed standalone Indonesian nouns as coverage grows.

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

| Candidate pattern                       | Decision                                                                             | Reason                                                                                            |
| --------------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| `basket`, `바구니`, `竹篮`, `かご`      | Accept when common, neutral, concrete, and naturally written in the target language. | The word is readable in a public place label and has low semantic risk.                           |
| `cloud`, `구름`, `云朵`, `くも`         | Accept when the meaning is broad, familiar, and not tied to a sensitive domain.      | Nature words are usually safe unless they are place names, brands, or idioms with negative force. |
| `Seoul`, `서울`, `东京`, `とうきょう`   | Reject when the word is a place name, even if ordinary users know it well.           | Ground Codes already use region labels; coordinate payload words should not add extra geography.  |
| `Poker`, `슬롯`, `彩票`, `ぱちんこ`     | Reject when tied to gambling, betting, or games of chance.                           | Codes must not create embarrassing or regulated-domain associations.                              |
| `Clinic`, `당뇨`, `药`, `ちりょう`      | Reject when medical, disease, medication, diagnosis, or treatment related.           | A medical-looking address can be alarming or inappropriate in unrelated locations.                |
| `Samsung`, `카카오`, `腾讯`, `やふおく` | Reject when a brand, platform, app, service, or product.                             | Brand terms create trademark, endorsement, and freshness problems.                                |
| `프로`, `시뮬`, `ぐぐ`, `foo`           | Reject when clipped, generated-looking, foreign, or not a stable standalone word.    | Fragment-like entries make codes look broken and reduce trust.                                    |

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
- Reject generated material/nature/object compounds such as `Ambercreel`,
  `Granitebowl`, `Cottonhamper`, `Junipercase`, and `Apricottrug` unless the
  exact word is a familiar standalone English noun.

### Korean

- Prefer complete, natural Korean nouns written in Hangul.
- Review every one-syllable entry manually unless already allowlisted.
- One-syllable entries can stay when they are familiar, neutral standalone
  nouns such as `물`, `빛`, `별`, `꽃`, `숲`, `쌀`, `밥`, `떡`, `솜`, `꿀`,
  `깨`, `벼`, `색`, `무`, `소`, `밀`, `팥`, `차`, `문`, `담`, `창`, `감`,
  `비`, `실`, `철`, `양`, `돛`, `벽`, or `탕`. Reject one-syllable entries
  that can sound like profanity, insults, clipped stems, or ambiguous
  fragments; for example, reject `잣`, `정`, `전`, `안`, `평`, and `대`.
- Prefer familiar nature, food, and household nouns such as `도토리`, `솔방울`,
  `밤송이`, `호박`, `연잎`, `나뭇잎`, `보리쌀`, `콩알`, `팥알`, `항아리`,
  `소쿠리`, `바구니`, `방석`, `돗자리`, `찻잔`, and `책갈피`.
- Allow a small reviewed set of fully settled everyday loanwords when they are
  concrete and familiar, such as `테이블`, `테이프`, `스카프`, `포스터`,
  `스티커`, `아이스크림`, `피스타치오`, `디저트`, `피아노`, `테니스`,
  `마라톤`, `콘서트`, `클래식`, `머그잔`, `프라이팬`, `시리얼`, `티슈`,
  `에코백`, `손거울`, `벽시계`, `볼펜`, `계량컵`, and `세탁바구니`.
- Allow compounds only when they are established Korean words users would
  naturally recognize, such as `종이배`, `책받침`, `나무문`, or `찻잔받침`.
  Concrete everyday objects should be preferred over generated material/object
  compounds; when replacement candidates are available, reduce
  material-plus-tool combinations in staged cleanup passes.
  Reject invented material/nature/object compounds such as `도토리토리`,
  `도토리걸이`, `토기묶음`, `자개쌀독`, `호박자`, `솔방울묶음`,
  `솔방울꾸러미`, `솔방울꼬챙이`, `연잎목판`, `대나무빗살`,
  `나무광목포`, `비단토리`, `정겨운물결`, and `호박쌀독`. Remove recurring
  material/nature root compounds when they are not settled standalone words.
  Roots that need strict cleanup include `도토리`, `솔방울`, `연잎`,
  `나뭇잎`, `조약돌`, `자갈`, `잔디`, `이끼`, `꽃잎`, `들꽃`, `갈대`,
  `버들`, `무명`, `비단`, `삼베`, `모시`, `한지`, `종이`, `나무`,
  `색종이`, `대나무`, `토기`, `청자`, `백자`, `자개`, `수정`, `구리`,
  `옥돌`, and `호박`; keep only reviewed standalone words such as `도토리`,
  `솔방울`, `연잎`, `나뭇잎`, `호박`, `대나무`, and `조약돌`. Treat
  leftover generated pairings such as `면솔방울` and `면나뭇잎` as rejected
  even when they do not start with a listed root.
- Avoid poetic adjective compounds such as `정겨운도토리`, `푸른물빛`,
  `고운나래`, `둥근보자기`, `차분한샘물`, `포근한흙담`, `은빛마당`,
  and `맑은들녘`. These read like generated slogans rather than stable
  address words.
- Keep Korean code words at five Hangul syllables or fewer unless there is a
  reviewed compatibility reason. Longer entries such as `디저트숟가락`,
  `솔방울두루마리`, and `조약돌반짇고리` make shared URLs harder to scan.
- Reject entries that look or sound like misspellings of another entry. Apply a
  pronunciation-similarity pass for common Korean confusion pairs such as
  `채/체` and `개/게`; when two entries collide, keep the more familiar and less
  ambiguous one.
- Reject uncommon `채반`/`체반` family terms outright rather than keeping one
  spelling variant.
- Reject rare or old-fashioned household terms when ordinary users are unlikely
  to recognize them, even if they are dictionary words; examples include
  `자배기`, `옹배기`, `고리짝`, `동곳`, `조롱`, `광목포`, `함지`, and `주발`.
- Reject clipped foreign stems and abbreviations such as `프로`, `시뮬`, `트레`,
  `카`, `스`, `프`, `브`, `클`, `딩`, and `팅`.
- Reject repeated-syllable forms such as `기기` or `코코` unless explicitly
  approved.
- Reject Korean place names, island names, districts, brands, and loanword
  fragments.
- Be strict with plant, herb, instrument, textile, game, and religious loanwords;
  only keep reviewed exceptions that are everyday words rather than specialist
  terms.
- Treat loanword-like style, product, software, and marketing fragments as
  rejected unless the exact word is on the reviewed everyday allowlist. Reject
  fragments such as `화이트`, `블랙`, `글로벌`, `럭셔리`, `스마트`, `디지털`,
  `그래픽`, `사운드`, and `업그레이드` when they appear in generated entries.
- Reject rare plant names and obscure loanwords such as `플록스`, and reject
  verb-derived action labels such as `섞기` unless they are established object
  nouns in everyday Korean.

### Chinese

- Review both single-character morphemes and compounds.
- Reject roots and compounds around alcohol, gambling, medicine, disease,
  religion, weapons, combat, and politics.
- Be strict with geography suffixes such as `江`, `河`, `湖`, `山`, `溪`, `湾`,
  `岭`, `园`, `港`, `塔`, `城`, and `村` when they create place-like labels.
- Reject Chinese and global brands, apps, platforms, and transliterated foreign
  product names.
- Reject generated material/object pairings such as `木小筐`, `梅小盒`,
  `竹小匣`, `棉小篮`, and `草刷` when they read like template output rather than
  stable everyday words.

### Japanese

- The distributed Japanese word set should remain kana-visible and natural.
- Prefer hiragana words that are normally acceptable in hiragana.
- Reject words normally written in katakana when hiragana looks unnatural.
- Reject common given-name and surname readings.
- Reject malformed adjective stems, clipped readings, typo-like variants, and
  adult, gambling, medical, political, religious, legal, military, violent, or
  risky terms.
- Keep Japanese entries at six kana or fewer unless a specific reviewed
  compatibility reason exists.
- Reject generated material/object compounds such as `きこつつ`,
  `かみめじるし`, `ひのきひきだし`, and `もめんこざいく`.

### Spanish

- Prefer short ASCII title-case Spanish common nouns for URL readability.
- Keep Spanish entries at twelve letters or fewer unless a reviewed
  compatibility reason exists.
- Reject fused generated material/object compounds such as `Abedulabanico`,
  `Abetocucharita`, `Albahacacordel`, and `Algodonpalillo`; Spanish code words
  should not look like template roots glued to object names.

### French

- Prefer short ASCII title-case French words for URL readability. Normalize
  accents in public code words, such as `Ecole`, `Lumiere`, and `Trefle`.
- Keep French entries at twelve letters or fewer unless a reviewed
  compatibility reason exists.
- Use the BIP39-derived seed only after filtering obvious sensitive, medical,
  violent, political, religious, and adult terms. The seed improves
  pronunciation and copying quality, but it is not a substitute for product
  review.
- Reject abstract, negative, or action-like BIP39 seed words when they feel like
  commands or error states in a public address. Reviewed examples include
  `Abdiquer`, `Anxieux`, `Censurer`, `Erreur`, `Fatal`, `Injecter`, `Morsure`,
  `Offenser`, `Suspect`, `Absence`, `Analyse`, `Impact`, `Systeme`,
  `Travail`, `Abaisser`, `Accepter`, `Arriver`, `Chercher`, `Sortir`, and
  `Terminer`.
- Prefer concrete everyday nouns such as `Amande`, `Bocal`, `Panier`,
  `Tilleul`, `Violette`, `Accordeon`, `Artichaut`, `Canape`, `Jonquille`,
  and `Toboggan`.
- Generated nature/material/object compounds may be used to preserve count, but
  they should stay below the Korean and Spanish compound share, should not
  exceed the French saturation limit enforced by `scripts/codebook-policy-audit.mjs`,
  and should be replaced over time with natural standalone French entries.
- Reject terms that are risky in a public address, including `Sexe`, `Casino`,
  `Arme`, `Guerre`, `Drogue`, `Medecin`, `Politique`, `Religion`, `Crime`,
  `Mort`, and `Violence`.
- For codebook-only French cleanup, run
  `node scripts/generate-french-support.mjs codebook-only` so localized geoint
  data and embedded region indexes do not churn when labels are unchanged.

### German

- Prefer short ASCII title-case German words for URL readability. Normalize
  public code words with German transliteration: `Ae`, `Oe`, `Ue`, and `ss`,
  such as `Kuerbis`, `Laerche`, and `Schuessel`.
- Keep German entries at twelve letters or fewer unless a reviewed
  compatibility reason exists.
- Prefer concrete everyday nouns and readable compounds such as `Acker`,
  `Apfel`, `Bach`, `Korb`, `Wiese`, `Apfelkorb`, and `Birkenbank`.
- German compounds may be used more heavily than French or Spanish because they
  are natural in German, but the generated template share must stay below the
  German saturation limit enforced by `scripts/codebook-policy-audit.mjs`.
- Reject self-duplicating or implausible generated compounds such as
  `Blattblatt`, `Feldfeld`, `Steinstein`, `Ackerfass`, `Ackerglas`,
  `Apfelpfeife`, and `Apfelsohle`.
- Reject terms that are risky or awkward in a public address, including `Sex`,
  `Casino`, `Waffe`, `Krieg`, `Droge`, `Arzt`, `Politik`, `Religion`,
  `Verbrechen`, `Tod`, `Gewalt`, `Angst`, `Fehler`, `Gefahr`, `Krankheit`,
  `Problem`, `Risiko`, `Schmerz`, `Schuld`, `Sterben`, `Toeten`, `Verbot`,
  `Verlust`, `Zwang`, and common verb-like entries such as `Arbeiten`,
  `Denken`, `Gehen`, `Machen`, `Suchen`, and `Wollen`.

### Portuguese

- Prefer short ASCII title-case Portuguese words for URL readability. Normalize
  accents in public code words, such as `Acucar`, `Arvore`, `Hortela`,
  `Joia`, and `Sao`.
- Keep Portuguese entries at twelve letters or fewer unless a reviewed
  compatibility reason exists.
- Use neutral common vocabulary that is understandable across Portuguese
  variants. Avoid relying on regional slang or highly local Brazilian/European
  forms when a common concrete noun is available.
- Prefer concrete everyday nouns and natural landscape or plant words such as
  `Acucar`, `Amendoa`, `Areia`, `Arvore`, `Avela`, `Casa`, `Cesto`, `Jardim`,
  `Pao`, and `Rio`.
- Generated nature/material/object compounds may be used to preserve count, but
  the template share must stay below the Portuguese saturation limit enforced by
  `scripts/codebook-policy-audit.mjs`.

### Indonesian

- Prefer short ASCII title-case Indonesian words for URL readability. Indonesian
  words generally do not need diacritic normalization, but keep the same
  `[A-Z][a-z]+` shape as other Latin URL codebooks.
- Use familiar neutral nouns from nature, household objects, plants, materials,
  food staples, and simple tools: `Akar`, `Bambu`, `Beras`, `Bunga`, `Daun`,
  `Jahe`, `Kelapa`, `Langit`, `Laut`, `Pelangi`, `Rumah`, `Sawah`, `Sungai`.
- Add new standalone candidates to the dated review files under
  `packages/codebook/codebook-dataset/indonesian/`. The generator reads those
  reviewed files directly, so the review list is the source of truth for
  expansion batches.
- Prefer common Indonesian forms over regional or cross-language variants:
  `Jahe` over `Halia`, and `Pepaya` over `Papaya`.
- Reject sensitive or low-trust terms such as gambling, drugs, weapons, sex,
  debt, illness, hate, corruption, and overt politics.
- Fused compounds are a fallback for filling the 5,000-word URL set. Keep them
  short, concrete, and pronounceable; reject self-duplication and implausible
  object pairings such as sea/sugar/salt combined with tableware or clothing.
  Also reject weak noun-adjective pairings that read like accidental fused
  phrases, for example `Garamwangi`, `Gulabening`, `Kertasmanis`,
  `Pancisegar`, and `Topijernih`.
- For Indonesian, prefer adjective-style generated fallbacks over object-pair
  fallbacks when a reviewed standalone word is not available. Block
  container/object suffixes that repeatedly create weak public URL words, such
  as `benda`, `bilik`, `cawan`, `dulang`, and `guci`.
- Region labels preserve proper names where possible. Localize stable terrain
  descriptors for readability, for example `Sea` -> `Laut`, `Ocean` ->
  `Samudra`, `Crater` -> `Kawah`, and `Mons` -> `Gunung`.
- Reject self-duplicating or implausible generated compounds such as
  `Akarakar`, `Akarawan`, `Gelasakar`, `Lautdulang`, `Lautbening`,
  `Ombakbenda`, `Garambening`, `Gulabening`, `Pancisegar`, `Topijernih`, and
  `Kertasmanis`. Also reject reviewed Indonesian failures such as
  `Emaskuning`, `Bambubilik`, `Kerangkuning`, `Hutanhalus`, `Rotankuning`,
  `Palaguci`, and `Tomatcawan`.
- Reject terms that are risky or awkward in a public address, including `Judi`,
  `Narkoba`, `Senjata`, `Seks`, `Politik`, `Korupsi`, `Racun`, `Mati`,
  `Sakit`, `Utang`, `Benci`, `Bohong`, `Jahat`, `Kalah`, and `Salah`.

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
