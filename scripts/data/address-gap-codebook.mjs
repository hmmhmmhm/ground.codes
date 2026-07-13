import { additionalStandaloneWordsA } from "./address-gap-additional-words-a.mjs";
import { additionalStandaloneWordsB } from "./address-gap-additional-words-b.mjs";
import { baseWordsA } from "./address-gap-base-words-a.mjs";
import { baseWordsB } from "./address-gap-base-words-b.mjs";
import { expansionMoreWords } from "./address-gap-expansion-more.mjs";
import { expansionSeedWordsA } from "./address-gap-expansion-seeds-a.mjs";
import { expansionSeedWordsB } from "./address-gap-expansion-seeds-b.mjs";

const commonLatinPattern = /^[A-Z][a-z]+$/u;
const scriptPatterns = {
  bengali: /^[\p{Script=Bengali}\p{Mark}]+$/u,
  urdu: /^[\p{Script=Arabic}\p{Mark}]+$/u,
  amharic: /^[\p{Script=Ethiopic}\p{Mark}]+$/u,
  burmese: /^[\p{Script=Myanmar}\p{Mark}]+$/u,
  khmer: /^[\p{Script=Khmer}\p{Mark}]+$/u,
  nepali: /^[\p{Script=Devanagari}\p{Mark}]+$/u,
  pashto: /^[\p{Script=Arabic}\p{Mark}]+$/u,
};

const titleAscii = (value) => {
  const compact = String(value)
    .normalize("NFD")
    .replace(/\p{Mark}/gu, "")
    .replace(/[^A-Za-z]/g, "")
    .toLowerCase();
  if (!compact) return "";
  return `${compact[0].toUpperCase()}${compact.slice(1)}`;
};

