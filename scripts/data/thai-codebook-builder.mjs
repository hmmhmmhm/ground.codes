import {
  colorRoots,
  colorSuffixes,
  materialSuffixes,
  natureQualityPairs,
  objectMaterialRoots,
  roundFlatRoots,
  smallLargeRoots,
  tasteFragranceRoots,
} from "./thai-codebook-parts-a.mjs";
import {
  naturalSuffixes,
  objectSuffixes,
  prefixes,
} from "./thai-codebook-parts-b.mjs";
import {
  awkwardAttributeRoots,
  awkwardAttributeSuffixes,
  blockedCodebookWords,
} from "./thai-codebook-policy.mjs";
import { thaiStandaloneWordsPart1 } from "./thai-standalone-words-1.mjs";
import { thaiStandaloneWordsPart2 } from "./thai-standalone-words-2.mjs";
import { thaiStandaloneWordsPart3 } from "./thai-standalone-words-3.mjs";
import { thaiStandaloneWordsPart4 } from "./thai-standalone-words-4.mjs";

const thaiScriptPattern = /^[\p{Script=Thai}]+$/u;

const normalizeThaiWord = (value) =>
  String(value)
    .replace(/[\s\-/#?]/g, "")
    .trim();

const characterLength = (value) => [...String(value)].length;

const standaloneWords = [
  ...thaiStandaloneWordsPart1,
  ...thaiStandaloneWordsPart2,
  ...thaiStandaloneWordsPart3,
  ...thaiStandaloneWordsPart4,
];

const isAwkwardThaiCompound = (candidate) => {
  if (blockedCodebookWords.has(candidate)) return true;
  for (const root of awkwardAttributeRoots) {
    for (const suffix of awkwardAttributeSuffixes) {
      if (candidate === `${root}${suffix}`) return true;
    }
  }
  return false;
};

const fallbackNaturalSuffixes = naturalSuffixes.filter(
  (suffix) =>
    !new Set([
      "ดี",
      "สูง",
      "ต่ำ",
      "หนัก",
      "แบน",
      "กว้าง",
      "แคบ",
      "ยาว",
      "สั้น",
      "หนา",
      "บาง",
      "เบา",
      "ไม้",
      "หิน",
      "ดิน",
      "ทอง",
      "เงิน",
      "แก้ว",
      "ทราย",
      "ลาย",
      "ร่ม",
      "รื่น",
      "สวย",
      "เย็น",
      "อุ่น",
      "เรียบ",
      "เงา",
      "แห้ง",
      "ชุ่ม",
      "นิ่ง",
      "ไหล",
      "สุก",
      "อ่อน",
      "แก่",
      "เรียว",
      "หอมหวาน",
      "สดใส",
      "เรียบงาม",
    ]).has(suffix),
);

export const buildThaiCodebook = () => {
  const words = [];
  const seen = new Set();

  const add = (word) => {
    const candidate = normalizeThaiWord(word);
    if (!candidate) return;
    if (!thaiScriptPattern.test(candidate)) return;
    if (characterLength(candidate) > 12) return;
    if (isAwkwardThaiCompound(candidate)) return;
    if (seen.has(candidate)) return;
    seen.add(candidate);
    words.push(candidate);
  };

  for (const word of standaloneWords) add(word);

  for (const root of objectMaterialRoots) {
    for (const suffix of materialSuffixes) add(`${root}${suffix}`);
  }

  for (const root of colorRoots) {
    for (const suffix of colorSuffixes) add(`${root}${suffix}`);
  }

  for (const root of smallLargeRoots) {
    add(`${root}เล็ก`);
    add(`${root}ใหญ่`);
  }

  for (const root of roundFlatRoots) {
    add(`${root}กลม`);
    add(`${root}แบน`);
  }

  for (const root of tasteFragranceRoots) {
    add(`${root}หอม`);
    add(`${root}หวาน`);
    add(`${root}สด`);
  }

  for (const [root, suffix] of natureQualityPairs) {
    add(`${root}${suffix}`);
  }

  for (const root of objectMaterialRoots) {
    add(`${root}ใหม่`);
    add(`${root}สวย`);
    add(`${root}งาม`);
    add(`${root}ลาย`);
    add(`${root}เรียบ`);
    add(`${root}เล็ก`);
    add(`${root}ใหญ่`);
    add(`${root}กลม`);
    add(`${root}ใส`);
    add(`${root}เบา`);
    add(`${root}บาง`);
    add(`${root}หนา`);
    add(`${root}แข็ง`);
    add(`${root}นุ่ม`);
    add(`${root}กว้าง`);
    add(`${root}ยาว`);
    add(`${root}สั้น`);
    add(`${root}สูง`);
    add(`${root}สะอาด`);
    for (const suffix of colorSuffixes) {
      add(`${root}${suffix}`);
    }
  }

  for (const root of colorRoots) {
    add(`${root}งาม`);
    add(`${root}สวย`);
    add(`${root}สด`);
    add(`${root}ใหม่`);
    add(`${root}ใส`);
  }

  for (const suffix of fallbackNaturalSuffixes) {
    for (const prefix of prefixes) {
      add(`${prefix}${suffix}`);
      if (words.length >= 5000) break;
    }
    if (words.length >= 5000) break;
  }

  for (const suffix of objectSuffixes) {
    for (const prefix of prefixes) {
      if (prefix === suffix) continue;
      add(`${prefix}${suffix}`);
      if (words.length >= 5000) break;
    }
    if (words.length >= 5000) break;
  }

  if (words.length < 5000) {
    throw new Error(`Thai codebook generated ${words.length} words`);
  }

  return words.slice(0, 5000);
};
