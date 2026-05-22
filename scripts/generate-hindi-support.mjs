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

const hindiWordPattern = /^[\p{Script=Devanagari}\p{Mark}]+$/u;
const blockedTokens = new Set([
  "अस्पताल",
  "कर्ज",
  "खून",
  "गोली",
  "जुआ",
  "जेल",
  "चुनाव",
  "धर्म",
  "नशा",
  "प्रार्थना",
  "बंदूक",
  "बीमारी",
  "मंदिर",
  "मौत",
  "राजनीति",
  "युद्ध",
  "शराब",
  "सेक्स",
  "हत्या",
  "हथियार",
]);

const standaloneWords = [
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
  "बाग",
  "खेत",
  "पत्ता",
  "मिट्टी",
  "पत्थर",
  "रेत",
  "झील",
  "तालाब",
  "समुद्र",
  "घाट",
  "नाव",
  "रेल",
  "बस",
  "गाड़ी",
  "चौक",
  "आंगन",
  "बगीचा",
  "कटोरा",
  "चम्मच",
  "प्याला",
  "घड़ा",
  "दीपक",
  "कागज",
  "कलम",
  "रंग",
  "बादल",
  "सूरज",
  "चाँद",
  "तारा",
  "हवा",
  "बारिश",
  "कपड़ा",
  "कुर्सी",
  "मेज",
  "डिब्बा",
  "टोकरी",
  "रस्सी",
  "चटाई",
  "परदा",
  "बर्तन",
  "लोटा",
  "कुल्हड़",
  "मटका",
  "तवा",
  "करछी",
  "बेलन",
  "सुपली",
  "चरखा",
  "दरी",
  "कंबल",
  "तकिया",
  "खिड़की",
  "दरवाजा",
  "छत",
  "दीवार",
  "सीढ़ी",
  "गलियारा",
  "रास्ता",
  "चौराहा",
  "मोहल्ला",
  "कस्बा",
  "शहर",
  "गांव",
  "दुकान",
  "चक्की",
  "मसाला",
  "हल्दी",
  "अदरक",
  "इलायची",
  "तुलसी",
  "गेंदा",
  "गुलाब",
  "चमेली",
  "नीम",
  "बरगद",
  "पीपल",
  "बांस",
  "सरसों",
  "गेहूँ",
  "चना",
  "मूंग",
  "मटर",
  "आलू",
  "टमाटर",
  "बैंगन",
  "लौकी",
  "कद्दू",
  "खीरा",
  "भिंडी",
  "गाजर",
  "मूली",
  "पालक",
  "धनिया",
  "दूध",
  "दही",
  "मक्खन",
  "घी",
  "पनीर",
  "पूड़ी",
  "हलवा",
  "लड्डू",
  "पेड़ा",
  "जलेबी",
  "सेब",
  "अमरूद",
  "अनार",
  "अंगूर",
  "पपीता",
  "तरबूज",
  "खरबूजा",
  "नींबू",
  "खजूर",
  "अंजीर",
  "शहतूत",
  "महुआ",
  "कपास",
  "रेशम",
  "ऊन",
  "पीतल",
  "तांबा",
  "कांसा",
  "चांदी",
  "लकड़ी",
  "माटी",
  "ईंट",
  "टाइल",
  "छाता",
  "जूता",
  "चप्पल",
  "टोपी",
  "थैला",
  "बटुआ",
  "कंघी",
  "आईना",
  "चाबी",
  "घंटी",
  "पतंग",
  "बांसुरी",
  "ढोलक",
  "मंजीरा",
  "वीणा",
  "सितार",
  "सरगम",
  "कहानी",
  "कविता",
  "पन्ना",
  "नक्शा",
  "तस्वीर",
  "कैलेंडर",
  "घड़ी",
  "दोपहर",
  "सुबह",
  "शाम",
  "बसंत",
  "सावन",
];

const pairedCompounds = [
  ["कमल", "फूल"],
  ["चाय", "पत्ती"],
  ["दीया", "बत्ती"],
  ["फूल", "दान"],
  ["जल", "घड़ा"],
  ["किताब", "घर"],
  ["रेल", "स्टेशन"],
  ["बस", "स्टैंड"],
  ["नदी", "घाट"],
  ["आम", "बाग"],
  ["मिट्टी", "घड़ा"],
  ["पीतल", "थाली"],
  ["तांबा", "लोटा"],
  ["लकड़ी", "कुर्सी"],
  ["रेशम", "दुपट्टा"],
  ["बांस", "टोकरी"],
  ["गुलाब", "जल"],
  ["नीम", "पत्ता"],
  ["हल्दी", "दूध"],
  ["मसाला", "डिब्बा"],
  ["कागज", "पतंग"],
  ["कलम", "दान"],
  ["रंग", "डिब्बा"],
  ["बरगद", "छाया"],
  ["सावन", "बारिश"],
  ["सुबह", "चाय"],
  ["शाम", "दीया"],
  ["गांव", "रास्ता"],
  ["शहर", "चौक"],
  ["खेत", "मेड़"],
];