const compactScript = (value) =>
  String(value)
    .normalize("NFC")
    .replace(/[\s’'`´/#?\-.,،]/g, "")
    .trim();

const baseWords = {
  ...baseWordsA,
  ...baseWordsB,
};

const expansionSeedWords = {
  ...expansionSeedWordsA,
  ...expansionSeedWordsB,
};

Object.assign(baseWords, expansionSeedWords);

const additionalStandaloneWords = {
  ...additionalStandaloneWordsA,
  ...additionalStandaloneWordsB,
};

const blocked = {
  swahili: new Set(["vita", "damu", "silaha", "ngono", "kasino", "pombe"]),
  filipino: new Set(["digma", "dugo", "baril", "sugal", "alak"]),
  hausa: new Set(["yaki", "jini", "bindiga", "caca", "giya"]),
  bengali: new Set(["যুদ্ধ", "রক্ত", "অস্ত্র", "জুয়া", "মদ"]),
  urdu: new Set(["جنگ", "خون", "ہتھیار", "جوا", "شراب"]),
  amharic: new Set(["ጦርነት", "ደም", "መሳሪያ", "ቁማር", "አልኮል"]),
  burmese: new Set(["စစ်", "သွေး", "လက်နက်"]),
  khmer: new Set(["សង្គ្រាម", "ឈាម", "អាវុធ"]),
  nepali: new Set(["युद्ध", "रगत", "हतियार", "जुवा", "रक्सी"]),
  somali: new Set(["Dagaal", "Dhiig", "Hub", "Khamri"]),
  pashto: new Set(["جګړه", "وینه", "وسله", "قمار", "شراب"]),
  lingala: new Set(["Etumba", "Makila", "Mondoki", "Masanga"]),
};

const codebookTransliterationMaps = {
  burmese: {
    pairs: [
      [/ng/gi, "င"],
      [/ny/gi, "ည"],
      [/th/gi, "သ"],
      [/sh/gi, "ရှ"],
      [/ch/gi, "ချ"],
      [/ph/gi, "ဖ"],
      [/kh/gi, "ခ"],
    ],
    chars: {
      a: "အ",
      b: "ဗ",
      c: "က",
      d: "ဒ",
      e: "ေ",
      f: "ဖ",
      g: "ဂ",
      h: "ဟ",
      i: "ိ",
      j: "ဂျ",
      k: "က",
      l: "လ",
      m: "မ",
      n: "န",
      o: "ို",
      p: "ပ",
      q: "က",
      r: "ရ",
      s: "စ",
      t: "တ",
      u: "ု",
      v: "ဗ",
      w: "ဝ",
      x: "က်စ",
      y: "ယ",
      z: "ဇ",
    },
  },
  khmer: {
    pairs: [
      [/ng/gi, "ង"],
      [/ny/gi, "ញ"],
      [/th/gi, "ថ"],
      [/ch/gi, "ច"],
      [/ph/gi, "ផ"],
      [/kh/gi, "ខ"],
      [/tr/gi, "ត្រ"],
    ],
    chars: {
      a: "អ",
      b: "ប",
      c: "ក",
      d: "ដ",
      e: "េ",
      f: "ហ្វ",
      g: "គ",
      h: "ហ",
      i: "ិ",
      j: "ជ",
      k: "ក",
      l: "ល",
      m: "ម",
      n: "ន",
      o: "ូ",
      p: "ព",
      q: "ក",
      r: "រ",
      s: "ស",
      t: "ត",
      u: "ុ",
      v: "វ",
      w: "វ",
      x: "ក្ស",
      y: "យ",
      z: "ហ្ស",
    },
  },
  nepali: {
    pairs: [
      [/chh/gi, "छ"],
      [/ch/gi, "च"],
      [/th/gi, "थ"],
      [/ph/gi, "फ"],
      [/kh/gi, "ख"],
      [/gh/gi, "घ"],
      [/bh/gi, "भ"],
      [/dh/gi, "ध"],
      [/sh/gi, "श"],
      [/ny/gi, "ञ"],
      [/ng/gi, "ङ"],
    ],
    chars: {
      a: "अ",
      b: "ब",
      c: "क",
      d: "द",
      e: "े",
      f: "फ",
      g: "ग",
      h: "ह",
      i: "ि",
      j: "ज",
      k: "क",
      l: "ल",
      m: "म",
      n: "न",
      o: "ो",
      p: "प",
      q: "क",
      r: "र",
      s: "स",
      t: "त",
      u: "ु",
      v: "व",
      w: "व",
      x: "क्स",
      y: "य",
      z: "ज",
    },
  },
  pashto: {
    pairs: [
      [/sh/gi, "ش"],
      [/ch/gi, "چ"],
      [/th/gi, "ت"],
      [/ph/gi, "ف"],
      [/kh/gi, "خ"],
      [/gh/gi, "غ"],
      [/ng/gi, "نګ"],
      [/ny/gi, "نی"],
    ],
    chars: {
      a: "ا",
      b: "ب",
      c: "ک",
      d: "د",
      e: "ې",
      f: "ف",
      g: "ګ",
      h: "ه",
      i: "ي",
      j: "ج",
      k: "ک",
      l: "ل",
      m: "م",
      n: "ن",
      o: "و",
      p: "پ",
      q: "ق",
      r: "ر",
      s: "س",
      t: "ت",
      u: "و",
      v: "و",
      w: "و",
      x: "کس",
      y: "ی",
      z: "ز",
    },
  },
};

export const transliterateCodeWord = (language, value) => {
  const spec = codebookTransliterationMaps[language];
  if (!spec) return String(value);
  let normalized = String(value)
    .normalize("NFD")
    .replace(/\p{Mark}/gu, "");
  for (const [pattern, replacement] of spec.pairs) {
    normalized = normalized.replace(pattern, replacement);
  }
  let output = "";
  for (const char of normalized) {
    if (/\d/.test(char) || /\s/.test(char)) {
      output += char;
      continue;
    }
    if (/[A-Za-z]/.test(char)) output += spec.chars[char.toLowerCase()] ?? "";
  }
  return output;
};

const normalizeCodeWord = (language, word) => {
  if (
    ["swahili", "filipino", "hausa", "somali", "lingala"].includes(language)
  ) {
    const candidate = titleAscii(word);
    if (!commonLatinPattern.test(candidate)) return "";
    if (candidate.length > 18) return "";
    return candidate;
  }
  let candidate = compactScript(word);
  if (!scriptPatterns[language]?.test(candidate)) {
    candidate = compactScript(transliterateCodeWord(language, word));
  }
  if (!scriptPatterns[language].test(candidate)) return "";
  if ([...candidate].length > 24) return "";
  return candidate;
};

const makeCodebookSoundKey = (language, word) => {
  if (
    ["swahili", "filipino", "hausa", "somali", "lingala"].includes(language)
  ) {
    return String(word)
      .normalize("NFKD")
      .replace(/\p{Mark}/gu, "")
      .toLowerCase()
      .replace(/c/g, "k")
      .replace(/q/g, "k")
      .replace(/ph/g, "f")
      .replace(/([a-z])\1+/g, "$1");
  }

  const normalized = String(word)
    .normalize("NFC")
    .replace(/[\u200c\u200d\s]/g, "");
  if (language === "urdu") {
    return normalized.replace(/[\u064b-\u065f\u0670]/g, "");
  }
  return normalized.replace(/(.)\1+/gu, "$1");
};

export const buildCodebook = (language) => {
  const words = [];
  const seen = new Set();
  const seenSoundKeys = new Map();
  const add = (word) => {
    const candidate = normalizeCodeWord(language, word);
    if (!candidate) return;
    if (blocked[language].has(candidate.toLowerCase?.() ?? candidate)) return;
    if (blocked[language].has(candidate)) return;
    if (seen.has(candidate)) return;
    const soundKey = makeCodebookSoundKey(language, candidate);
    const soundMatch = seenSoundKeys.get(soundKey);
    if (soundMatch && soundMatch !== candidate) return;
    seen.add(candidate);
    seenSoundKeys.set(soundKey, candidate);
    words.push(candidate);
  };

  const list = [
    ...baseWords[language],
    ...(additionalStandaloneWords[language] ?? []),
  ];
  for (const word of list) add(word);
  for (const prefix of list) {
    for (const suffix of list) {
      if (prefix === suffix) continue;
      add(`${prefix}${suffix}`);
      if (words.length >= 5000) break;
    }
    if (words.length >= 5000) break;
  }

  if (words.length < 5000) {
    throw new Error(`${language} codebook generated ${words.length} words`);
  }
  return words.slice(0, 5000);
};

export const codebookLanguages = Object.keys(baseWords);
