import assert from "node:assert/strict";
import { describe, test } from "node:test";

import czechWords from "@repo/codebook/codebook-dist/czech.json";
import dutchWords from "@repo/codebook/codebook-dist/dutch.json";
import greekWords from "@repo/codebook/codebook-dist/greek.json";
import italianWords from "@repo/codebook/codebook-dist/italian.json";
import polishWords from "@repo/codebook/codebook-dist/polish.json";
import romanianWords from "@repo/codebook/codebook-dist/romanian.json";
import turkishWords from "@repo/codebook/codebook-dist/turkish.json";
import ukrainianWords from "@repo/codebook/codebook-dist/ukrainian.json";
import { decodeByWordSet, encodeByWordSet } from "../src/wordset.js";

const fixtures = [
  {
    language: "turkish",
    words: turkishWords,
    expected: ["Ev", "Çay", "Kitap", "Kapı", "İstasyon", "Kervan"],
    rejected: [],
  },
  {
    language: "italian",
    words: italianWords,
    expected: ["Casa", "Tè", "Libro", "Città", "Caffè", "Bambù"],
    rejected: ["Citta", "Caffe", "Bambu"],
  },
  {
    language: "dutch",
    words: dutchWords,
    expected: ["Huis", "Boek", "Kaart", "Deur", "Ziekenhuis"],
    rejected: [],
  },
  {
    language: "polish",
    words: polishWords,
    expected: ["Dom", "Góra", "Książka", "Szkoła", "Miedź", "Ząb"],
    rejected: [
      "Kamien",
      "Stol",
      "Pudelko",
      "Zaslona",
      "Sciana",
      "Szkola",
      "Miedz",
      "Noz",
      "Zab",
    ],
  },
  {
    language: "ukrainian",
    words: ukrainianWords,
    expected: ["Дім", "Книга", "Мʼята", "Компʼютер", "Мандрівник"],
    rejected: ["Мята", "Компютер"],
  },
  {
    language: "romanian",
    words: romanianWords,
    expected: [
      "Casă",
      "Râu",
      "Piață",
      "Școală",
      "Brânză",
      "Țesătură",
      "PunctCasă",
      "ZonăApă",
    ],
    rejected: [
      "Casa",
      "Rau",
      "Piata",
      "Scoala",
      "Branza",
      "Tesatura",
      "PunctScaun",
      "HartăMasă",
      "LuminăMână",
      "PortUsturoi",
    ],
  },
  {
    language: "czech",
    words: czechWords,
    expected: [
      "Dům",
      "Řeka",
      "Květina",
      "Náměstí",
      "Počítač",
      "Přístav",
      "BodDům",
      "ZónaVoda",
    ],
    rejected: [
      "Dum",
      "Reka",
      "Kvetina",
      "Namesti",
      "Pocitac",
      "Pristav",
      "BodŽidle",
      "MapaStůl",
      "SvětloMatrace",
      "PolohaČesnek",
    ],
  },
  {
    language: "greek",
    words: greekWords,
    expected: [
      "Σπίτι",
      "Νερό",
      "Βιβλίο",
      "Πλατεία",
      "Υπολογιστής",
      "ΣημείοΣπίτι",
      "ΖώνηΝερό",
    ],
    rejected: [
      "Spiti",
      "Nero",
      "Vivlio",
      "Plateia",
      "Ypologistis",
      "ΣημείοΚαρέκλα",
      "ΧάρτηςΤραπέζι",
      "ΦωςΑυτί",
      "ΛιμάνιΣκόρδο",
    ],
  },
] as const;

describe("major European word sets", () => {
  test("ship 5,000 unique words with reviewed seed terms first", () => {
    for (const { language, words, expected } of fixtures) {
      assert.equal(words.length, 5000, `${language} length`);
      assert.equal(new Set(words).size, words.length, `${language} uniqueness`);

      for (const word of expected) {
        assert.equal(
          words.includes(word),
          true,
          `${language} includes ${word}`,
        );
      }
    }
  });

  test("reject known unreviewed fallback spellings", () => {
    for (const { language, words, rejected } of fixtures) {
      for (const word of rejected) {
        assert.equal(
          words.includes(word),
          false,
          `${language} rejects ${word}`,
        );
      }
    }
  });

  test("round-trips encoded indexes through each new language", async () => {
    for (const { language } of fixtures) {
      const encoded = await encodeByWordSet({
        n: 123456789,
        language,
      });
      assert.equal(await decodeByWordSet({ encoded, language }), 123456789);
    }
  });
});
