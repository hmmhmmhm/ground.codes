import assert from "node:assert/strict";
import { describe, test } from "node:test";

import chineseWords from "@repo/codebook/codebook-dist/chinese.json";
import englishWords from "@repo/codebook/codebook-dist/english.json";
import japaneseWords from "@repo/codebook/codebook-dist/japanese.json";
import koreanWords from "@repo/codebook/codebook-dist/korean.json";
import spanishWords from "@repo/codebook/codebook-dist/spanish.json";
import frenchWords from "@repo/codebook/codebook-dist/french.json";
import germanWords from "@repo/codebook/codebook-dist/german.json";
import portugueseWords from "@repo/codebook/codebook-dist/portuguese.json";
import indonesianWords from "@repo/codebook/codebook-dist/indonesian.json";
import thaiWords from "@repo/codebook/codebook-dist/thai.json";
import vietnameseWords from "@repo/codebook/codebook-dist/vietnamese.json";
import hindiWords from "@repo/codebook/codebook-dist/hindi.json";
import arabicWords from "@repo/codebook/codebook-dist/arabic.json";
import russianWords from "@repo/codebook/codebook-dist/russian.json";
import swahiliWords from "@repo/codebook/codebook-dist/swahili.json";
import filipinoWords from "@repo/codebook/codebook-dist/filipino.json";
import hausaWords from "@repo/codebook/codebook-dist/hausa.json";
import bengaliWords from "@repo/codebook/codebook-dist/bengali.json";
import urduWords from "@repo/codebook/codebook-dist/urdu.json";
import amharicWords from "@repo/codebook/codebook-dist/amharic.json";
import burmeseWords from "@repo/codebook/codebook-dist/burmese.json";
import khmerWords from "@repo/codebook/codebook-dist/khmer.json";
import nepaliWords from "@repo/codebook/codebook-dist/nepali.json";
import somaliWords from "@repo/codebook/codebook-dist/somali.json";
import pashtoWords from "@repo/codebook/codebook-dist/pashto.json";
import lingalaWords from "@repo/codebook/codebook-dist/lingala.json";

const assertBlockedWordsAbsent = (words: string[], blockedWords: string[]) => {
  const blocked = new Set(blockedWords);
  assert.deepEqual(
    words.filter((word) => blocked.has(word)),
    [],
  );
};

const assertWordsPresent = (words: string[], expectedWords: string[]) => {
  const available = new Set(words);
  assert.deepEqual(
    expectedWords.filter((word) => !available.has(word)),
    [],
  );
};

const germanTemplateCompoundPattern =
  /^[A-Z][a-z]{3,}(?:band|bank|becher|beet|beutel|blatt|blech|brett|bund|dose|eimer|faden|fass|feld|fliese|gabel|glas|griff|haken|hut|kachel|kanne|karton|kasten|kelle|kerze|kiste|klotz|knopf|korb|kranz|kreide|krug|lampe|leiste|mappe|matte|messer|nadel|papier|perle|pfanne|pfeife|pinsel|platte|polster|rahmen|riegel|ring|rohr|sack|schale|seil|sieb|sohle|spange|spatel|spiegel|spule|steg|stein|stift|tafel|tasche|tasse|tisch|topf|truhe|vlies|wagen)$/u;
const portugueseTemplateCompoundPattern =
  /^[A-Z][a-z]{3,}(?:anel|banco|bandeja|bastao|bau|bolsa|botao|brocha|caixa|cesta|cesto|chave|copo|corda|cuba|cuia|escova|esteira|fita|folha|frasco|gancho|jarra|lata|livro|lona|luz|mapa|marco|mesa|pano|pote|prato|rede|saco|selo|suporte|tabua|tampa|tela|tigela|vaso|vela)$/u;
