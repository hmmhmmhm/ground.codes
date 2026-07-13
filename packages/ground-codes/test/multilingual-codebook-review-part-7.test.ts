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
  test("keeps Indonesian codebook URL-safe and neutral", () => {
    assert.equal(indonesianWords.length, 5000);
    assert.equal(new Set(indonesianWords).size, indonesianWords.length);
    assert.deepEqual(
      indonesianWords.filter((word) => !/^[A-Z][a-z]+$/.test(word)),
      [],
    );
    assert.deepEqual(
      indonesianWords.filter((word) => word.length > 12),
      [],
    );
    assertWordsPresent(indonesianWords, [
      "Akar",
      "Angin",
      "Bambu",
      "Beras",
      "Bunga",
      "Cahaya",
      "Cemara",
      "Cincin",
      "Daun",
      "Gayung",
      "Genteng",
      "Handuk",
      "Ilalang",
      "Jahe",
      "Kawah",
      "Kebaya",
      "Kelapa",
      "Kompas",
      "Langit",
      "Laut",
      "Lentera",
      "Lilin",
      "Lobak",
      "Lumbung",
      "Pandan",
      "Patung",
      "Pelangi",
      "Rempah",
      "Rumah",
      "Sambal",
      "Sawah",
      "Sepeda",
      "Sisir",
      "Sungai",
      "Toples",
      "Ukiran",
      "Zamrud",
      "Apel",
      "Kamera",
      "Kulkas",
      "Meja",
      "Pensil",
      "Tenda",
      "Warung",
      "Akuarium",
      "Amplop",
      "Boneka",
      "Daster",
      "Gedung",
      "Gendang",
      "Ponsel",
      "Radio",
    ]);
    assertBlockedWordsAbsent(indonesianWords, [
      "Halia",
      "Judi",
      "Narkoba",
      "Papaya",
      "Politik",
      "Senjata",
      "Seks",
      "Utang",
      "Akarawan",
      "Awankaleng",
      "Bambubilik",
      "Cabaikayu",
      "Emaskuning",
      "Garamwangi",
      "Gelasakar",
      "Gulabening",
      "Hutanhalus",
      "Kacakayu",
      "Kainkayu",
      "Kapaskayu",
      "Karetkayu",
      "Karetwangi",
      "Kerangkuning",
      "Kertasmanis",
      "Kelapakayu",
      "Lautdulang",
      "Mericajernih",
      "Ombakbenda",
      "Palaguci",
      "Pancisegar",
      "Perakutuh",
      "Pitakapas",
      "Rotankuning",
      "Saguangin",
      "Sikatkayu",
      "Sikattipis",
      "Telurbilik",
      "Topijernih",
      "Tomatcawan",
      "Wadahbenda",
      "Warnakapas",
      "Zaitunkapas",
    ]);
  });

  test("keeps Thai codebook URL-safe and neutral", () => {
    assert.equal(thaiWords.length, 5000);
    assert.equal(new Set(thaiWords).size, thaiWords.length);
    assert.deepEqual(
      thaiWords.filter((word) => !/^[\p{Script=Thai}]+$/u.test(word)),
      [],
    );
    assert.deepEqual(
      thaiWords.filter((word) => [...word].length > 12),
      [],
    );
    assertWordsPresent(thaiWords, [
      "น้ำ",
      "ไฟ",
      "บ้าน",
      "สวน",
      "ดอกไม้",
      "ข้าว",
      "ตลาด",
      "ภูเขา",
      "ทะเล",
      "แม่น้ำ",
      "สะพาน",
      "ตะกร้า",
      "มะม่วง",
      "มะพร้าว",
      "ผ้าไหม",
      "ปลาทู",
      "มะเขือ",
      "แตงกวา",
      "กะหล่ำ",
      "กระติก",
      "ชั้นวาง",
      "หม้อดิน",
      "ตะกร้าไม้",
      "กล่องกระดาษ",
    ]);
    assertBlockedWordsAbsent(thaiWords, [
      "พนัน",
      "ยาเสพติด",
      "อาวุธ",
      "การเมือง",
      "ศาสนา",
      "หนี้",
      "ป่วย",
      "ตาย",
      "เหล้า",
      "บุหรี่",
      "คาสิโน",
      "ปืน",
      "เลือด",
      "คุก",
      "ฆ่า",
      "เซ็กซ์",
      "ไฟดี",
      "นกยาว",
      "แมวยาว",
      "น้ำสูง",
      "ปลาแบน",
      "ข้าวหนัก",
      "ม้าเล็ก",
      "ช้างต่ำ",
    ]);
  });

  test("keeps Vietnamese codebook URL-safe and neutral", () => {
    assert.equal(vietnameseWords.length, 5000);
    assert.equal(new Set(vietnameseWords).size, vietnameseWords.length);
    assert.deepEqual(
      vietnameseWords.filter(
        (word) => !/^[\p{Script=Latin}\p{Mark}]+$/u.test(word),
      ),
      [],
    );
    assert.deepEqual(
      vietnameseWords.filter((word) => /[\s\-/#?]/.test(word)),
      [],
    );
    assert.deepEqual(
      vietnameseWords.filter((word) => [...word].length > 14),
      [],
    );
    assertWordsPresent(vietnameseWords, [
      "nước",
      "lửa",
      "nhà",
      "vườn",
      "gạo",
      "chợ",
      "cầu",
      "sông",
      "biển",
      "núi",
      "hoa",
      "tre",
      "mây",
      "mưa",
      "dừa",
      "chuối",
      "xoài",
      "càphê",
      "giỏ",
      "đèn",
      "áodài",
      "bánhmì",
      "nónlá",
      "hoasen",
      "chuônggió",
      "đènlồng",
      "bìnhhoa",
      "bànchải",
      "cửasổ",
      "bảnđồ",
      "hộpbút",
      "đồnghồ",
      "máyảnh",
      "máyquạt",
      "máybay",
      "cầuthang",
      "sânkhấu",
      "lọhoa",
      "túixách",
      "bánhcuốn",
      "búnchả",
      "cánhđồng",
      "đồichè",
      "rừngtrúc",
      "lốimòn",
      "đìnhlàng",
      "sânđình",
      "chòilá",
      "bờkênh",
      "đầmsen",
      "vườnổi",
    ]);
    assertBlockedWordsAbsent(vietnameseWords, [
      "cờbạc",
      "matúy",
      "vũkhí",
      "chínhtrị",
      "tôngiáo",
      "nợ",
      "bệnh",
      "chết",
      "rượu",
      "bia",
      "thuốclá",
      "súng",
      "máu",
      "tù",
      "giết",
      "tìnhdục",
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
    ]);
  });
});
