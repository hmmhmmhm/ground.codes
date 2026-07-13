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
  test("keeps latest English sub-agent review findings out", () => {
    assertBlockedWordsAbsent(englishWords, [
      "Ali",
      "Bob",
      "Dan",
      "Jim",
      "Ken",
      "Sam",
      "Tom",
      "Andy",
      "Anne",
      "Bill",
      "Dave",
      "Jack",
      "Jane",
      "Jose",
      "Josh",
      "Lisa",
      "Mike",
      "Paul",
      "Usa",
      "Iowa",
      "Ohio",
      "Utah",
      "Idaho",
      "Omaha",
      "Nevada",
      "Indiana",
      "Oxford",
      "Orlando",
      "Colorado",
      "Columbia",
      "Delaware",
      "Kentucky",
      "Scotland",
      "Amsterdam",
      "Barcelona",
      "Guatemala",
      "Liverpool",
      "Louisiana",
      "Manhattan",
      "Minnesota",
      "Vancouver",
      "Wisconsin",
      "Queensland",
      "Adobe",
      "Yahoo",
      "Firefox",
      "Bluetooth",
      "Panasonic",
      "Photoshop",
      "Wordpress",
      "Javascript",
      "Powerpoint",
      "Pill",
      "Nurse",
      "Dental",
      "Doctor",
      "Doctors",
      "Medical",
      "Clinical",
      "Therapy",
      "Pregnancy",
      "Radiation",
      "Counseling",
      "Laboratory",
      "Prescription",
      "Psychological",
      "Vote",
      "Voters",
      "Lawyer",
      "Campaign",
      "Congress",
      "Governing",
      "Statutory",
      "Litigation",
      "Legislation",
      "Constitution",
      "Corporations",
      "Lover",
      "Romance",
      "Bingo",
      "Latex",
      "Crash",
      "Fighter",
      "Threats",
      "Accident",
      "Wrestling",
      "Strike",
      "Burning",
      "Warning",
      "Warrant",
      "Hurricane",
      "Angel",
      "Eden",
      "Glory",
      "Santa",
      "Christina",
      "Christopher",
      "Duskfall",
      "Hearthstone",
      "Clearbrook",
      "Quietwater",
      "Springwater",
      "Rillstone",
      "Sunnyside",
      "Corps",
      "Rhythm",
      "Through",
      "Schedule",
      "Accommodation",
      "Classification",
      "Implementation",
      "Petunia",
    ]);
  });

  test("keeps latest Chinese sub-agent review findings out", () => {
    assertBlockedWordsAbsent(chineseWords, [
      "剑",
      "盾",
      "弓",
      "箭",
      "斗",
      "射箭",
      "格斗",
      "击剑",
      "菜刀",
      "弓箭手",
      "斗兽棋",
      "医",
      "症",
      "疗",
      "药水",
      "医院",
      "医生",
      "诊所",
      "药品",
      "西药",
      "医学",
      "药盒",
      "庙",
      "神",
      "仙",
      "祭",
      "祭坛",
      "神殿",
      "祭司",
      "神像",
      "庙宇",
      "圣诞",
      "万圣",
      "庙会",
      "祈福",
      "香火",
      "祭祀",
      "神明",
      "神灵",
      "神器",
      "酒",
      "啤酒",
      "红酒",
      "白酒",
      "酒吧",
      "香槟",
      "酒庄",
      "饮酒",
      "酒馆",
      "骰子",
      "扑克",
      "桥牌",
      "奖池",
      "奖券",
      "奖金",
      "爱情",
      "情人",
      "成人礼",
      "内衣",
      "崇明",
      "小连",
      "太湖",
      "云湖",
      "南城",
      "南溪",
      "南阳",
      "南港",
      "西山",
      "西溪",
      "西园",
      "白洋淀",
      "嘉陵江",
      "雅砻江",
      "澜沧江",
      "金沙江",
      "大渡河",
      "大明湖",
      "快手",
      "美拍",
      "映客",
      "贴吧",
      "滴滴",
      "携程",
      "安踏",
      "迪奥",
      "芬迪",
      "古驰",
      "耐克",
      "博朗",
      "雅典",
      "巴特尔",
      "唢呐",
      "巴乌",
      "萨克斯",
      "曼陀林",
      "乌克丽丽",
      "人参",
      "龙胆",
      "黄芪",
      "当归",
      "白芍",
      "甘草",
      "桂枝",
      "柴胡",
      "天麻",
      "白术",
      "茯苓",
      "丹参",
      "五味子",
      "女贞子",
      "何首乌",
      "木贼",
    ]);
  });

  test("keeps latest Japanese sub-agent review findings out", () => {
    assertBlockedWordsAbsent(japaneseWords, [
      "でつぞう",
      "ちさい",
      "ひとじち",
      "じらい",
      "ほうちょう",
      "なぐる",
      "ざんこく",
      "ようじょ",
      "ぱち",
      "たからくじ",
      "だいとうりょう",
      "せんきょ",
      "じんじゃ",
      "てら",
      "ぶっきょう",
      "せいしょ",
      "しんじゃ",
      "ちゅうしゃ",
      "けつえき",
      "いしゃ",
      "しんぞう",
      "りんしょう",
      "さとう",
      "はるか",
      "けいこ",
      "けんじ",
      "さやか",
      "こまごめ",
      "こんどう",
      "めいじ",
      "べっと",
      "とまと",
      "りっち",
    ]);
  });

  test("keeps Spanish codebook URL-safe and neutral", () => {
    assert.equal(spanishWords.length, 5000);
    assert.equal(new Set(spanishWords).size, spanishWords.length);
    assert.deepEqual(
      spanishWords.filter((word) => !/^[A-Z][a-z]+$/.test(word)),
      [],
    );
    assert.deepEqual(
      spanishWords.filter((word) => word.length > 12),
      [],
    );
    assertBlockedWordsAbsent(spanishWords, [
      "Sexo",
      "Casino",
      "Apuesta",
      "Arma",
      "Guerra",
      "Militar",
      "Droga",
      "Medico",
      "Politica",
      "Religion",
      "Crimen",
      "Muerte",
      "Odio",
      "Violencia",
    ]);
  });
});