const objectRoots = [
  "किताब",
  "कलम",
  "दीया",
  "घड़ा",
  "थाली",
  "कटोरा",
  "प्याला",
  "डिब्बा",
  "टोकरी",
  "चाबी",
  "घंटी",
  "पतंग",
  "बेलन",
  "चटाई",
  "कुर्सी",
  "मेज",
  "परदा",
  "छाता",
  "जूता",
  "थैला",
  "आईना",
  "नक्शा",
  "तस्वीर",
  "घड़ी",
];

const natureRoots = [
  "नदी",
  "झील",
  "तालाब",
  "समुद्र",
  "पहाड़",
  "बादल",
  "बारिश",
  "हवा",
  "सूरज",
  "चाँद",
  "तारा",
  "मिट्टी",
  "रेत",
  "पत्थर",
  "घाट",
  "खेत",
  "बाग",
  "बगीचा",
  "आंगन",
  "रास्ता",
];

const plantRoots = [
  "कमल",
  "गुलाब",
  "चमेली",
  "गेंदा",
  "तुलसी",
  "नीम",
  "बरगद",
  "पीपल",
  "बांस",
  "सरसों",
  "गेहूँ",
  "चना",
  "मटर",
  "पालक",
  "धनिया",
  "आम",
  "केला",
  "नारियल",
  "सेब",
  "अमरूद",
  "अनार",
  "अंगूर",
  "पपीता",
  "नींबू",
];

const materialSuffixes = [
  "माटी",
  "लकड़ी",
  "कागज",
  "कपास",
  "रेशम",
  "ऊन",
  "पीतल",
  "तांबा",
  "कांसा",
  "चांदी",
  "बांस",
  "ईंट",
  "टाइल",
];

const objectSuffixes = [
  "घर",
  "दान",
  "घड़ा",
  "कटोरा",
  "थाली",
  "प्याला",
  "डिब्बा",
  "टोकरी",
  "रस्सी",
  "चटाई",
  "परदा",
  "कपड़ा",
  "कुर्सी",
  "मेज",
  "बर्तन",
  "लोटा",
  "मटका",
  "तवा",
  "बेलन",
  "थैला",
  "कंघी",
  "घंटी",
  "पतंग",
  "नक्शा",
  "पन्ना",
];

const placeSuffixes = [
  "घर",
  "बाग",
  "घाट",
  "चौक",
  "रास्ता",
  "सड़क",
  "पुल",
  "गली",
  "आंगन",
  "दुकान",
  "बाजार",
  "स्टैंड",
  "स्टेशन",
  "मेड़",
  "किनारा",
  "छाया",
  "कुंज",
  "मंडप",
];

const foodSuffixes = [
  "रोटी",
  "दाल",
  "चावल",
  "पूड़ी",
  "हलवा",
  "लड्डू",
  "पेड़ा",
  "जलेबी",
  "दूध",
  "दही",
  "घी",
  "पनीर",
  "मक्खन",
  "मसाला",
  "चटनी",
  "अचार",
];

const colorSuffixes = [
  "लाल",
  "नीला",
  "हरा",
  "पीला",
  "सफेद",
  "काला",
  "गुलाबी",
  "सुनहरा",
  "रूपहला",
];

