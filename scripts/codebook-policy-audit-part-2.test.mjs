import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { auditCodebooks, EXPECTED_COUNTS } from "./codebook-policy-audit.mjs";
import {
  makeAmharicFixtures,
  makeArabicFixtures,
  makeBengaliFixtures,
  makeHangulFixtures,
  makeHindiFixtures,
  makeLatinFixtures,
  makeThaiFixtures,
  makeUrduFixtures,
  makeVietnameseFixtures,
} from "./codebook-policy-audit-fixtures.mjs";

describe("codebook policy audit", () => {
  test("flags awkward German generated compounds", () => {
    const { violations } = auditCodebooks({
      english: Array.from(
        { length: EXPECTED_COUNTS.english },
        (_, index) =>
          `Word${String.fromCharCode(65 + (index % 26))}${"a".repeat(Math.floor(index / 26) + 1)}`,
      ),
      korean: makeHangulFixtures(EXPECTED_COUNTS.korean),
      chinese: Array.from(
        { length: EXPECTED_COUNTS.chinese },
        (_, index) => `词${index}`,
      ),
      japanese: Array.from(
        { length: EXPECTED_COUNTS.japanese },
        (_, index) => `ことば${index}`,
      ),
      spanish: Array.from(
        { length: EXPECTED_COUNTS.spanish },
        (_, index) =>
          `Palabra${String.fromCharCode(65 + (index % 26))}${"a".repeat(Math.floor(index / 26) + 1)}`,
      ),
      french: Array.from(
        { length: EXPECTED_COUNTS.french },
        (_, index) =>
          `Mot${String.fromCharCode(65 + (index % 26))}${"a".repeat(Math.floor(index / 26) + 1)}`,
      ),
      german: [
        "Blattblatt",
        "Ackerfass",
        "Apfelpfeife",
        ...Array.from(
          { length: EXPECTED_COUNTS.german - 3 },
          (_, index) =>
            `Wort${String.fromCharCode(65 + (index % 26))}${"a".repeat(Math.floor(index / 26) + 1)}`,
        ),
      ],
    });

    const actual = new Set(
      violations.map((item) => `${item.word}:${item.rule}`),
    );

    for (const word of ["Blattblatt", "Ackerfass", "Apfelpfeife"]) {
      assert.equal(
        actual.has(`${word}:german-awkward-generated-compound`),
        true,
        word,
      );
    }
  });

  test("flags awkward Portuguese generated compounds", () => {
    const { violations } = auditCodebooks({
      english: Array.from(
        { length: EXPECTED_COUNTS.english },
        (_, index) =>
          `Word${String.fromCharCode(65 + (index % 26))}${"a".repeat(Math.floor(index / 26) + 1)}`,
      ),
      korean: makeHangulFixtures(EXPECTED_COUNTS.korean),
      chinese: Array.from(
        { length: EXPECTED_COUNTS.chinese },
        (_, index) => `词${index}`,
      ),
      japanese: Array.from(
        { length: EXPECTED_COUNTS.japanese },
        (_, index) => `ことば${index}`,
      ),
      spanish: Array.from(
        { length: EXPECTED_COUNTS.spanish },
        (_, index) =>
          `Palabra${String.fromCharCode(65 + (index % 26))}${"a".repeat(Math.floor(index / 26) + 1)}`,
      ),
      french: Array.from(
        { length: EXPECTED_COUNTS.french },
        (_, index) =>
          `Mot${String.fromCharCode(65 + (index % 26))}${"a".repeat(Math.floor(index / 26) + 1)}`,
      ),
      german: Array.from(
        { length: EXPECTED_COUNTS.german },
        (_, index) =>
          `Wort${String.fromCharCode(65 + (index % 26))}${"a".repeat(Math.floor(index / 26) + 1)}`,
      ),
      portuguese: [
        "Folhafolha",
        "Aguafita",
        "Riolivro",
        ...Array.from(
          { length: EXPECTED_COUNTS.portuguese - 3 },
          (_, index) =>
            `Palavra${String.fromCharCode(65 + (index % 26))}${"a".repeat(Math.floor(index / 26) + 1)}`,
        ),
      ],
    });

    const actual = new Set(
      violations.map((item) => `${item.word}:${item.rule}`),
    );

    for (const word of ["Folhafolha", "Aguafita", "Riolivro"]) {
      assert.equal(
        actual.has(`${word}:portuguese-awkward-generated-compound`),
        true,
        word,
      );
    }
  });

  test("flags awkward Indonesian generated compounds", () => {
    const { violations } = auditCodebooks({
      english: Array.from(
        { length: EXPECTED_COUNTS.english },
        (_, index) =>
          `Word${String.fromCharCode(65 + (index % 26))}${"a".repeat(Math.floor(index / 26) + 1)}`,
      ),
      korean: makeHangulFixtures(EXPECTED_COUNTS.korean),
      chinese: Array.from(
        { length: EXPECTED_COUNTS.chinese },
        (_, index) => `词${index}`,
      ),
      japanese: Array.from(
        { length: EXPECTED_COUNTS.japanese },
        (_, index) => `ことば${index}`,
      ),
      spanish: Array.from(
        { length: EXPECTED_COUNTS.spanish },
        (_, index) =>
          `Palabra${String.fromCharCode(65 + (index % 26))}${"a".repeat(Math.floor(index / 26) + 1)}`,
      ),
      french: Array.from(
        { length: EXPECTED_COUNTS.french },
        (_, index) =>
          `Mot${String.fromCharCode(65 + (index % 26))}${"a".repeat(Math.floor(index / 26) + 1)}`,
      ),
      german: Array.from(
        { length: EXPECTED_COUNTS.german },
        (_, index) =>
          `Wort${String.fromCharCode(65 + (index % 26))}${"a".repeat(Math.floor(index / 26) + 1)}`,
      ),
      portuguese: Array.from(
        { length: EXPECTED_COUNTS.portuguese },
        (_, index) =>
          `Palavra${String.fromCharCode(65 + (index % 26))}${"a".repeat(Math.floor(index / 26) + 1)}`,
      ),
      indonesian: [
        "Akarakar",
        "Awankaleng",
        "Bambubilik",
        "Cabaikayu",
        "Emaskuning",
        "Garamwangi",
        "Gulabening",
        "Hutanhalus",
        "Kacakayu",
        "Karetwangi",
        "Kerangkuning",
        "Lautdulang",
        "Mericajernih",
        "Ombakbenda",
        "Pancisegar",
        "Palaguci",
        "Perakutuh",
        "Pitakapas",
        "Rotankuning",
        "Saguangin",
        "Sikatkayu",
        "Sikattipis",
        "Telurbilik",
        "Tomatcawan",
        "Wadahbenda",
        ...Array.from(
          { length: EXPECTED_COUNTS.indonesian - 25 },
          (_, index) =>
            `Kata${String.fromCharCode(65 + (index % 26))}${"a".repeat(Math.floor(index / 26) + 1)}`,
        ),
      ],
    });

    const actual = new Set(
      violations.map((item) => `${item.word}:${item.rule}`),
    );

    for (const word of [
      "Akarakar",
      "Awankaleng",
      "Bambubilik",
      "Cabaikayu",
      "Emaskuning",
      "Garamwangi",
      "Gulabening",
      "Hutanhalus",
      "Kacakayu",
      "Karetwangi",
      "Kerangkuning",
      "Lautdulang",
      "Mericajernih",
      "Ombakbenda",
      "Pancisegar",
      "Palaguci",
      "Perakutuh",
      "Pitakapas",
      "Rotankuning",
      "Saguangin",
      "Sikatkayu",
      "Sikattipis",
      "Telurbilik",
      "Tomatcawan",
      "Wadahbenda",
    ]) {
      assert.equal(
        actual.has(`${word}:indonesian-awkward-generated-compound`),
        true,
        word,
      );
    }
  });

  test("flags Thai script, length, and reviewed blocklist issues", () => {
    const { violations } = auditCodebooks({
      thai: [
        "พนัน",
        "เหล้า",
        "Thai",
        "น้ำตาลหอมหวานใหม่",
        ...makeThaiFixtures(EXPECTED_COUNTS.thai - 4),
      ],
    });

    const actual = new Set(
      violations.map((item) => `${item.word}:${item.rule}`),
    );

    assert.equal(actual.has("พนัน:reviewed-blocklist"), true);
    assert.equal(actual.has("เหล้า:reviewed-blocklist"), true);
    assert.equal(actual.has("Thai:thai-script"), true);
    assert.equal(actual.has("น้ำตาลหอมหวานใหม่:thai-too-long"), true);
  });

  test("flags awkward Thai generated adjective compounds", () => {
    const { violations } = auditCodebooks({
      thai: [
        "ไฟดี",
        "นกยาว",
        "แมวยาว",
        "น้ำสูง",
        "ปลาแบน",
        "ข้าวหนัก",
        ...makeThaiFixtures(EXPECTED_COUNTS.thai - 6),
      ],
    });

    const actual = new Set(
      violations.map((item) => `${item.word}:${item.rule}`),
    );

    for (const word of [
      "ไฟดี",
      "นกยาว",
      "แมวยาว",
      "น้ำสูง",
      "ปลาแบน",
      "ข้าวหนัก",
    ]) {
      assert.equal(
        actual.has(`${word}:thai-awkward-generated-compound`),
        true,
        word,
      );
    }
  });

  test("flags Vietnamese script, URL-safety, length, and blocklist issues", () => {
    const { violations } = auditCodebooks({
      vietnamese: [
        "cờbạc",
        "rượu",
        "Ground1",
        "nước-mát",
        "chuônggióhoasen",
        ...makeVietnameseFixtures(EXPECTED_COUNTS.vietnamese - 5),
      ],
    });

    const actual = new Set(
      violations.map((item) => `${item.word}:${item.rule}`),
    );

    assert.equal(actual.has("cờbạc:reviewed-blocklist"), true);
    assert.equal(actual.has("rượu:reviewed-blocklist"), true);
    assert.equal(actual.has("Ground1:vietnamese-script"), true);
    assert.equal(actual.has("nước-mát:vietnamese-url-safety"), true);
    assert.equal(actual.has("chuônggióhoasen:vietnamese-too-long"), true);
  });
});
