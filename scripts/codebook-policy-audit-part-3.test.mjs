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

  test("flags Arabic script, URL-safety, length, and blocklist issues", () => {
    const { violations } = auditCodebooks({
      arabic: [
        "دين",
        "حرب",
        "Ground",
        "ماء-بيت",
        "بحيرةحديقةمصباحزيتون",
        ...makeArabicFixtures(EXPECTED_COUNTS.arabic - 5),
      ],
    });

    const actual = new Set(
      violations.map((item) => `${item.word}:${item.rule}`),
    );

    assert.equal(actual.has("دين:reviewed-blocklist"), true);
    assert.equal(actual.has("حرب:reviewed-blocklist"), true);
    assert.equal(actual.has("Ground:arabic-script"), true);
    assert.equal(actual.has("ماء-بيت:arabic-script"), true);
    assert.equal(actual.has("ماء-بيت:arabic-url-safety"), true);
    assert.equal(actual.has("بحيرةحديقةمصباحزيتون:arabic-too-long"), true);
  });

  test("flags awkward Arabic abstract generated compounds", () => {
    const { violations } = auditCodebooks({
      arabic: [
        "صفاءبساط",
        "هدوءبيت",
        "بسمةكتاب",
        "فرحمصباح",
        "أملوعاء",
        ...makeArabicFixtures(EXPECTED_COUNTS.arabic - 5),
      ],
    });

    const actual = new Set(
      violations.map((item) => `${item.word}:${item.rule}`),
    );

    for (const word of [
      "صفاءبساط",
      "هدوءبيت",
      "بسمةكتاب",
      "فرحمصباح",
      "أملوعاء",
    ]) {
      assert.equal(
        actual.has(`${word}:arabic-awkward-generated-compound`),
        true,
        word,
      );
    }
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

  test("flags address-gap language script, URL, and length issues", () => {
    const { violations } = auditCodebooks({
      swahili: ["Good", "Bad-Word", ...makeLatinFixtures(4998)],
      filipino: ["Mabuti", "Bad/Word", ...makeLatinFixtures(4998)],
      hausa: ["Gida", "Bad?Word", ...makeLatinFixtures(4998)],
      bengali: ["বাড়ি", "BadLatin", ...makeBengaliFixtures(4998)],
      urdu: ["گھر", "BadLatin", ...makeUrduFixtures(4998)],
      amharic: ["ቤት", "BadLatin", ...makeAmharicFixtures(4998)],
    });

    assert.ok(violations.some((item) => item.rule === "swahili-url-safety"));
    assert.ok(violations.some((item) => item.rule === "filipino-url-safety"));
    assert.ok(violations.some((item) => item.rule === "hausa-url-safety"));
    assert.ok(violations.some((item) => item.rule === "bengali-script"));
    assert.ok(violations.some((item) => item.rule === "urdu-script"));
    assert.ok(violations.some((item) => item.rule === "amharic-script"));
  });

  test("flags address-gap pronunciation or spelling collisions", () => {
    const { violations } = auditCodebooks({
      swahili: ["Kahawa", "Kahawwa", ...makeLatinFixtures(4998)],
      filipino: ["Kape", "Cape", ...makeLatinFixtures(4998)],
      hausa: ["Kofi", "Cofi", ...makeLatinFixtures(4998)],
      bengali: ["বাড়ি", "বাাড়ি", ...makeBengaliFixtures(4998)],
      urdu: ["گھر", "گَھر", ...makeUrduFixtures(4998)],
      amharic: ["ቤት", "ቤትት", ...makeAmharicFixtures(4998)],
    });

    for (const language of [
      "swahili",
      "filipino",
      "hausa",
      "bengali",
      "urdu",
      "amharic",
    ]) {
      assert.ok(
        violations.some(
          (item) =>
            item.language === language &&
            item.rule === `${language}-pronunciation-collision`,
        ),
        `${language} pronunciation collision`,
      );
    }
  });
});