const assertScriptCodebook = ({
  words,
  pattern,
  expectedWords,
  blockedWords,
}: {
  words: string[];
  pattern: RegExp;
  expectedWords: string[];
  blockedWords: string[];
}) => {
  assert.equal(words.length, 5000);
  assert.equal(new Set(words).size, words.length);
  assert.deepEqual(
    words.filter((word) => !pattern.test(word)),
    [],
  );
  assertWordsPresent(words, expectedWords);
  assertBlockedWordsAbsent(words, blockedWords);
};

const assertCodebook = ({
  words,
  expectedLength,
  blockedWords,
}: {
  words: string[];
  expectedLength: number;
  blockedWords: string[];
}) => {
  assert.equal(words.length, expectedLength);
  assert.equal(new Set(words).size, words.length);

  assertBlockedWordsAbsent(words, blockedWords);
};

describe("reviewed multilingual codebooks", () => {
  test("keeps Hindi codebook URL-safe and neutral", () => {
    assert.equal(hindiWords.length, 5000);
    assert.equal(new Set(hindiWords).size, hindiWords.length);
    assert.deepEqual(
      hindiWords.filter(
        (word) => !/^[\p{Script=Devanagari}\p{Mark}]+$/u.test(word),
      ),
      [],
    );
    assert.deepEqual(
      hindiWords.filter((word) => /[\s\-/#?]/.test(word)),
      [],
    );
    assert.deepEqual(
      hindiWords.filter((word) => [...word].length > 14),
      [],
    );
    assertWordsPresent(hindiWords, [
      "जल",
      "घर",
      "नदी",
      "पहाड़",
      "फूल",
      "कमल",
      "चाय",
      "किताब",
      "दीया",
      "रोटी",
      "दाल",
      "चावल",
      "आम",
      "केला",
      "नारियल",
      "पेड़",
      "बाजार",
      "सड़क",
      "पुल",
      "थाली",
      "कमलफूल",
      "चायपत्ती",
      "दीयाबत्ती",
      "फूलदान",
      "जलघड़ा",
      "किताबघर",
      "रेलस्टेशन",
      "बसस्टैंड",
      "नदीघाट",
      "आमबाग",
    ]);
    assertBlockedWordsAbsent(hindiWords, [
      "शराब",
      "जुआ",
      "नशा",
      "हथियार",
      "राजनीति",
      "धर्म",
      "मौत",
      "खून",
      "जेल",
      "सेक्स",
      "बीमारी",
      "कर्ज",
      "गोली",
      "बंदूक",
      "हत्या",
      "युद्ध",
      "चुनाव",
      "मंदिर",
      "प्रार्थना",
      "अस्पताल",
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
    ]);
  });

  test("keeps Arabic codebook URL-safe and neutral", () => {
    const abstractCompoundPrefixes = ["صفاء", "هدوء", "بسمة", "فرح", "أمل"];

    assert.equal(arabicWords.length, 5000);
    assert.equal(new Set(arabicWords).size, arabicWords.length);
    assert.deepEqual(
      arabicWords.filter(
        (word) => !/^[\p{Script=Arabic}\p{Mark}]+$/u.test(word),
      ),
      [],
    );
    assert.deepEqual(
      arabicWords.filter((word) => /[\s\-/#?]/.test(word)),
      [],
    );
    assert.deepEqual(
      arabicWords.filter((word) => [...word].length > 14),
      [],
    );
    assert.ok(
      arabicWords.filter((word) => [...word].length <= 4).length >= 250,
      "Arabic codebook should include at least 250 short standalone words",
    );
    assert.deepEqual(
      arabicWords.filter((word) =>
        abstractCompoundPrefixes.some(
          (prefix) => word.startsWith(prefix) && word !== prefix,
        ),
      ),
      [],
    );
    assertWordsPresent(arabicWords, [
      "ماء",
      "بيت",
      "نهر",
      "جبل",
      "زهرة",
      "كتاب",
      "تمر",
      "زيتون",
      "نخيل",
      "بحيرةبيت",
    ]);
    assertBlockedWordsAbsent(arabicWords, [
      "دين",
      "حرب",
      "قتل",
      "دم",
      "سلاح",
      "مرض",
      "خمر",
      "سجن",
      "سياسة",
      "جنس",
      "قنبلة",
      "رصاص",
    ]);
  });

  test("keeps Russian codebook URL-safe and neutral", () => {
    assert.equal(russianWords.length, 5000);
    assert.equal(new Set(russianWords).size, russianWords.length);
    assert.deepEqual(
      russianWords.filter(
        (word) => !/^[\p{Script=Cyrillic}\p{Mark}]+$/u.test(word),
      ),
      [],
    );
    assert.deepEqual(
      russianWords.filter((word) => /[\s\-/#?]/.test(word)),
      [],
    );
    assert.deepEqual(
      russianWords.filter((word) => [...word].length > 14),
      [],
    );
    assert.ok(
      russianWords.filter((word) => [...word].length <= 4).length >= 250,
      "Russian codebook should include at least 250 short standalone words",
    );
    assertWordsPresent(russianWords, [
      "вода",
      "дом",
      "река",
      "гора",
      "цветок",
      "книга",
      "хлеб",
      "яблоко",
      "береза",
      "мост",
      "абрикос",
      "ананас",
      "апельсин",
      "барабан",
      "кастрюля",
      "самовар",
      "брусника",
      "валенок",
      "дудочка",
      "черемша",
      "шампур",
      "озеродом",
    ]);
    assertBlockedWordsAbsent(russianWords, [
      "война",
      "оружие",
      "кровь",
      "тюрьма",
      "секс",
      "наркотик",
      "политика",
      "религия",
      "болезнь",
      "долг",
      "убийство",
      "казино",
      "алкоголь",
      "мрак",
      "кома",
      "вера",
      "флот",
      "вена",
      "труд",
      "омут",
      "рука",
      "нос",
      "ухо",
      "зуб",
      "йод",
      "пир",
      "фаза",
      "рулет",
      "султан",
      "рогатка",
      "бинт",
      "финиш",
      "фига",
      "чек",
      "тык",
      "глечик",
      "ерик",
      "путь",
      "лугок",
      "виш",
      "дар",
      "зной",
      "клуб",
      "ложа",
      "мир",
      "мода",
      "овал",
      "ось",
      "мат",
      "форма",
      "хор",
      "шест",
      "лентач",
      "кизяк",
      "артель",
      "жгут",
      "хомут",
    ]);
  });

  test("keeps address-gap Latin codebooks URL-safe and neutral", () => {
    for (const [words, expectedWords, blockedWords] of [
      [
        swahiliWords,
        ["Maji", "Nyumba", "Mto", "Mlima", "Kitabu", "Soko"],
        ["Vita", "Damu", "Silaha", "Ngono", "Kasino", "Pombe"],
      ],
      [
        filipinoWords,
        ["Tubig", "Bahay", "Ilog", "Bundok", "Aklat", "Palengke"],
        ["Digma", "Dugo", "Baril", "Sugal", "Alak"],
      ],
      [
        hausaWords,
        ["Ruwa", "Gida", "Kogi", "Tsauni", "Littafi", "Kasuwa"],
        ["Yaki", "Jini", "Bindiga", "Caca", "Giya"],
      ],
      [
        somaliWords,
        ["Biyo", "Guri", "Webi", "Buur", "Ubax", "Shaah"],
        ["Dagaal", "Dhiig", "Hub", "Khamri"],
      ],
      [
        lingalaWords,
        ["Mai", "Ndako", "Ebale", "Ngomba", "Fololo", "Buku"],
        ["Etumba", "Makila", "Mondoki", "Masanga"],
      ],
    ] as const) {
      assert.equal(words.length, 5000);
      assert.equal(new Set(words).size, words.length);
      assert.deepEqual(
        words.filter((word) => !/^[A-Z][a-z]+$/.test(word)),
        [],
      );
      assertWordsPresent(words, expectedWords);
      assertBlockedWordsAbsent(words, blockedWords);
    }
  });
});
