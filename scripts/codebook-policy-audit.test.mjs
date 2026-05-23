import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { auditCodebooks, EXPECTED_COUNTS } from "./codebook-policy-audit.mjs";

const makeHangulFixtures = (count) => {
  const lead = ["가", "나", "다", "라", "마", "바", "사", "아", "자", "차"];
  const middle = ["구", "누", "두", "루", "무", "부", "수", "우", "주", "추"];
  const tail = ["기", "니", "디", "리", "미", "비", "시", "이", "지", "치"];
  const words = [];

  for (const a of lead) {
    for (const b of middle) {
      for (const c of tail) {
        for (const d of lead) {
          words.push(`${a}${b}${c}${d}`);
          if (words.length === count) {
            return words;
          }
        }
      }
    }
  }

  throw new Error(`Unable to generate ${count} Hangul fixtures`);
};

const makeThaiFixtures = (count) => {
  const lead = ["กา", "นา", "ดา", "มา", "บา", "สา", "ลา", "ชา", "ตา", "ปา"];
  const middle = ["กุ", "นุ", "ดุ", "มุ", "บุ", "สุ", "ลุ", "ชุ", "ตุ", "ปุ"];
  const tail = ["กี", "นี", "ดี", "มี", "บี", "สี", "ลี", "ชี", "ตี", "ปี"];
  const words = [];

  for (const a of lead) {
    for (const b of middle) {
      for (const c of tail) {
        for (const d of lead) {
          words.push(`${a}${b}${c}${d}`);
          if (words.length === count) {
            return words;
          }
        }
      }
    }
  }

  throw new Error(`Unable to generate ${count} Thai fixtures`);
};

const makeVietnameseFixtures = (count) => {
  const lead = [
    "lúa",
    "sen",
    "tre",
    "mây",
    "gạo",
    "hoa",
    "dừa",
    "núi",
    "sông",
    "biển",
  ];
  const tail = [
    "mát",
    "xanh",
    "vàng",
    "nhỏ",
    "sáng",
    "bền",
    "êm",
    "tươi",
    "thơm",
    "lành",
  ];
  const words = [];

  for (const a of lead) {
    for (const b of tail) {
      for (const c of lead) {
        for (const d of tail) {
          words.push(`${a}${b}${c}${d}`);
          if (words.length === count) {
            return words;
          }
        }
      }
    }
  }

  throw new Error(`Unable to generate ${count} Vietnamese fixtures`);
};

const makeHindiFixtures = (count) => {
  const lead = [
    "जल",
    "घर",
    "कमल",
    "चाय",
    "नदी",
    "बाग",
    "दीप",
    "रंग",
    "पुल",
    "मिट्टी",
  ];
  const middle = [
    "घड़ा",
    "फूल",
    "पत्ता",
    "कप",
    "थाली",
    "दीया",
    "बेलन",
    "रस्सी",
    "डिब्बा",
    "कटोरा",
  ];
  const words = [];

  for (const a of lead) {
    for (const b of middle) {
      for (const c of lead) {
        for (const d of middle) {
          words.push(`${a}${b}${c}${d}`);
          if (words.length === count) {
            return words;
          }
        }
      }
    }
  }

  throw new Error(`Unable to generate ${count} Hindi fixtures`);
};