const addToken = (tokens, value) => {
  const token = value.normalize("NFC").replace(/[\s\-/#?']/gu, "");
  if (!token) return;
  if (blockedTokens.has(token)) return;
  if ([...token].length > 14) return;
  if (!hindiWordPattern.test(token)) return;
  tokens.add(token);
};

const buildHindiCodebook = () => {
  const tokens = new Set();
  const addPairs = (leftItems, rightItems) => {
    for (const left of leftItems) {
      for (const right of rightItems) {
        if (left === right) continue;
        addToken(tokens, `${left}${right}`);
      }
    }
  };

  for (const word of standaloneWords) addToken(tokens, word);
  for (const [left, right] of pairedCompounds) addToken(tokens, `${left}${right}`);

  addPairs(objectRoots, materialSuffixes);
  addPairs(objectRoots, objectSuffixes);
  addPairs(objectRoots, colorSuffixes);
  addPairs(natureRoots, placeSuffixes);
  addPairs(natureRoots, colorSuffixes);
  addPairs(plantRoots, objectSuffixes);
  addPairs(plantRoots, placeSuffixes);
  addPairs(plantRoots, colorSuffixes);
  addPairs(plantRoots, foodSuffixes);
  addPairs(standaloneWords.slice(0, 80), objectSuffixes);
  addPairs(standaloneWords.slice(40, 130), placeSuffixes);
  addPairs(standaloneWords.slice(80, 170), foodSuffixes);
  addPairs(standaloneWords.slice(20, 150), colorSuffixes);

  const words = [...tokens].slice(0, 5000);
  if (words.length !== 5000) {
    throw new Error(`Hindi codebook has ${words.length} entries`);
  }
  return words;
};

const hindiRegionOverrides = new Map([
  ["1261481", "नईदिल्ली"],
  ["1273294", "दिल्ली"],
  ["1275339", "मुंबई"],
  ["1275004", "कोलकाता"],
  ["1264527", "चेन्नई"],
  ["1269843", "हैदराबाद"],
  ["1277333", "बेंगलुरु"],
  ["1835848", "सियोल"],
  ["1850147", "टोक्यो"],
  ["1609350", "बैंकॉक"],
  ["2643743", "लंदन"],
  ["2988507", "पेरिस"],
  ["2950159", "बर्लिन"],
  ["2267057", "लिस्बन"],
  ["1642911", "जकार्ता"],
  ["1581130", "हनोई"],
  ["1566083", "होचिमिन्ह"],
]);

const removeUnsafeRegionChars = (value) =>
  String(value).replace(/[’'`´]/g, "").replace(/\s+/g, " ").trim();

const translateEarthRegionName = (row) =>
  hindiRegionOverrides.get(String(row.code)) ?? removeUnsafeRegionChars(row.name);

const marineTerms = [
  ["Ocean", "महासागर"],
  ["Sea", "सागर"],
  ["Bay", "खाड़ी"],
  ["Gulf", "खाड़ी"],
  ["Channel", "जलडमरू"],
  ["Strait", "जलडमरू"],
  ["Basin", "घाटी"],
  ["Ridge", "कटक"],
  ["Plateau", "पठार"],
  ["Plain", "मैदान"],
];

const translateRegion3Name = (row) => {
  let name = removeUnsafeRegionChars(row.name);
  if (row.source === "synthetic-antarctic-grid") {
    return name.replace(/^Antarctic Grid/, "दक्षिणग्रिड");
  }
  if (row.source === "synthetic-arctic-grid") {
    return name.replace(/^Arctic Grid/, "उत्तरग्रिड");
  }
  if (row.source === "synthetic-sahara-grid") {
    return name.replace(/^Sahara Grid/, "सहारा ग्रिड");
  }
  if (row.source === "synthetic-named-gap") {
    return name.replace(/^Gap/, "क्षेत्र");
  }

  for (const [english, hindi] of marineTerms) {
    const trailingMatch = name.match(new RegExp(`^(.+) ${english} (\\d+)$`));
    if (trailingMatch) {
      name = `${hindi} ${trailingMatch[1]} ${trailingMatch[2]}`;
      continue;
    }
    name = name.replace(new RegExp(`^${english} `), `${hindi} `);
    name = name.replace(new RegExp(` ${english} `), ` ${hindi} `);
    name = name.replace(new RegExp(` ${english}( \\d+)$`), ` ${hindi}$1`);
  }
  return name;
};

const planetaryExactNames = new Map([
  ["Mare Tranquillitatis", "शांति सागर"],
  ["Mare Serenitatis", "निर्मल सागर"],
  ["Mare Imbrium", "वर्षा सागर"],
  ["Mare Nubium", "मेघ सागर"],
  ["Mare Crisium", "क्रिसियम सागर"],
  ["Oceanus Procellarum", "तूफान महासागर"],
  ["Olympus Mons", "ओलिम्पस पर्वत"],
  ["Ascraeus Mons", "अस्क्रेअस पर्वत"],
  ["Arsia Mons", "अर्सिया पर्वत"],
  ["Pavonis Mons", "पावोनिस पर्वत"],
  ["Valles Marineris", "मैरिनर घाटी"],
]);

const planetaryLeadingTerms = [
  ["Crater", "गड्ढा"],
  ["Mons", "पर्वत"],
  ["Montes", "पर्वतमाला"],
  ["Mare", "सागर"],
  ["Oceanus", "महासागर"],
  ["Vallis", "घाटी"],
  ["Valles", "घाटी"],
  ["Planitia", "मैदान"],
  ["Planum", "पठार"],
  ["Terra", "भूमि"],
  ["Chaos", "अव्यवस्था"],
  ["Dorsa", "कटक"],
  ["Rupes", "ढाल"],
  ["Fossa", "खाई"],
  ["Fossae", "खाइयाँ"],
  ["Cavus", "गुहा"],
  ["Mensa", "मेजभूमि"],
  ["Vastitas", "विस्तार"],
];

const translatePlanetaryName = (value) => {
  const name = removeUnsafeRegionChars(value);
  const exact = planetaryExactNames.get(name);
  if (exact) return exact;

  const numberedCrater = name.match(/^(.+) Crater (\d+)$/);
  if (numberedCrater) {
    return `गड्ढा ${numberedCrater[1]} ${numberedCrater[2]}`;
  }

  for (const [english, hindi] of planetaryLeadingTerms) {
    if (name.startsWith(`${english} `)) {
      return `${hindi} ${name.slice(english.length + 1)}`;
    }
    if (name.endsWith(` ${english}`)) {
      return `${hindi} ${name.slice(0, -english.length - 1)}`;
    }
  }
  return name;
};

const truncateCodePoints = (value, maxLength) => [...value].slice(0, maxLength).join("");

const dedupeNames = (rows, maxLength) => {
  const seenKeys = new Set();
  const baseCounts = new Map();
  return rows.map((row) => {
    const base = maxLength ? truncateCodePoints(row.name, maxLength) : row.name;
    const key = base.toLocaleLowerCase("hi");
    const nextCount = baseCounts.get(key) ?? 0;
    baseCounts.set(key, nextCount + 1);

    let candidate = base;
    let suffixIndex = nextCount + 1;
    while (seenKeys.has(candidate.toLocaleLowerCase("hi"))) {
      const suffix = `${suffixIndex++}`;
      candidate = maxLength
        ? `${truncateCodePoints(base, Math.max(1, maxLength - suffix.length))}${suffix}`
        : `${base}${suffix}`;
    }

    seenKeys.add(candidate.toLocaleLowerCase("hi"));
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
  const regionKDBushPath = path.join(
    regionDbPath.pathname,
    `${regionName}.index`,
  );

  mkdirSync(regionDbPath, { recursive: true });
  rmSync(regionLevelDbPath, { recursive: true, force: true });
  rmSync(regionKDBushPath, { force: true });

  const kdbush = new KDBush(regions.length);
  const db = new Level(regionLevelDbPath);
  await db.open();

  for (const [index, region] of regions.entries()) {
    await db.put(`I-${index}`, JSON.stringify(region));
    await db.put(`N-${region.name}`, `I-${index}`);
    kdbush.add(region.long, region.lat);
  }

  kdbush.finish();
  await db.close();
  writeFileSync(regionKDBushPath, Buffer.from(kdbush.data));
};

const mode = process.argv[2] ?? "all";
if (!["all", "codebook-only"].includes(mode)) {
  throw new Error(`Unsupported mode: ${mode}`);
}

writeJson("packages/codebook/codebook-dist/hindi.json", buildHindiCodebook());

if (mode === "all") {
  buildLocalizedRows(
    "packages/geoint/region-dist/region-2.json",
    "packages/geoint/region-dist/region-2-hindi.json",
    translateEarthRegionName,
  );
  buildLocalizedRows(
    "packages/geoint/region-dist/region-3.json",
    "packages/geoint/region-dist/region-3-hindi.json",
    translateRegion3Name,
    20,
  );
  buildLocalizedRows(
    "packages/geoint/region-dist/region-2-moon.json",
    "packages/geoint/region-dist/region-2-moon-hindi.json",
    (row) => translatePlanetaryName(row.name),
  );
  buildLocalizedRows(
    "packages/geoint/region-dist/region-2-mars.json",
    "packages/geoint/region-dist/region-2-mars-hindi.json",
    (row) => translatePlanetaryName(row.name),
  );
  buildLocalizedRows(
    "packages/geoint/region-dist/region-3-mars.json",
    "packages/geoint/region-dist/region-3-mars-hindi.json",
    (row) => translatePlanetaryName(row.name),
  );

  for (const regionName of [
    "region-2-hindi",
    "region-3-hindi",
    "region-2-moon-hindi",
    "region-2-mars-hindi",
    "region-3-mars-hindi",
  ]) {
    await buildEmbeddedRegionDb(regionName);
  }
}
