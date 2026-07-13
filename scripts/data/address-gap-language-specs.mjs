import { transliterateCodeWord } from "./address-gap-codebook.mjs";

const latinPairs = [
  [/sh/gi, "শ"],
  [/ch/gi, "চ"],
  [/th/gi, "থ"],
  [/ph/gi, "ফ"],
  [/kh/gi, "খ"],
  [/gh/gi, "ঘ"],
  [/ng/gi, "ং"],
  [/ny/gi, "ন্য"],
];
const bengaliMap = new Map(
  Object.entries({
    a: "া",
    b: "ব",
    c: "ক",
    d: "দ",
    e: "ে",
    f: "ফ",
    g: "গ",
    h: "হ",
    i: "ি",
    j: "জ",
    k: "ক",
    l: "ল",
    m: "ম",
    n: "ন",
    o: "ো",
    p: "প",
    q: "ক",
    r: "র",
    s: "স",
    t: "ত",
    u: "ু",
    v: "ভ",
    w: "ও",
    x: "ক্স",
    y: "য়",
    z: "জ",
  }),
);
const urduPairs = [
  [/sh/gi, "ش"],
  [/ch/gi, "چ"],
  [/th/gi, "ت"],
  [/ph/gi, "ف"],
  [/kh/gi, "خ"],
  [/gh/gi, "غ"],
  [/ng/gi, "نگ"],
  [/ny/gi, "نی"],
];
const urduMap = new Map(
  Object.entries({
    a: "ا",
    b: "ب",
    c: "ک",
    d: "د",
    e: "ے",
    f: "ف",
    g: "گ",
    h: "ہ",
    i: "ی",
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
  }),
);
const amharicPairs = [
  [/sh/gi, "ሽ"],
  [/ch/gi, "ች"],
  [/th/gi, "ት"],
  [/ph/gi, "ፍ"],
  [/kh/gi, "ክ"],
  [/gh/gi, "ግ"],
  [/ng/gi, "ንግ"],
  [/ny/gi, "ኝ"],
];
const amharicMap = new Map(
  Object.entries({
    a: "አ",
    b: "ብ",
    c: "ክ",
    d: "ድ",
    e: "ኤ",
    f: "ፍ",
    g: "ግ",
    h: "ህ",
    i: "ኢ",
    j: "ጅ",
    k: "ክ",
    l: "ል",
    m: "ም",
    n: "ን",
    o: "ኦ",
    p: "ፕ",
    q: "ቅ",
    r: "ር",
    s: "ስ",
    t: "ት",
    u: "ኡ",
    v: "ቭ",
    w: "ው",
    x: "ክስ",
    y: "ይ",
    z: "ዝ",
  }),
);

