import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, test } from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const readText = (relativePath) =>
  readFileSync(join(root, relativePath), "utf8");

const flattenMessages = (messages, prefix = "", output = {}) => {
  for (const [key, value] of Object.entries(messages)) {
    const messageKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      flattenMessages(value, messageKey, output);
    } else {
      output[messageKey] = value;
    }
  }
  return output;
};

const parseSupportedLanguages = () => {
  const source = readText("apps/api-ground-codes/src/endpoints/v1/language.ts");
  const match = source.match(/supportedLanguages\s*=\s*\[([\s\S]*?)\]/);
  assert.ok(match, "supportedLanguages array not found");
  return [...match[1].matchAll(/"([^"]+)"/g)].map((item) => item[1]);
};

const parseWordsetCounts = () => {
  const source = readText("packages/ground-codes/src/wordset-language.ts");
  const match = source.match(/wordSetBaseCount[^=]*=\s*\{([\s\S]*?)\}/);
  assert.ok(match, "wordSetBaseCount object not found");
  return Object.fromEntries(
    [...match[1].matchAll(/(\w+):\s*(\d+)/g)].map(([, language, count]) => [
      language,
      Number(count),
    ]),
  );
};

const parseEnglishRegionFallbackLanguages = () => {
  const source = readText("packages/ground-codes/src/region.ts");
  const match = source.match(
    /englishRegionFallbackLanguages\s*=\s*new Set(?:<[^>]+>)?\(\[([\s\S]*?)\]\)/,
  );
  assert.ok(match, "englishRegionFallbackLanguages set not found");
  return new Set([...match[1].matchAll(/"([^"]+)"/g)].map((item) => item[1]));
};

const languageSuffix = (language) =>
  language === "english" ? "" : `-${language}`;
const generatedLanguagePrefixPattern =
  /^[A-Z][a-z]{1,12}(?:Ala|Bela|Dara|Branch)[A-Z]/;
const generatedEnglishPathScaffoldPattern =
  /[A-Z][a-z]{3,8}[A-Z][A-Za-z]*(?:Water|Home|River|Hill|Flower|Tea|Book|Lamp|Bread|Rice|Apple|Banana|Date|Olive|Tree|Market|Road|Bridge|Place|Door|Window|School|Hospital|Forest|Valley|Island|Tower|Garden|Field|Leaf|Soil|Stone|Sand|Lake|Pond|Sea|Shore|Boat|Train|Bus|Car|Square|Cup|Bowl|Plate|Spoon|Knife|Basket|Mat|Rope|Cloth|Cotton|Silk|Iron|Gold|Silver|Glass|Clay|Tile|Jar|Mortar|Loom|Shell|Umbrella|Bell|Bed|Bench|Ladder|Yard|Path|Seed|Twig|Moss|Reed|Linen|Map|Light|Shade|City|Village|Street|Station|Hotel|Bank|Doctor|Teacher|Newspaper|Magazine|Story|Song|Drum|Flute|Piano|Statue|Brick|Cement|Town|Shop|Milk|Honey|Mango|Lemon|Harbor|Gate|Letter|Picture|Museum|Bakery|Kitchen|Wood|Cat|Dog|Fish|Bird|Coffee|Pepper|Onion|Garlic|Bamboo|Soap|Clock|Family|Friend|Child|Farmer|Well|Cave|Plain|Grass|Paper)[A-Za-z]*/;
const slug = (value) =>
  String(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .replace(/^x+/, "") || "word";
const title = (value) => `${value[0]?.toUpperCase() ?? ""}${value.slice(1)}`;
const generatedLabelPrefixes = [
  "Ala",
  "Bela",
  "Dara",
  "Fara",
  "Gala",
  "Hama",
  "Kala",
  "Luma",
  "Mara",
  "Nava",
  "Pana",
  "Rima",
  "Sala",
  "Tala",
  "Vara",
  "Zara",
  "Doro",
  "Fino",
  "Goro",
  "Lino",
  "Miko",
  "Noro",
  "Piko",
  "Rano",
  "Siko",
  "Toro",
  "Viko",
  "Zano",
  "Adir",
  "Banu",
  "Ceri",
  "Dima",
  "Elun",
  "Feni",
  "Gari",
  "Hani",
  "Irun",
  "Jora",
  "Kemi",
  "Lani",
];
const generatedEnglishSeeds = [
  "water",
  "home",
  "river",
  "hill",
  "flower",
  "tea",
  "book",
  "lamp",
  "bread",
  "rice",
  "apple",
  "banana",
  "date",
  "olive",
  "tree",
  "market",
  "road",
  "bridge",
  "place",
  "door",
  "window",
  "school",
  "hospital",
  "forest",
  "valley",
  "island",
  "tower",
  "garden",
  "field",
  "leaf",
  "soil",
  "stone",
  "sand",
  "lake",
  "pond",
  "sea",
  "shore",
  "boat",
  "train",
  "bus",
  "car",
  "square",
  "cup",
  "bowl",
  "plate",
  "spoon",
  "knife",
  "basket",
  "mat",
  "rope",
  "cloth",
  "cotton",
  "silk",
  "iron",
  "gold",
  "silver",
  "glass",
  "clay",
  "tile",
  "jar",
  "mortar",
  "loom",
  "shell",
  "umbrella",
  "bell",
  "bed",
  "bench",
  "ladder",
  "yard",
  "path",
  "seed",
  "twig",
  "moss",
  "reed",
  "linen",
  "map",
  "light",
  "shade",
  "city",
  "village",
  "street",
  "station",
  "hotel",
  "bank",
  "doctor",
  "teacher",
  "newspaper",
  "magazine",
  "story",
  "song",
  "drum",
  "flute",
  "piano",
  "statue",
  "brick",
  "cement",
].map(title);
const generatedLanguageSuffixes = {
  acholi: "ach",
  aymara: "ayma",
  bambara: "bmb",
  chichewa: "chw",
  dagbani: "dagu",
  dinka: "dnk",
  guarani: "gnr",
  kanuri: "knr",
  kinyarwanda: "rwanda",
  kirundi: "rnd",
  kongo: "kng",
  luganda: "ganda",
  malagasy: "gasy",
  moore: "mre",
  ndebele: "bele",
  quechua: "qch",
  sango: "sng",
  songhay: "hay",
  tamasheq: "tama",
  tok_pisin: "tpi",
  zarma: "zarma",
};
const isGeneratedSlugScaffold = (language, index, word) => {
  const languageSlug = slug(language).slice(0, 6);
  const prefix = title(languageSlug);
  const generatedSuffix = generatedLanguageSuffixes[language];
  return (
    (index >= 500 &&
      generatedLabelPrefixes.some((label) =>
        word.startsWith(`${prefix}${label}`),
      )) ||
    (index >= 300 &&
      generatedEnglishSeeds.some(
        (seed) => word.startsWith(seed) && word.endsWith(languageSlug),
      )) ||
    (generatedSuffix !== undefined &&
      index >= 280 &&
      generatedEnglishSeeds.some(
        (seed) => word.startsWith(seed) && word.endsWith(generatedSuffix),
      ))
  );
};
const addressingGapLanguages = [
  "swahili",
  "filipino",
  "hausa",
  "bengali",
  "urdu",
  "amharic",
  "burmese",
  "khmer",
  "nepali",
  "somali",
  "pashto",
  "lingala",
  "mongolian",
  "lao",
  "malagasy",
  "dari",
  "oromo",
  "chichewa",
  "tigrinya",
  "bambara",
  "fula",
  "wolof",
  "sinhala",
  "tamil",
  "kinyarwanda",
  "kirundi",
  "krio",
  "ewe",
  "fon",
  "sango",
  "moore",
  "kanuri",
  "quechua",
  "aymara",
  "guarani",
  "kongo",
  "zarma",
  "tamasheq",
  "songhay",
  "twi",
  "dagbani",
  "luganda",
  "acholi",
  "dinka",
  "nuer",
  "shona",
  "ndebele",
  "tok_pisin",
];

describe("language support completeness", () => {
  const languages = parseSupportedLanguages();

  test("includes the address-gap expansion languages", () => {
    assert.deepEqual(
      addressingGapLanguages.filter(
        (language) => !languages.includes(language),
      ),
      [],
    );
  });

  test("ships codebook and region assets for every supported language", () => {
    const counts = parseWordsetCounts();
    const englishRegionFallbackLanguages =
      parseEnglishRegionFallbackLanguages();
    const englishCodebook = new Set(
      JSON.parse(
        readFileSync(
          join(root, "packages/codebook/codebook-dist/english.json"),
          "utf8",
        ),
      ).map((word) => word.toLowerCase()),
    );

    for (const language of languages) {
      const codebookPath = join(
        root,
        "packages/codebook/codebook-dist",
        `${language}.json`,
      );
      assert.equal(existsSync(codebookPath), true, `${language} codebook`);

      const codebook = JSON.parse(readFileSync(codebookPath, "utf8"));
      assert.equal(codebook.length, counts[language], `${language} count`);
      assert.equal(
        new Set(codebook).size,
        codebook.length,
        `${language} unique codebook`,
      );

      const unsafeWords = codebook.filter(
        (word) => typeof word !== "string" || !/^[^\s/#?]+$/.test(word),
      );
      assert.deepEqual(
        unsafeWords.slice(0, 10),
        [],
        `${language} URL-safe codebook words`,
      );

      if (language !== "english") {
        const englishOverlap = codebook.filter((word) =>
          englishCodebook.has(word.toLowerCase()),
        );
        assert.deepEqual(
          englishOverlap,
          [],
          `${language} should not reuse exact English codebook words: ${englishOverlap
            .slice(0, 10)
            .join(", ")}`,
        );
      }

      const generatedLanguagePrefixScaffolds = codebook.filter((word) =>
        generatedLanguagePrefixPattern.test(word),
      );
      assert.deepEqual(
        generatedLanguagePrefixScaffolds,
        [],
        `${language} generated language-prefix scaffolds`,
      );

      const languageSlug = slug(language).slice(0, 6);
      const generatedEnglishPathScaffolds = codebook.filter(
        (word, index) =>
          index >= 700 &&
          word.toLowerCase().includes(languageSlug) &&
          generatedEnglishPathScaffoldPattern.test(word),
      );
      assert.deepEqual(
        generatedEnglishPathScaffolds,
        [],
        `${language} generated English path scaffolds`,
      );

      const generatedSlugScaffolds = codebook.filter((word, index) =>
        isGeneratedSlugScaffold(language, index, word),
      );
      assert.deepEqual(
        generatedSlugScaffolds,
        [],
        `${language} generated language-slug scaffolds`,
      );

      const suffix = englishRegionFallbackLanguages.has(language)
        ? ""
        : languageSuffix(language);
      for (const dataset of [
        `region-2${suffix}.json`,
        `region-3${suffix}.json`,
        `region-2-moon${suffix}.json`,
        `region-2-mars${suffix}.json`,
        `region-3-mars${suffix}.json`,
      ]) {
        assert.equal(
          existsSync(join(root, "packages/geoint/region-dist", dataset)),
          true,
          `${language} ${dataset}`,
        );
      }
    }
  });

  test("covers every API language in production smoke", () => {
    const smokeSource = readText("scripts/production-smoke.mjs");
    const smokeLanguages = new Set(
      [...smokeSource.matchAll(/language:\s*"([^"]+)"/g)].map(
        (item) => item[1],
      ),
    );

    assert.deepEqual(
      languages.filter((language) => !smokeLanguages.has(language)),
      [],
    );
  });

  test("documents quality status for every distributed language", () => {
    const doc = readText("packages/codebook/LANGUAGE_QUALITY.md");

    for (const language of languages) {
      assert.match(doc, new RegExp(`\\|\\s+${language}\\s+\\|`));
    }
  });

  test("keeps reviewed UI strings free of scaffold markers", () => {
    const reviewedLocales = [
      "aa",
      "ab",
      "ach",
      "ae",
      "af",
      "ak",
      "am",
      "an",
      "ar",
      "as",
      "av",
      "ay",
      "az",
      "ba",
      "be",
      "bg",
      "bi",
      "bm",
      "bn",
      "br",
      "bs",
      "ca",
      "ce",
      "ch",
      "cn",
      "co",
      "cr",
      "cs",
      "cu",
      "cv",
      "da",
      "dag",
      "de",
      "din",
      "dje",
      "dv",
      "dz",
      "ee",
      "el",
      "eo",
      "es",
      "et",
      "eu",
      "fa",
      "ff",
      "fi",
      "fil",
      "fj",
      "fo",
      "fon",
      "fr",
      "fy",
      "ga",
      "gd",
      "gl",
      "gn",
      "gu",
      "gv",
      "ha",
      "he",
      "hi",
      "ho",
      "hr",
      "ht",
      "hu",
      "hy",
      "hz",
      "ia",
      "id",
      "ie",
      "ig",
      "ii",
      "ik",
      "io",
      "is",
      "it",
      "iu",
      "ja",
      "jv",
      "ka",
      "kg",
      "ki",
      "kj",
      "kk",
      "kl",
      "km",
      "kn",
      "ko",
      "kr",
      "kri",
      "ks",
      "ku",
      "kv",
      "kw",
      "ky",
      "la",
      "lb",
      "lg",
      "li",
      "ln",
      "lo",
      "lt",
      "lu",
      "lv",
      "mg",
      "mh",
      "mi",
      "mk",
      "ml",
      "mn",
      "mos",
      "mr",
      "ms",
      "mt",
      "my",
      "na",
      "nb",
      "nde",
      "ne",
      "ng",
      "nl",
      "nn",
      "no",
      "nr",
      "nus",
      "nv",
      "ny",
      "oc",
      "oj",
      "om",
      "or",
      "os",
      "pa",
      "pi",
      "pl",
      "prs",
      "ps",
      "pt",
      "qu",
      "rm",
      "rn",
      "ro",
      "ru",
      "rw",
      "sa",
      "sc",
      "sd",
      "se",
      "sg",
      "si",
      "sk",
      "sl",
      "sm",
      "sn",
      "so",
      "son",
      "sq",
      "sr",
      "ss",
      "st",
      "su",
      "sv",
      "sw",
      "ta",
      "te",
      "th",
      "ti",
      "tmh",
      "tpi",
      "tr",
      "tt",
      "tw",
      "ty",
      "uk",
      "ur",
      "vi",
      "wo",
      "yo",
      "yue",
    ];

    const englishPlaceTypes = JSON.parse(
      readText("apps/web/messages/en/placeTypes.json"),
    );
    const englishMessages = flattenMessages(
      JSON.parse(readText("apps/web/messages/en/index.json")),
    );
    const allowedExactEnglishMessages = new Set([
      "common.groundCode",
      "map.bodies.mars",
      "map.groundCode",
      "map.search.groundCodesHeading",
    ]);
    const stablePlaceTypeLocales = new Set([
      "aa",
      "ab",
      "ach",
      "ae",
      "af",
      "ak",
      "am",
      "an",
      "ar",
      "as",
      "av",
      "ay",
      "az",
      "ba",
      "be",
      "bg",
      "bi",
      "bm",
      "bn",
      "br",
      "bs",
      "ca",
      "ce",
      "ch",
      "cn",
      "co",
      "cr",
      "cs",
      "cu",
      "cv",
      "da",
      "dag",
      "de",
      "din",
      "dje",
      "dv",
      "dz",
      "ee",
      "el",
      "eo",
      "es",
      "et",
      "eu",
      "fa",
      "ff",
      "fi",
      "fil",
      "fj",
      "fo",
      "fon",
      "fr",
      "fy",
      "ga",
      "gd",
      "gl",
      "gn",
      "gu",
      "gv",
      "ha",
      "he",
      "hi",
      "ho",
      "hr",
      "ht",
      "hu",
      "hy",
      "hz",
      "ia",
      "id",
      "ie",
      "ig",
      "ii",
      "ik",
      "io",
      "is",
      "it",
      "iu",
      "ja",
      "jv",
      "ka",
      "kg",
      "ki",
      "kj",
      "kk",
      "kl",
      "km",
      "kn",
      "ko",
      "kr",
      "kri",
      "ks",
      "ku",
      "kv",
      "kw",
      "ky",
      "la",
      "lb",
      "lg",
      "li",
      "ln",
      "lo",
      "lt",
      "lu",
      "lv",
      "mg",
      "mh",
      "mi",
      "mk",
      "ml",
      "mn",
      "mos",
      "mr",
      "ms",
      "mt",
      "my",
      "na",
      "nb",
      "nde",
      "ne",
      "ng",
      "nl",
      "nn",
      "no",
      "nr",
      "nus",
      "nv",
      "ny",
      "oc",
      "oj",
      "om",
      "or",
      "os",
      "pa",
      "pi",
      "pl",
      "prs",
      "ps",
      "pt",
      "qu",
      "rm",
      "rn",
      "ro",
      "ru",
      "rw",
      "sa",
      "sc",
      "sd",
      "se",
      "sg",
      "si",
      "sk",
      "sl",
      "sm",
      "sn",
      "so",
      "son",
      "sq",
      "sr",
      "ss",
      "st",
      "su",
      "sv",
      "sw",
      "ta",
      "te",
      "th",
      "ti",
      "tmh",
      "tpi",
      "tr",
      "tt",
      "tw",
      "ty",
      "uk",
      "ur",
      "vi",
      "wo",
      "yo",
      "yue",
    ]);

    for (const locale of reviewedLocales) {
      const messages = readText(`apps/web/messages/${locale}/index.json`);
      const placeTypes = readText(
        `apps/web/messages/${locale}/placeTypes.json`,
      );
      const languageName = JSON.parse(messages).common?.languageName;
      const localizedMessages = flattenMessages(JSON.parse(messages));
      const localizedPlaceTypes = JSON.parse(placeTypes);
      const scaffoldPrefixes = [languageName, locale]
        .filter(Boolean)
        .map((prefix) => `${prefix}: `);

      assert.equal(messages.includes(" · "), false, locale);
      assert.equal(placeTypes.includes(" · "), false, locale);
      for (const prefix of scaffoldPrefixes) {
        assert.equal(
          messages.includes(prefix),
          false,
          `${locale} messages ${prefix}`,
        );
        assert.equal(
          placeTypes.includes(prefix),
          false,
          `${locale} placeTypes ${prefix}`,
        );
      }
      for (const [key, englishLabel] of Object.entries(englishPlaceTypes)) {
        assert.notEqual(
          localizedPlaceTypes[key],
          englishLabel,
          `${locale} placeTypes ${key}`,
        );
        if (stablePlaceTypeLocales.has(locale)) {
          assert.equal(
            localizedPlaceTypes[key].startsWith(`${englishLabel} `) ||
              localizedPlaceTypes[key].endsWith(` ${englishLabel}`),
            false,
            `${locale} placeTypes ${key} should not wrap English label scaffold`,
          );
        }
      }
      assert.equal(
        /^RV Park\b/.test(localizedPlaceTypes.rv_park ?? ""),
        false,
        `${locale} placeTypes rv_park should not expose RV Park scaffold`,
      );
      for (const [key, englishLabel] of Object.entries(englishMessages)) {
        if (allowedExactEnglishMessages.has(key)) {
          continue;
        }
        assert.notEqual(
          localizedMessages[key],
          englishLabel,
          `${locale} messages ${key}`,
        );
        assert.equal(
          localizedMessages[key].startsWith(`${englishLabel} `) ||
            localizedMessages[key].endsWith(` ${englishLabel}`),
          false,
          `${locale} messages ${key} should not wrap English label scaffold`,
        );
      }
    }
  });

  test("keeps region and address-gap codebook quality audits in the scripted QA set", () => {
    const qaScript = readText("package.json");
    const scripts = readText("scripts/address-gap-codebook-quality.test.mjs");

    assert.match(qaScript, /region-label-quality\.test\.mjs/);
    assert.match(qaScript, /scripts\/\*\.test\.mjs/);
    assert.match(scripts, /mechanical two-word fusions/);
  });
});
