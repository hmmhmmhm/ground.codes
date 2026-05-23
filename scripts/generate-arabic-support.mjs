import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const root = new URL("../", import.meta.url);
const geointRequire = createRequire(
  new URL("../packages/geoint/", import.meta.url),
);
const { default: KDBush } = await import(geointRequire.resolve("kdbush"));
const { Level } = await import(geointRequire.resolve("level"));

const readJson = (filePath) =>
  JSON.parse(readFileSync(new URL(filePath, root), "utf8"));
const writeJson = (filePath, value) =>
  writeFileSync(new URL(filePath, root), `${JSON.stringify(value, null, 2)}\n`);

const arabicWordPattern = /^[\p{Script=Arabic}\p{Mark}]+$/u;

const blockedTokens = new Set([
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

const standaloneWords = [
  "ماء",
  "بيت",
  "نهر",
  "جبل",
  "زهرة",
  "ورد",
  "شاي",
  "كتاب",
  "مصباح",
  "خبز",
  "أرز",
  "تمر",
  "تفاح",
  "موز",
  "تين",
  "زيتون",
  "نخيل",
  "شجرة",
  "سوق",
  "طريق",
  "جسر",
  "حديقة",
  "حقل",
  "ورقة",
  "تراب",
  "حجر",
  "رمل",
  "بحيرة",
  "بركة",
  "بحر",
  "شاطئ",
  "قارب",
  "قطار",
  "حافلة",
  "سيارة",
  "ساحة",
  "فناء",
  "كوب",
  "وعاء",
  "ملعقة",
  "قلم",
  "لون",
  "سحابة",
  "شمس",
  "قمر",
  "نجم",
  "هواء",
  "مطر",
  "قماش",
  "كرسي",
  "طاولة",
  "صندوق",
  "سلة",
  "حبل",
  "حصير",
  "ستارة",
  "إناء",
  "قدر",
  "سقف",
  "جدار",
  "درج",
  "ممر",
  "حي",
  "مدينة",
  "قرية",
  "دكان",
  "بهار",
  "زنجبيل",
  "نعناع",
  "ريحان",
  "ياسمين",
  "حناء",
  "قمح",
  "حمص",
  "فول",
  "عدس",
  "بطاطا",
  "طماطم",
  "جزر",
  "خيار",
  "نعمة",
  "حليب",
  "لبن",
  "جبن",
  "عسل",
  "حلوى",
  "لوز",
  "جوز",
  "رمان",
  "عنب",
  "ليمون",
  "برتقال",
  "خوخ",
  "كمثرى",
  "بطيخ",
  "شمام",
  "قرفة",
  "هيل",
  "زعفران",
  "ريح",
  "ندى",
  "ظل",
  "ضوء",
  "فجر",
  "مساء",
  "ربيع",
  "صيف",
  "خريف",
  "شتاء",
  "مرج",
  "وادي",
  "تل",
  "غابة",
  "جزيرة",
  "مرفأ",
  "منارة",
  "نافورة",
  "بوابة",
  "نافذة",
  "باب",
  "مفتاح",
  "خريطة",
  "رسالة",
  "لوحة",
  "دفتر",
  "مكتبة",
  "مدرسة",
  "ملعب",
  "متحف",
  "مقهى",
  "مخبز",
  "مطعم",
  "حداد",
  "نجار",
  "خياط",
  "نسيج",
  "صوف",
  "قطن",
  "حرير",
  "فضة",
  "نحاس",
  "ذهب",
  "زجاج",
  "خشب",
  "طين",
  "رخام",
  "مرآة",
  "ساعة",
  "جرس",
  "لؤلؤ",
  "مرجان",
  "صدف",
  "عود",
  "ناي",
  "طبل",
  "لحن",
  "صوت",
  "بسمة",
  "فرح",
  "أمل",
  "صفاء",
  "هدوء",
  "سلام",
  "نور",
  "جمال",
  "كرم",
  "لطف",
  "سفر",
  "موسم",
  "موج",
  "نبع",
  "غدير",
  "قمة",
  "سهل",
  "بستان",
  "مزرعة",
  "سنبل",
  "زهور",
  "براعم",
  "غصن",
  "جذر",
  "ثمرة",
  "عبير",
  "رائحة",
  "طائر",
  "حمام",
  "نورس",
  "بلبل",
  "غزال",
  "حصان",
  "جمل",
  "قطة",
  "بساط",
  "وسادة",
  "لحاف",
  "قنديل",
  "شمعة",
  "طبق",
  "صحن",
  "كيس",
  "جرة",
  "دلو",
  "مشط",
  "خاتم",
  "سوار",
];

const natureRoots = [
  "ماء",
  "نهر",
  "جبل",
  "بحر",
  "بحيرة",
  "رمل",
  "حجر",
  "غابة",
  "وادي",
  "مرج",
  "تل",
  "جزيرة",
  "شاطئ",
  "سحابة",
  "مطر",
  "شمس",
  "قمر",
  "نجم",
  "ريح",
  "ندى",
  "نبع",
  "غدير",
  "موج",
  "قمة",
  "سهل",
  "ظل",
  "ضوء",
];

const plantRoots = [
  "ورد",
  "زهرة",
  "نخيل",
  "شجرة",
  "نعناع",
  "ريحان",
  "ياسمين",
  "حناء",
  "زيتون",
  "سنبل",
  "غصن",
  "جذر",
  "بستان",
  "قمح",
  "زعفران",
  "لوز",
  "رمان",
  "تين",
  "تمر",
  "عنب",
  "ليمون",
  "برتقال",
  "خوخ",
  "بطيخ",
];

const objectRoots = [
  "بيت",
  "كتاب",
  "قلم",
  "مصباح",
  "كوب",
  "وعاء",
  "ملعقة",
  "كرسي",
  "طاولة",
  "صندوق",
  "سلة",
  "حبل",
  "حصير",
  "ستارة",
  "باب",
  "نافذة",
  "مفتاح",
  "خريطة",
  "دفتر",
  "لوحة",
  "مرآة",
  "ساعة",
  "جرس",
  "بساط",
  "وسادة",
  "قنديل",
  "شمعة",
  "طبق",
  "جرة",
];

const placeSuffixes = [
  "بيت",
  "سوق",
  "طريق",
  "جسر",
  "حديقة",
  "حقل",
  "شاطئ",
  "مرفأ",
  "منارة",
  "بوابة",
  "ممر",
  "ساحة",
  "حي",
  "مدينة",
  "قرية",
  "دكان",
  "مقهى",
  "مخبز",
  "متحف",
  "مكتبة",
];

const colorSuffixes = [
  "أبيض",
  "أزرق",
  "أخضر",
  "أحمر",
  "أصفر",
  "فضي",
  "ذهبي",
  "وردي",
  "بنفسجي",
  "هادئ",
  "صافي",
  "لامع",
  "ناعم",
  "دافئ",
  "بارد",
  "جميل",
  "لطيف",
  "قريب",
  "بعيد",
];

const materialRoots = [
  "خشب",
  "طين",
  "زجاج",
  "نحاس",
  "فضة",
  "ذهب",
  "قطن",
  "صوف",
  "حرير",
  "رخام",
  "لؤلؤ",
  "مرجان",
  "صدف",
  "حجر",
  "رمل",
];

const foodRoots = [
  "خبز",
  "أرز",
  "تمر",
  "تفاح",
  "موز",
  "تين",
  "زيتون",
  "حليب",
  "لبن",
  "جبن",
  "عسل",
  "لوز",
  "جوز",
  "رمان",
  "عنب",
  "ليمون",
  "برتقال",
  "خوخ",
  "بطيخ",
  "شمام",
  "حمص",
  "فول",
  "عدس",
  "جزر",
  "خيار",
];

const descriptorPrefixes = [
  "نور",
  "صفاء",
  "هدوء",
  "بسمة",
  "فرح",
  "أمل",
  "جمال",
  "كرم",
  "لطف",
  "عبير",
  "ربيع",
  "فجر",
  "مساء",
  "موسم",
];

const addToken = (tokens, value) => {
  const token = value.normalize("NFC").replace(/[\s\-/#?'’`´ـ]/gu, "");
  if (!token) return;
  if (blockedTokens.has(token)) return;
  if ([...token].length > 14) return;
  if (!arabicWordPattern.test(token)) return;
  tokens.add(token);
};

const addPairs = (tokens, leftItems, rightItems) => {
  for (const left of leftItems) {
    for (const right of rightItems) {
      if (left === right) continue;
      addToken(tokens, `${left}${right}`);
    }
  }
};

const buildArabicCodebook = () => {
  const tokens = new Set();
  for (const word of standaloneWords) addToken(tokens, word);

  addPairs(tokens, natureRoots, placeSuffixes);
  addPairs(tokens, natureRoots, colorSuffixes);
  addPairs(tokens, plantRoots, objectRoots);
  addPairs(tokens, plantRoots, placeSuffixes);
  addPairs(tokens, plantRoots, colorSuffixes);
  addPairs(tokens, objectRoots, colorSuffixes);
  addPairs(tokens, materialRoots, objectRoots);
  addPairs(tokens, foodRoots, colorSuffixes);
  addPairs(tokens, descriptorPrefixes, natureRoots);
  addPairs(tokens, descriptorPrefixes, plantRoots);
  addPairs(tokens, descriptorPrefixes, objectRoots);
  addPairs(tokens, colorSuffixes, objectRoots);
  addPairs(tokens, colorSuffixes, natureRoots);
  addPairs(tokens, colorSuffixes, plantRoots);
  addPairs(tokens, placeSuffixes, natureRoots);
  addPairs(tokens, placeSuffixes, plantRoots);
  addPairs(tokens, materialRoots, colorSuffixes);
  addPairs(tokens, foodRoots, objectRoots);
  addPairs(tokens, objectRoots, placeSuffixes);
  addPairs(tokens, plantRoots, foodRoots);

  const words = [...tokens].slice(0, 5000);
  if (words.length !== 5000) {
    throw new Error(`Arabic codebook has ${words.length} entries`);
  }
  return words;
};

const arabicRegionOverrides = new Map([
  ["360630", "القاهرة"],
  ["360995", "الجيزة"],
  ["361058", "الإسكندرية"],
  ["108410", "الرياض"],
  ["292223", "دبي"],
  ["292672", "أبوظبي"],
  ["745044", "إسطنبول"],
  ["1835848", "سيول"],
  ["1850147", "طوكيو"],
  ["1816670", "بكين"],
  ["1275339", "مومباي"],
  ["1273294", "دلهي"],
  ["2643743", "لندن"],
  ["2988507", "باريس"],
  ["2950159", "برلين"],
  ["2267057", "لشبونة"],
  ["1642911", "جاكرتا"],
  ["1609350", "بانكوك"],
  ["1581130", "هانوي"],
  ["5128581", "نيويورك"],
  ["5368361", "لوسأنجلوس"],
]);

const removeUnsafeRegionChars = (value) =>
  String(value)
    .replace(/[’'`´/#?\-]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const latinMap = new Map([
  ["a", "ا"],
  ["b", "ب"],
  ["c", "ك"],
  ["d", "د"],
  ["e", "ي"],
  ["f", "ف"],
  ["g", "ج"],
  ["h", "ه"],
  ["i", "ي"],
  ["j", "ج"],
  ["k", "ك"],
  ["l", "ل"],
  ["m", "م"],
  ["n", "ن"],
  ["o", "و"],
  ["p", "ب"],
  ["q", "ق"],
  ["r", "ر"],
  ["s", "س"],
  ["t", "ت"],
  ["u", "و"],
  ["v", "ف"],
  ["w", "و"],
  ["x", "كس"],
  ["y", "ي"],
  ["z", "ز"],
]);

const transliterateLatinWord = (word) => {
  let value = word
    .normalize("NFD")
    .replace(/\p{Mark}/gu, "")
    .replace(/ph/gi, "f")
    .replace(/sh/gi, "ش")
    .replace(/ch/gi, "تش")
    .replace(/th/gi, "ث")
    .replace(/kh/gi, "خ")
    .replace(/gh/gi, "غ")
    .replace(/qu/gi, "كو");

  let output = "";
  for (const char of value) {
    if (/\d/.test(char)) {
      output += char;
      continue;
    }
    if (/\s/.test(char)) {
      output += " ";
      continue;
    }
    if (/[\p{Script=Arabic}\p{Mark}]/u.test(char)) {
      output += char;
      continue;
    }
    const mapped = latinMap.get(char.toLowerCase());
    if (mapped) output += mapped;
  }
  return output.replace(/\s+/g, " ").trim();
};

const translateEarthRegionName = (row) =>
  arabicRegionOverrides.get(String(row.code)) ??
  transliterateLatinWord(removeUnsafeRegionChars(row.name));

const marineTerms = [
  ["Ocean", "محيط"],
  ["Sea", "بحر"],
  ["Bay", "خليج"],
  ["Gulf", "خليج"],
  ["Channel", "قناة"],
  ["Strait", "مضيق"],
  ["Basin", "حوض"],
  ["Ridge", "حيد"],
  ["Plateau", "هضبة"],
  ["Plain", "سهل"],
];

const marineProperFragments = new Map([
  ["Ross", "روس"],
  ["Weddell", "ويدل"],
  ["Amundsen", "أموندسن"],
  ["Bellingshausen", "بلنغسهاوزن"],
  ["Scotia", "سكوشيا"],
  ["Lazarev", "لازاريف"],
  ["Davis", "ديفيس"],
  ["Mawson", "موسون"],
  ["Somov", "سوموف"],
]);

const translateMarineProper = (value) => {
  let name = value;
  for (const [english, arabic] of marineProperFragments) {
    name = name.replace(new RegExp(`\\b${english}\\b`, "g"), arabic);
  }
  return transliterateLatinWord(name);
};

const translateRegion3Name = (row) => {
  let name = removeUnsafeRegionChars(row.name);
  if (row.source === "synthetic-antarctic-grid") {
    return name.replace(/^Antarctic Grid/, "جنوبقطب");
  }
  if (row.source === "synthetic-arctic-grid") {
    return name.replace(/^Arctic Grid/, "شمالقطب");
  }
  if (row.source === "synthetic-sahara-grid") {
    return name.replace(/^Sahara Grid/, "صحراء");
  }
  if (row.source === "synthetic-named-gap") {
    return name.replace(/^Gap/, "منطقة");
  }

  for (const [english, arabic] of marineTerms) {
    const trailingMatch = name.match(new RegExp(`^(.+) ${english} (\\d+)$`));
    if (trailingMatch) {
      return `${translateMarineProper(trailingMatch[1])} ${arabic} ${trailingMatch[2]}`;
    }
    name = name.replace(new RegExp(`^${english} `), `${arabic} `);
    name = name.replace(new RegExp(` ${english} `), ` ${arabic} `);
    name = name.replace(new RegExp(` ${english}( \\d+)$`), ` ${arabic}$1`);
  }
  return transliterateLatinWord(name);
};

const planetaryExactNames = new Map([
  ["Mare Tranquillitatis", "بحر السكون"],
  ["Mare Serenitatis", "بحر الصفاء"],
  ["Mare Imbrium", "بحر الأمطار"],
  ["Mare Nubium", "بحر الغيوم"],
  ["Mare Crisium", "بحر الأزمات"],
  ["Oceanus Procellarum", "محيط العواصف"],
  ["Olympus Mons", "جبل أوليمبوس"],
  ["Ascraeus Mons", "جبل أسكرايوس"],
  ["Arsia Mons", "جبل أرسيا"],
  ["Pavonis Mons", "جبل بافونيس"],
  ["Valles Marineris", "وادي مارينر"],
]);

const planetaryLeadingTerms = [
  ["Crater", "فوهة"],
  ["Mons", "جبل"],
  ["Montes", "جبال"],
  ["Mare", "بحر"],
  ["Oceanus", "محيط"],
  ["Vallis", "وادي"],
  ["Valles", "وادي"],
  ["Planitia", "سهل"],
  ["Planum", "هضبة"],
  ["Terra", "أرض"],
  ["Chaos", "فوضى"],
  ["Dorsa", "حيد"],
  ["Rupes", "جرف"],
  ["Fossa", "خندق"],
  ["Fossae", "خنادق"],
  ["Cavus", "تجويف"],
  ["Mensa", "هضبة"],
  ["Vastitas", "امتداد"],
];

const translatePlanetaryName = (value) => {
  const name = removeUnsafeRegionChars(value);
  const exact = planetaryExactNames.get(name);
  if (exact) return exact;

  const numberedCrater = name.match(/^(.+) Crater (\d+)$/);
  if (numberedCrater) {
    return `فوهة ${transliterateLatinWord(numberedCrater[1])} ${numberedCrater[2]}`;
  }

  for (const [english, arabic] of planetaryLeadingTerms) {
    if (name.startsWith(`${english} `)) {
      return `${arabic} ${transliterateLatinWord(name.slice(english.length + 1))}`;
    }
    if (name.endsWith(` ${english}`)) {
      return `${arabic} ${transliterateLatinWord(name.slice(0, -english.length - 1))}`;
    }
  }
  return transliterateLatinWord(name);
};

const truncateCodePoints = (value, maxLength) =>
  [...value].slice(0, maxLength).join("");

const dedupeNames = (rows, maxLength) => {
  const seenKeys = new Set();
  const baseCounts = new Map();
  return rows.map((row) => {
    const base = maxLength ? truncateCodePoints(row.name, maxLength) : row.name;
    const key = base.toLocaleLowerCase("ar");
    const nextCount = baseCounts.get(key) ?? 0;
    baseCounts.set(key, nextCount + 1);

    let candidate = base;
    let suffixIndex = nextCount + 1;
    while (seenKeys.has(candidate.toLocaleLowerCase("ar"))) {
      const suffix = `${suffixIndex++}`;
      candidate = maxLength
        ? `${truncateCodePoints(base, Math.max(1, maxLength - suffix.length))}${suffix}`
        : `${base}${suffix}`;
    }

    seenKeys.add(candidate.toLocaleLowerCase("ar"));
    return { ...row, name: candidate };
  });
};

const buildLocalizedRows = (
  inputPath,
  outputPath,
  translateName,
  maxLength,
) => {
  const rows = readJson(inputPath).map((row) => ({
    ...row,
    name: translateName(row),
  }));
  writeJson(outputPath, dedupeNames(rows, maxLength));
};

const buildEmbeddedRegionDb = async (regionName) => {
  const regions = readJson(`packages/geoint/region-dist/${regionName}.json`);
  const regionDbPath = new URL("packages/geoint/region-db/", root);
  const regionLevelDbPath = path.join(regionDbPath.pathname, regionName);
  const indexPath = path.join(regionDbPath.pathname, `${regionName}.index`);

  rmSync(regionLevelDbPath, { recursive: true, force: true });
  rmSync(indexPath, { force: true });
  mkdirSync(regionLevelDbPath, { recursive: true });

  const db = new Level(regionLevelDbPath, { valueEncoding: "json" });
  const index = new KDBush(regions.length);

  for (const region of regions) {
    index.add(region.long, region.lat);
    await db.put(region.code, region);
  }

  index.finish();
  writeFileSync(indexPath, Buffer.from(index.data));
  await db.close();
};

writeJson(
  "packages/codebook/codebook-dist/arabic.json",
  buildArabicCodebook(),
);

buildLocalizedRows(
  "packages/geoint/region-dist/region-2.json",
  "packages/geoint/region-dist/region-2-arabic.json",
  translateEarthRegionName,
  32,
);
buildLocalizedRows(
  "packages/geoint/region-dist/region-3.json",
  "packages/geoint/region-dist/region-3-arabic.json",
  translateRegion3Name,
  20,
);
buildLocalizedRows(
  "packages/geoint/region-dist/region-2-moon.json",
  "packages/geoint/region-dist/region-2-moon-arabic.json",
  ({ name }) => translatePlanetaryName(name),
  48,
);
buildLocalizedRows(
  "packages/geoint/region-dist/region-2-mars.json",
  "packages/geoint/region-dist/region-2-mars-arabic.json",
  ({ name }) => translatePlanetaryName(name),
  48,
);
buildLocalizedRows(
  "packages/geoint/region-dist/region-3-mars.json",
  "packages/geoint/region-dist/region-3-mars-arabic.json",
  ({ name }) => translatePlanetaryName(name),
  48,
);

for (const regionName of [
  "region-2-arabic",
  "region-3-arabic",
  "region-2-moon-arabic",
  "region-2-mars-arabic",
  "region-3-mars-arabic",
]) {
  await buildEmbeddedRegionDb(regionName);
}