const foldLatin = (value) =>
  String(value)
    .normalize("NFD")
    .replace(/\p{Mark}/gu, "")
    .replace(/[’'`´/#?\-]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const transliterate = (value, pairs, map) => {
  let normalized = foldLatin(value);
  for (const [pattern, replacement] of pairs)
    normalized = normalized.replace(pattern, replacement);
  let output = "";
  for (const char of normalized) {
    if (/\d/.test(char) || /\s/.test(char)) {
      output += char;
      continue;
    }
    output += map.get(char.toLowerCase()) ?? "";
  }
  return output.replace(/\s+/g, " ").trim();
};

export const languageSpecs = {
  swahili: {
    region: (name) =>
      foldLatin(name)
        .replace(/\bOcean\b/g, "Bahari")
        .replace(/\bSea\b/g, "Bahari")
        .replace(/\bBay\b/g, "Ghuba")
        .replace(/\bGulf\b/g, "Ghuba")
        .replace(/\bLake\b/g, "Ziwa")
        .replace(/\bRiver\b/g, "Mto"),
    overrides: {
      1642911: "Jakarta",
      1835848: "Seoul",
      1273294: "Delhi",
      360630: "Kairo",
    },
  },
  filipino: {
    region: (name) =>
      foldLatin(name)
        .replace(/\bOcean\b/g, "Karagatan")
        .replace(/\bSea\b/g, "Dagat")
        .replace(/\bBay\b/g, "Look")
        .replace(/\bGulf\b/g, "Golpo")
        .replace(/\bLake\b/g, "Lawa")
        .replace(/\bRiver\b/g, "Ilog"),
    overrides: {
      1642911: "Jakarta",
      1835848: "Seoul",
      1273294: "Delhi",
      360630: "Cairo",
    },
  },
  hausa: {
    region: (name) =>
      foldLatin(name)
        .replace(/\bOcean\b/g, "Teku")
        .replace(/\bSea\b/g, "Teku")
        .replace(/\bBay\b/g, "Guba")
        .replace(/\bGulf\b/g, "Guba")
        .replace(/\bLake\b/g, "Tabki")
        .replace(/\bRiver\b/g, "Kogi"),
    overrides: {
      1642911: "Jakarta",
      1835848: "Seoul",
      1273294: "Delhi",
      360630: "Alkahira",
    },
  },
  bengali: {
    region: (name) =>
      transliterate(name, latinPairs, bengaliMap)
        .replace(/োকেআন/g, "সমুদ্র")
        .replace(/সো/g, "সমুদ্র"),
    overrides: {
      1642911: "জাকার্তা",
      1835848: "সিউল",
      1273294: "দিল্লি",
      360630: "কায়রো",
    },
  },
  urdu: {
    region: (name) =>
      transliterate(name, urduPairs, urduMap)
        .replace(/وکین/g, "سمندر")
        .replace(/سی/g, "سمندر"),
    overrides: {
      1642911: "جکارتہ",
      1835848: "سیول",
      1273294: "دہلی",
      360630: "قاہرہ",
    },
  },
  amharic: {
    region: (name) =>
      transliterate(name, amharicPairs, amharicMap)
        .replace(/ኦክኤአን/g, "ባሕር")
        .replace(/ስኤአ/g, "ባሕር"),
    overrides: {
      1642911: "ጃካርታ",
      1835848: "ሴኡል",
      1273294: "ዴሊ",
      360630: "ካይሮ",
    },
  },
  burmese: {
    region: (name) => transliterateCodeWord("burmese", name),
    overrides: {
      1642911: "ဂျာကာတာ",
      1835848: "ဆိုးလ်",
      1273294: "ဒေလီ",
      360630: "ကိုင်ရို",
    },
  },
  khmer: {
    region: (name) => transliterateCodeWord("khmer", name),
    overrides: {
      1642911: "ចាការតា",
      1835848: "សេអ៊ូល",
      1273294: "ដេលី",
      360630: "កែរ",
    },
  },
  nepali: {
    region: (name) => transliterateCodeWord("nepali", name),
    overrides: {
      1642911: "जकार्ता",
      1835848: "सोल",
      1273294: "दिल्ली",
      360630: "काहिरा",
    },
  },
  somali: {
    region: (name) =>
      foldLatin(name)
        .replace(/\bOcean\b/g, "Bad")
        .replace(/\bSea\b/g, "Bad")
        .replace(/\bBay\b/g, "Gacanka")
        .replace(/\bGulf\b/g, "Gacanka")
        .replace(/\bLake\b/g, "Haro")
        .replace(/\bRiver\b/g, "Webi"),
    overrides: {
      1642911: "Jakarta",
      1835848: "Seoul",
      1273294: "Delhi",
      360630: "Qaahira",
    },
  },
  pashto: {
    region: (name) => transliterateCodeWord("pashto", name),
    overrides: {
      1642911: "جاکارتا",
      1835848: "سیول",
      1273294: "ډیلي",
      360630: "قاهره",
    },
  },
  lingala: {
    region: (name) =>
      foldLatin(name)
        .replace(/\bOcean\b/g, "Mbu")
        .replace(/\bSea\b/g, "Mbu")
        .replace(/\bBay\b/g, "Libongo")
        .replace(/\bGulf\b/g, "Libongo")
        .replace(/\bLake\b/g, "Etima")
        .replace(/\bRiver\b/g, "Ebale"),
    overrides: {
      1642911: "Jakarta",
      1835848: "Seoul",
      1273294: "Delhi",
      360630: "Kairo",
    },
  },
};

export const webLocaleByLanguage = {
  swahili: { locale: "sw", languageName: "Kiswahili" },
  filipino: { locale: "fil", languageName: "Filipino" },
  hausa: { locale: "ha", languageName: "Hausa" },
  bengali: { locale: "bn", languageName: "বাংলা" },
  urdu: { locale: "ur", languageName: "اردو" },
  amharic: { locale: "am", languageName: "አማርኛ" },
  burmese: { locale: "my", languageName: "မြန်မာ" },
  khmer: { locale: "km", languageName: "ខ្មែរ" },
  nepali: { locale: "ne", languageName: "नेपाली" },
  somali: { locale: "so", languageName: "Soomaali" },
  pashto: { locale: "ps", languageName: "پښتو" },
  lingala: { locale: "ln", languageName: "Lingála" },
};