describe("codebook policy audit", () => {
  test("keeps distributed codebooks at the guide-approved counts", () => {
    const { summary } = auditCodebooks();

    for (const [language, expectedCount] of Object.entries(EXPECTED_COUNTS)) {
      assert.equal(summary[language].count, expectedCount);
      assert.equal(summary[language].unique, expectedCount);
      assert.equal(summary[language].blanks, 0);
    }
  });

  test("keeps guide-reviewed policy violations out of distributed codebooks", () => {
    const { violations } = auditCodebooks();

    assert.deepEqual(
      violations,
      [],
      violations
        .slice(0, 20)
        .map(
          (item) =>
            `${item.language}[${item.index}] ${item.word}: ${item.rule}`,
        )
        .join("\n"),
    );
  });

  test("flags Korean entries that differ only by common pronunciation confusions", () => {
    const { violations } = auditCodebooks({
      english: Array.from(
        { length: EXPECTED_COUNTS.english },
        (_, index) => `Word${index}`,
      ),
      korean: [
        "나무채반",
        "나무체반",
        ...Array.from(
          { length: EXPECTED_COUNTS.korean - 2 },
          (_, index) => `테스트${index}`,
        ),
      ],
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
        (_, index) => `Palabra${index}`,
      ),
    });

    assert.deepEqual(
      violations.filter(
        (item) => item.rule === "korean-pronunciation-collision",
      ),
      [
        {
          language: "korean",
          index: 1,
          word: "나무체반",
          rule: "korean-pronunciation-collision",
          detail:
            'Sounds like index 0 "나무채반" under Korean confusion groups',
        },
      ],
    );
  });

  test("flags Korean cleanup patterns that make poor public address words", () => {
    const { violations } = auditCodebooks({
      english: Array.from(
        { length: EXPECTED_COUNTS.english },
        (_, index) => `Word${index}`,
      ),
      korean: [
        "조약돌광목포",
        "정겨운도토리",
        "정",
        "솔방울두루마리",
        "비화이트리스트",
        "포근한흙담",
        "색종이상자",
        "면솔방울",
        ...makeHangulFixtures(EXPECTED_COUNTS.korean - 8),
      ],
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
        (_, index) => `Palabra${index}`,
      ),
    });

    const actual = new Set(
      violations
        .filter((item) => item.language === "korean")
        .map((item) => `${item.word}:${item.rule}`),
    );

    for (const [word, rule] of [
      ["조약돌광목포", "korean-generated-material-compound"],
      ["정겨운도토리", "korean-poetic-adjective-compound"],
      ["정", "korean-weak-one-syllable"],
      ["솔방울두루마리", "korean-too-long"],
      ["비화이트리스트", "korean-unapproved-loanword"],
      ["포근한흙담", "korean-poetic-adjective-compound"],
      ["색종이상자", "korean-generated-material-compound"],
      ["면솔방울", "korean-generated-material-compound"],
    ]) {
      assert.equal(actual.has(`${word}:${rule}`), true, `${word}: ${rule}`);
    }
  });

  test("flags generated cleanup patterns outside Korean codebooks", () => {
    const { violations } = auditCodebooks({
      english: [
        "Ambercreel",
        ...Array.from(
          { length: EXPECTED_COUNTS.english - 1 },
          (_, index) =>
            `Word${String.fromCharCode(65 + (index % 26))}${"a".repeat(Math.floor(index / 26) + 1)}`,
        ),
      ],
      korean: makeHangulFixtures(EXPECTED_COUNTS.korean),
      chinese: [
        "木小筐",
        ...Array.from(
          { length: EXPECTED_COUNTS.chinese - 1 },
          (_, index) => `词${index}`,
        ),
      ],
      japanese: [
        "ひのきひきだし",
        ...Array.from(
          { length: EXPECTED_COUNTS.japanese - 1 },
          (_, index) => `ことば${index}`,
        ),
      ],
      spanish: [
        "Abedulabanico",
        "Abeduldedalera",
        ...Array.from(
          { length: EXPECTED_COUNTS.spanish - 2 },
          (_, index) =>
            `Palabra${String.fromCharCode(65 + (index % 26))}${"a".repeat(Math.floor(index / 26) + 1)}`,
        ),
      ],
    });

    const actual = new Set(
      violations.map((item) => `${item.word}:${item.rule}`),
    );

    for (const [word, rule] of [
      ["Ambercreel", "english-generated-material-compound"],
      ["Abedulabanico", "spanish-generated-material-compound"],
      ["Abeduldedalera", "spanish-too-long"],
      ["木小筐", "chinese-generated-material-compound"],
      ["ひのきひきだし", "japanese-generated-material-compound"],
      ["ひのきひきだし", "japanese-too-long"],
    ]) {
      assert.equal(actual.has(`${word}:${rule}`), true, `${word}: ${rule}`);
    }
  });

  test("flags Spanish codebooks saturated with fused template compounds", () => {
    const makePrefix = (index) => {
      let value = index;
      let letters = "";
      for (let i = 0; i < 5; i += 1) {
        letters = String.fromCharCode(97 + (value % 26)) + letters;
        value = Math.floor(value / 26);
      }
      return `${letters[0].toUpperCase()}${letters.slice(1)}`;
    };
    const suffixes = ["caja", "bolsa", "taza", "vaso", "plato"];

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
          `${makePrefix(index)}${suffixes[index % suffixes.length]}`,
      ),
    });

    assert.equal(
      violations.some((item) => item.rule === "spanish-compound-saturation"),
      true,
    );
  });

  test("flags French codebooks saturated with fused template compounds", () => {
    const makePrefix = (index) => {
      let value = index;
      let letters = "";
      for (let i = 0; i < 5; i += 1) {
        letters = String.fromCharCode(97 + (value % 26)) + letters;
        value = Math.floor(value / 26);
      }
      return `${letters[0].toUpperCase()}${letters.slice(1)}`;
    };
    const suffixes = ["abri", "bocal", "caisse", "panier", "tiroir"];

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
          `${makePrefix(index)}${suffixes[index % suffixes.length]}`,
      ),
    });

    assert.equal(
      violations.some((item) => item.rule === "french-compound-saturation"),
      true,
    );
  });

  test("flags German codebooks saturated with fused template compounds", () => {
    const makePrefix = (index) => {
      let value = index;
      let letters = "";
      for (let i = 0; i < 5; i += 1) {
        letters = String.fromCharCode(97 + (value % 26)) + letters;
        value = Math.floor(value / 26);
      }
      return `${letters[0].toUpperCase()}${letters.slice(1)}`;
    };
    const suffixes = ["bank", "becher", "kasten", "korb", "tasche"];

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
          `${makePrefix(index)}${suffixes[index % suffixes.length]}`,
      ),
    });

    assert.equal(
      violations.some((item) => item.rule === "german-compound-saturation"),
      true,
    );
  });

  test("flags Portuguese codebooks saturated with fused template compounds", () => {
    const makePrefix = (index) => {
      let value = index;
      let letters = "";
      for (let i = 0; i < 5; i += 1) {
        letters = String.fromCharCode(97 + (value % 26)) + letters;
        value = Math.floor(value / 26);
      }
      return `${letters[0].toUpperCase()}${letters.slice(1)}`;
    };
    const suffixes = ["caixa", "cesto", "pote", "prato", "vaso"];

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
          `${makePrefix(index)}${suffixes[index % suffixes.length]}`,
      ),
    });

    assert.equal(
      violations.some((item) => item.rule === "portuguese-compound-saturation"),
      true,
    );
  });

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

  test("flags awkward Vietnamese generated compounds", () => {
    const { violations } = auditCodebooks({
      vietnamese: [
        "nướccao",
        "lửacao",
        "nhàcao",
        "vườncao",
        "xanhxanh",
        "hoacao",
        "trecao",
        "camcao",
        "khoaiđèn",
        "lácửa",
        "lạchồ",
        "chuôngbình",
        "hộpxanh",
        "bútvàng",
        "cốcđen",
        "báttrắng",
        "vảitím",
        "lụahồng",
        "đènđen",
        "bìnhnâu",
        "vườnnắng",
        "ruộnggió",
        "đồngmát",
        "bãivàng",
        "sânxanh",
        "núimát",
        "đồinắng",
        "aomát",
        "hồxanh",
        "sôngmát",
        ...makeVietnameseFixtures(EXPECTED_COUNTS.vietnamese - 30),
      ],
    });

    const actual = new Set(
      violations.map((item) => `${item.word}:${item.rule}`),
    );

    for (const word of [
      "nướccao",
      "lửacao",
      "nhàcao",
      "vườncao",
      "xanhxanh",
      "hoacao",
      "trecao",
      "camcao",
      "khoaiđèn",
      "lácửa",
      "lạchồ",
      "chuôngbình",
      "hộpxanh",
      "bútvàng",
      "cốcđen",
      "báttrắng",
      "vảitím",
      "lụahồng",
      "đènđen",
      "bìnhnâu",
      "vườnnắng",
      "ruộnggió",
      "đồngmát",
      "bãivàng",
      "sânxanh",
      "núimát",
      "đồinắng",
      "aomát",
      "hồxanh",
      "sôngmát",
    ]) {
      assert.equal(
        actual.has(`${word}:vietnamese-awkward-generated-compound`),
        true,
        word,
      );
    }
  });

  test("flags Hindi script, URL-safety, length, and blocklist issues", () => {
    const { violations } = auditCodebooks({
      hindi: [
        "शराब",
        "जुआ",
        "Ground",
        "जल-घर",
        "कमलफूलकमलफूलघड़ा",
        ...makeHindiFixtures(EXPECTED_COUNTS.hindi - 5),
      ],
    });

    const actual = new Set(
      violations.map((item) => `${item.word}:${item.rule}`),
    );

    assert.equal(actual.has("शराब:reviewed-blocklist"), true);
    assert.equal(actual.has("जुआ:reviewed-blocklist"), true);
    assert.equal(actual.has("Ground:hindi-script"), true);
    assert.equal(actual.has("जल-घर:hindi-script"), true);
    assert.equal(actual.has("जल-घर:hindi-url-safety"), true);
    assert.equal(actual.has("कमलफूलकमलफूलघड़ा:hindi-too-long"), true);
  });

  test("flags awkward Hindi generated compounds", () => {
    const { violations } = auditCodebooks({
      hindi: [
        "किताबमाटी",
        "घड़ास्टेशन",
        "दीपकसड़क",
        "मोहल्लाकुर्सी",
        "मोहल्लातवा",
        "थालीकुर्सी",
        "कटोरामेज",
        "प्यालास्टेशन",
        "डिब्बासड़क",
        "मीठानमक",
        "मीठाप्याज",
        "ताजाकुर्सी",
        "गमलारोटी",
        "सुनहराकुर्सी",
        "सुनहरामेज",
        "रूपहलालहसुन",
        "रूपहलासत्तू",
        "रूपहलालस्सी",
        "रूपहलासूप",
        "रूपहलाहांडी",
        "सुनहरादान",
        "रूपहलाघर",
        "नदीघर",
        "नदीबाजार",
        "नदीलाल",
        "झीलनीला",
        "लालघर",
        "नीलाकिताब",
        "छोटामिट्टी",
        "बड़ाहवा",
        "कागजकंबल",
        "कपासदीया",
        "चांदीकुर्सी",
        "गांवमेड़",
        "बरामदाबाजार",
        "अपरस",
        "सुपली",
        "खिड़कीपट",
        "टोकरीढक्कन",
        "गरमपानी",
        "चावलदान",
        "मोडक",
        "पटल",
        "बखार",
        "सरौता",
        "बलुआ",
        "खर्रा",
        "पपीहा",
        "नदीसुनहरा",
        "तालाबसुनहरा",
        "समुद्ररूपहला",
        "हवाकाला",
        "सूरजहरा",
        "चाँदपीला",
        "रास्तागुलाबी",
        "कागजरजाई",
        "पीतलकंबल",
        "ईंटसाड़ी",
        ...makeHindiFixtures(EXPECTED_COUNTS.hindi - 58),
      ],
    });

    const actual = new Set(
      violations.map((item) => `${item.word}:${item.rule}`),
    );

    for (const word of [
      "किताबमाटी",
      "घड़ास्टेशन",
      "दीपकसड़क",
      "मोहल्लाकुर्सी",
      "मोहल्लातवा",
      "थालीकुर्सी",
      "कटोरामेज",
      "प्यालास्टेशन",
      "डिब्बासड़क",
      "मीठानमक",
      "मीठाप्याज",
      "ताजाकुर्सी",
      "गमलारोटी",
      "सुनहराकुर्सी",
      "सुनहरामेज",
      "रूपहलालहसुन",
      "रूपहलासत्तू",
      "रूपहलालस्सी",
      "रूपहलासूप",
      "रूपहलाहांडी",
      "सुनहरादान",
      "रूपहलाघर",
      "नदीघर",
      "नदीबाजार",
      "नदीलाल",
      "झीलनीला",
      "लालघर",
      "नीलाकिताब",
      "छोटामिट्टी",
      "बड़ाहवा",
      "कागजकंबल",
      "कपासदीया",
      "चांदीकुर्सी",
      "गांवमेड़",
      "बरामदाबाजार",
      "अपरस",
      "सुपली",
      "खिड़कीपट",
      "टोकरीढक्कन",
      "गरमपानी",
      "चावलदान",
      "मोडक",
      "पटल",
      "बखार",
      "सरौता",
      "बलुआ",
      "खर्रा",
      "पपीहा",
      "नदीसुनहरा",
      "तालाबसुनहरा",
      "समुद्ररूपहला",
      "हवाकाला",
      "सूरजहरा",
      "चाँदपीला",
      "रास्तागुलाबी",
      "कागजरजाई",
      "पीतलकंबल",
      "ईंटसाड़ी",
    ]) {
      assert.equal(
        actual.has(`${word}:hindi-awkward-generated-compound`),
        true,
        word,
      );
    }
  });
});
