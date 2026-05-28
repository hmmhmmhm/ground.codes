import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, test } from "node:test";

const languages = [
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

const readCodebook = (language) =>
  JSON.parse(
    readFileSync(
      new URL(
        `../packages/codebook/codebook-dist/${language}.json`,
        import.meta.url,
      ),
      "utf8",
    ),
  );

const lexicalizedFusions = {
  amharic: new Set(["ዳቦቤት"]),
  burmese: new Set(["စေိကကအန"]),
};

const frontLoadedExpectedWords = {
  mongolian: ["Хаалга", "Цонх", "Найз", "Сургууль", "Сэтгүүл"],
  lao: ["ປະຕູ", "ປ່ອງຢ້ຽມ", "ເພື່ອນ", "ໂຮງຮຽນ", "ວາລະສານ"],
  malagasy: ["Varavarana", "Namana", "Ankizy", "Sekoly", "Gazety"],
  dari: ["دروازه", "پنجره", "دوست", "مکتب", "روزنامه"],
  oromo: ["Balbala", "Foddaa", "Hiriyyaa", "Manabarumsaa", "Gaazexaa"],
  chichewa: ["Khomo", "Zenera", "Bwenzi", "Sukulu", "Magazini"],
  tigrinya: ["ደገ", "መስኮት", "ዓርኪ", "ቤትትምህርቲ", "መጽሔት"],
  bambara: ["Tabali", "Sigilan", "Terike", "Kalan", "Gazeti"],
  fula: ["Dammugal", "Henorde", "Gido", "Lekkol", "Jaarol"],
  wolof: ["Bunt", "Palanteer", "Xarit", "Daara", "Surnal"],
  sinhala: ["දොර", "ජනේලය", "මිතුරා", "පාසල", "සඟරාව"],
  tamil: ["கதவு", "சாளரம்", "நண்பர்", "பள்ளி", "இதழ்"],
  kinyarwanda: ["Urugi", "Idirishya", "Ishuri", "Ibitaro", "Uruzitiro"],
  kirundi: ["Urugi", "Idirisha", "Ishure", "Ibitaro", "Uruzitiro"],
  krio: ["Doa", "Windo", "Skul", "Ospitul", "Steshon"],
  ewe: ["Agbo", "Safui", "Sukuu", "Dowofe", "Atikpo"],
  fon: ["Xota", "Safa", "Sukulu", "Dokita", "Atin"],
  sango: ["Bango", "Tabulu", "Ecole", "Hopital", "Lopango"],
  moore: ["Daare", "Taabala", "Karensa", "Oteli", "Weoogo"],
  kanuri: ["Kofa", "Tagar", "Makaranta", "Asibiti", "Katanga"],
  quechua: ["Punku", "Qhawana", "Yachaywasi", "Hampinawasi", "Kancha"],
  aymara: ["Punku", "Tiji", "Yatiqana", "Qullanauta", "Uywana"],
  guarani: ["Oke", "Oveta", "Mboehao", "Tasyo", "Kora"],
  kongo: ["Kielo", "Luketo", "Kalasi", "Lupitalu", "Lupangu"],
  zarma: ["Mey", "Feneti", "Lekkol", "Fajikay", "Koyra"],
  tamasheq: ["Taggurt", "Taqmirt", "Agharbaz", "Asbitar", "Tenere"],
  songhay: ["Mey", "Feneti", "Lekkol", "Fajikay", "Koyra"],
  twi: ["Pon", "Mfensere", "Sukuu", "Ayaresabea", "Kwae"],
  dagbani: ["Dua", "Maje", "Sakuli", "Asibiti", "Tinga"],
  luganda: ["Oluggi", "Eddirisa", "Essomero", "Eddwaliro", "Ekibira"],
  acholi: ["Doggola", "Dirica", "Gangkwan", "Ospital", "Lutino"],
  dinka: ["Adoor", "Thual", "Panakim", "Wut", "Meth"],
  nuer: ["Dhor", "Thok", "Pankim", "Cieng", "Gat"],
  shona: ["Gonhi", "Hwindo", "Chikoro", "Chipatara", "Sango"],
  ndebele: ["Umnyango", "Iwindi", "Isikolo", "Isibhedlela", "Ihlathi"],
  tok_pisin: ["Doa", "Windua", "Skul", "Haussik", "Pikinini"],
};

const oldSyllableFallbackExamples = {
  mongolian: ["мана", "мала"],
  lao: ["ມານາ", "ມາລາ"],
  malagasy: ["Mana", "Mala"],
  dari: ["مانا", "مالا"],
  chichewa: ["Mana", "Mala"],
  tigrinya: ["ምአንአ", "ምአልአ"],
  sinhala: ["මඅනඅ", "මඅලඅ"],
  tamil: ["மஅநஅ", "மஅலஅ"],
};

const strippedTransliterationFragments = [
  "Dgtr",
  "Dgtrso",
  "Knnin",
  "Ktn",
  "Jooorgal",
  "Lamam",
  "Gio",
  "Oggol",
  "Rdd",
];

const isFusedFromEarlierWords = (word, earlierWords) => {
  for (const left of earlierWords) {
    if (!word.startsWith(left) || left.length === word.length) continue;
    const right = word.slice(left.length);
    if ([...left].length < 3 || [...right].length < 3) continue;
    if (earlierWords.has(right)) return true;
  }
  return false;
};

describe("address-gap codebook quality", () => {
  test("keeps the first 220 entries free of mechanical two-word fusions", () => {
    for (const language of languages) {
      const words = readCodebook(language).slice(0, 220);
      const earlierWords = new Set();
      const fused = [];

      for (const word of words) {
        if (
          !lexicalizedFusions[language]?.has(word) &&
          isFusedFromEarlierWords(word, earlierWords)
        ) {
          fused.push(word);
        }
        earlierWords.add(word);
      }

      assert.deepEqual(
        fused,
        [],
        `${language} front-loaded mechanical fusions: ${fused
          .slice(0, 10)
          .join(", ")}`,
      );
    }
  });

  test("front-loads reviewed standalone seeds before synthetic fallback", () => {
    for (const [language, expectedWords] of Object.entries(
      frontLoadedExpectedWords,
    )) {
      const words = readCodebook(language).slice(0, 140);
      for (const word of expectedWords) {
        assert.ok(
          words.includes(word),
          `${language} should front-load ${word}`,
        );
      }
    }
  });

  test("keeps old generated syllable filler out of the first 140 entries", () => {
    for (const [language, blockedWords] of Object.entries(
      oldSyllableFallbackExamples,
    )) {
      const words = readCodebook(language).slice(0, 140);
      assert.deepEqual(
        words.filter((word) => blockedWords.includes(word)),
        [],
        `${language} should not expose old syllable filler early`,
      );
    }
  });

  test("keeps stripped transliteration fragments out of early Latin codebooks", () => {
    for (const language of [
      "bambara",
      "fula",
      "wolof",
      "ewe",
      "fon",
      "aymara",
      "guarani",
    ]) {
      const words = readCodebook(language).slice(0, 220);
      assert.deepEqual(
        words.filter((word) =>
          strippedTransliterationFragments.some((fragment) =>
            word.includes(fragment),
          ),
        ),
        [],
        `${language} should not contain stripped transliteration fragments`,
      );
    }
  });
});
