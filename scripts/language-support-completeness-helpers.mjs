import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, test } from "node:test";

export const root = join(dirname(fileURLToPath(import.meta.url)), "..");

export const readText = (relativePath) =>
  readFileSync(join(root, relativePath), "utf8");

export const flattenMessages = (messages, prefix = "", output = {}) => {
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

export const parseSupportedLanguages = () => {
  const source = readText("apps/api-ground-codes/src/endpoints/v1/language.ts");
  const match = source.match(/supportedLanguages\s*=\s*\[([\s\S]*?)\]/);
  assert.ok(match, "supportedLanguages array not found");
  return [...match[1].matchAll(/"([^"]+)"/g)].map((item) => item[1]);
};

export const parseWordsetCounts = () => {
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

export const parseEnglishRegionFallbackLanguages = () => {
  const source = readText("packages/ground-codes/src/region-languages.ts");
  const match = source.match(
    /englishRegionFallbackLanguages\s*=\s*new Set(?:<[^>]+>)?\(\[([\s\S]*?)\]\)/,
  );
  assert.ok(match, "englishRegionFallbackLanguages set not found");
  return new Set([...match[1].matchAll(/"([^"]+)"/g)].map((item) => item[1]));
};

export const languageSuffix = (language) =>
  language === "english" ? "" : `-${language}`;
export const generatedLanguagePrefixPattern =
  /^[A-Z][a-z]{1,12}(?:Ala|Bela|Dara|Branch)[A-Z]/;
export const generatedEnglishPathScaffoldPattern =
  /[A-Z][a-z]{3,8}[A-Z][A-Za-z]*(?:Water|Home|River|Hill|Flower|Tea|Book|Lamp|Bread|Rice|Apple|Banana|Date|Olive|Tree|Market|Road|Bridge|Place|Door|Window|School|Hospital|Forest|Valley|Island|Tower|Garden|Field|Leaf|Soil|Stone|Sand|Lake|Pond|Sea|Shore|Boat|Train|Bus|Car|Square|Cup|Bowl|Plate|Spoon|Knife|Basket|Mat|Rope|Cloth|Cotton|Silk|Iron|Gold|Silver|Glass|Clay|Tile|Jar|Mortar|Loom|Shell|Umbrella|Bell|Bed|Bench|Ladder|Yard|Path|Seed|Twig|Moss|Reed|Linen|Map|Light|Shade|City|Village|Street|Station|Hotel|Bank|Doctor|Teacher|Newspaper|Magazine|Story|Song|Drum|Flute|Piano|Statue|Brick|Cement|Town|Shop|Milk|Honey|Mango|Lemon|Harbor|Gate|Letter|Picture|Museum|Bakery|Kitchen|Wood|Cat|Dog|Fish|Bird|Coffee|Pepper|Onion|Garlic|Bamboo|Soap|Clock|Family|Friend|Child|Farmer|Well|Cave|Plain|Grass|Paper)[A-Za-z]*/;
export const slug = (value) =>
  String(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .replace(/^x+/, "") || "word";
export const title = (value) =>
  `${value[0]?.toUpperCase() ?? ""}${value.slice(1)}`;
export const generatedLabelPrefixes = [
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
export const generatedEnglishSeeds = [
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
export const generatedLanguageSuffixes = {
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
export const isGeneratedSlugScaffold = (language, index, word) => {
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
export const addressingGapLanguages = [
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
