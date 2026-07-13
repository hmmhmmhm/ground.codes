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
  test("keeps address-gap native-script codebooks URL-safe and neutral", () => {
    assertScriptCodebook({
      words: bengaliWords,
      pattern: /^[\p{Script=Bengali}\p{Mark}]+$/u,
      expectedWords: ["জল", "বাড়ি", "নদী", "পাহাড়", "বই", "বাজার"],
      blockedWords: ["যুদ্ধ", "রক্ত", "অস্ত্র", "জুয়া", "মদ"],
    });
    assertScriptCodebook({
      words: urduWords,
      pattern: /^[\p{Script=Arabic}\p{Mark}]+$/u,
      expectedWords: ["پانی", "گھر", "دریا", "پہاڑ", "کتاب", "بازار"],
      blockedWords: ["جنگ", "خون", "ہتھیار", "جوا", "شراب"],
    });
    assertScriptCodebook({
      words: amharicWords,
      pattern: /^[\p{Script=Ethiopic}\p{Mark}]+$/u,
      expectedWords: ["ውሃ", "ቤት", "ወንዝ", "ተራራ", "መጽሐፍ", "ገበያ"],
      blockedWords: ["ጦርነት", "ደም", "መሳሪያ", "ቁማር", "አልኮል"],
    });
    assertScriptCodebook({
      words: burmeseWords,
      pattern: /^[\p{Script=Myanmar}\p{Mark}]+$/u,
      expectedWords: ["ရေ", "အိမ်", "မြစ်", "တောင်", "ပန်း", "စာအုပ်"],
      blockedWords: ["စစ်", "သွေး", "လက်နက်"],
    });
    assertScriptCodebook({
      words: khmerWords,
      pattern: /^[\p{Script=Khmer}\p{Mark}]+$/u,
      expectedWords: ["ទឹក", "ផ្ទះ", "ទន្លេ", "ភ្នំ", "ផ្កា", "សៀវភៅ"],
      blockedWords: ["សង្គ្រាម", "ឈាម", "អាវុធ"],
    });
    assertScriptCodebook({
      words: nepaliWords,
      pattern: /^[\p{Script=Devanagari}\p{Mark}]+$/u,
      expectedWords: ["पानी", "घर", "नदी", "पहाड", "फूल", "किताब"],
      blockedWords: ["युद्ध", "रगत", "हतियार", "जुवा", "रक्सी"],
    });
    assertScriptCodebook({
      words: pashtoWords,
      pattern: /^[\p{Script=Arabic}\p{Mark}]+$/u,
      expectedWords: ["اوبه", "کور", "سيند", "غر", "ګل", "کتاب"],
      blockedWords: ["جګړه", "وینه", "وسله", "قمار", "شراب"],
    });
  });
});
