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

const latinWordPattern = /^[\p{Script=Latin}\p{Mark}]+$/u;
const blockedTokens = new Set([
  "bia",
  "bệnh",
  "chết",
  "chínhtrị",
  "cờbạc",
  "dao",
  "giết",
  "máu",
  "matúy",
  "nợ",
  "rượu",
  "súng",
  "thuốclá",
  "tìnhdục",
  "tù",
  "tôngiáo",
  "vũkhí",
]);

const standaloneWords = [
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
  "ao",
  "bãi",
  "bàn",
  "bánh",
  "bắp",
  "bát",
  "bếp",
  "bình",
  "bông",
  "bút",
  "cá",
  "cát",
  "cam",
  "cây",
  "chăn",
  "chè",
  "chén",
  "chiếu",
  "chim",
  "chuông",
  "cỏ",
  "cọ",
  "cốc",
  "cúc",
  "cửa",
  "đá",
  "đầm",
  "đậu",
  "đồi",
  "đồng",
  "đũa",
  "gà",
  "gác",
  "gạch",
  "gấc",
  "gió",
  "gỗ",
  "hạt",
  "hồ",
  "hương",
  "khăn",
  "khoai",
  "lá",
  "lạc",
  "làng",
  "len",
  "lúa",
  "lụa",
  "mận",
  "mía",
  "mít",
  "mộc",
  "muối",
  "nắng",
  "ngói",
  "ổi",
  "ớt",
  "phấn",
  "phố",
  "quạt",
  "quế",
  "rổ",
  "ruộng",
  "sen",
  "sứ",
  "suối",
  "sữa",
  "táo",
  "than",
  "thìa",
  "thơm",
  "thúng",
  "trà",
  "trăng",
  "tranh",
  "trống",
  "tủ",
  "vải",
  "vịnh",
  "võng",
  "xanh",
  "xeđạp",
  "yến",
];

const modifiers = [
  "ấm",
  "bạc",
  "bền",
  "biếc",
  "cao",
  "chín",
  "đỏ",
  "đục",
  "êm",
  "gọn",
  "hồng",
  "khô",
  "lành",
  "lớn",
  "mát",
  "mềm",
  "mới",
  "ngọt",
  "nhẹ",
  "nhỏ",
  "sạch",
  "sáng",
  "thơm",
  "tươi",
  "vàng",
  "xanh",
];

const suffixNouns = [
  "ao",
  "bát",
  "bếp",
  "bình",
  "bông",
  "cầu",
  "chợ",
  "chén",
  "cốc",
  "cửa",
  "đèn",
  "đĩa",
  "đồi",
  "đũa",
  "gạch",
  "giỏ",
  "hồ",
  "hộp",
  "khăn",
  "lá",
  "làng",
  "lụa",
  "mây",
  "ngói",
  "nhà",
  "phố",
  "quạt",
  "rổ",
  "sen",
  "suối",
  "tủ",
  "vườn",
  "vịnh",
  "võng",
];

const pairedCompounds = [
  ["áo", "dài"],
  ["bánh", "mì"],
  ["bánh", "gạo"],
  ["bánh", "chuối"],
  ["bánh", "dừa"],
  ["cà", "phê"],
  ["chuông", "gió"],
  ["đèn", "lồng"],
  ["đèn", "bàn"],
  ["gạo", "nếp"],
  ["hạt", "sen"],
  ["hoa", "sen"],
  ["khoai", "lang"],
  ["lá", "chuối"],
  ["lúa", "mới"],
  ["lụa", "tơ"],
  ["mây", "tre"],
  ["nước", "mía"],
  ["nước", "dừa"],
  ["nón", "lá"],
  ["phố", "cổ"],
  ["rổ", "tre"],
  ["sông", "xanh"],
  ["suối", "mát"],
  ["trà", "sen"],
  ["vườn", "hoa"],
  ["vườn", "dừa"],
  ["xe", "đạp"],
];

const normalizeToken = (value) =>
  value
    .normalize("NFC")
    .toLowerCase()
    .replace(/[\s\-/#?']/gu, "");

const addToken = (tokens, value) => {
  const token = normalizeToken(value);
  if (!token) return;
  if (blockedTokens.has(token)) return;
  if ([...token].length > 14) return;
  if (!latinWordPattern.test(token)) return;
  tokens.add(token);
};

const buildVietnameseCodebook = () => {
  const tokens = new Set();

  for (const word of standaloneWords) addToken(tokens, word);
  for (const [left, right] of pairedCompounds) addToken(tokens, `${left}${right}`);

  for (const noun of standaloneWords) {
    for (const modifier of modifiers) addToken(tokens, `${noun}${modifier}`);
  }

  for (const noun of standaloneWords) {
    for (const suffix of suffixNouns) {
      if (noun === suffix) continue;
      addToken(tokens, `${noun}${suffix}`);
    }
  }

  for (const modifier of modifiers) {
    for (const suffix of suffixNouns) addToken(tokens, `${modifier}${suffix}`);
  }

  const words = [...tokens].slice(0, 5000);
  if (words.length !== 5000) {
    throw new Error(`Vietnamese codebook has ${words.length} entries`);
  }
  return words;
};

const vietnameseRegionOverrides = new Map([
  ["1581130", "Hà Nội"],
  ["1566083", "TP Hồ Chí Minh"],
  ["1835848", "Seoul"],
  ["1609350", "Bangkok"],
  ["1850147", "Tokyo"],
  ["2643743", "London"],
  ["2988507", "Paris"],
  ["2950159", "Berlin"],
  ["2267057", "Lisboa"],
  ["1642911", "Jakarta"],
]);

const removeUnsafeRegionChars = (value) =>
  value
    .replace(/[-/#?]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const truncateCodePoints = (value, maxLength) =>
  [...value].slice(0, maxLength).join("").trim();

const dedupeNames = (rows, maxLength = Infinity) => {
  const seen = new Map();
  return rows.map((row) => {
    const base = truncateCodePoints(removeUnsafeRegionChars(row.name), maxLength);
    const key = base.toLocaleLowerCase("vi");
    const count = seen.get(key) ?? 0;
    seen.set(key, count + 1);
    if (count === 0) return { ...row, name: base };

    const suffix = ` ${count + 1}`;
    const name = `${truncateCodePoints(base, maxLength - suffix.length)}${suffix}`;
    return { ...row, name };
  });
};

const translateEarthRegionName = (row) =>
  vietnameseRegionOverrides.get(String(row.code)) ?? removeUnsafeRegionChars(row.name);

const marineTerms = [
  ["Sea", "Biển"],
  ["Ocean", "Đại dương"],
  ["Bay", "Vịnh"],
  ["Gulf", "Vịnh"],
  ["Channel", "Eo biển"],
  ["Strait", "Eo biển"],
  ["Sound", "Eo biển"],
  ["Basin", "Bồn địa"],
  ["Bank", "Bãi"],
  ["Reef", "Rạn"],
  ["Ridge", "Sống núi"],
  ["Plateau", "Cao nguyên"],
  ["Rise", "Gò"],
  ["Trough", "Rãnh"],
  ["Trench", "Rãnh"],
  ["Plain", "Đồng bằng"],
  ["Shelf", "Thềm"],
];

const translateRegion3Name = (row) => {
  let name = removeUnsafeRegionChars(row.name);
  if (row.source === "synthetic-antarctic-grid") {
    return name.replace(/^Antarctic Grid/, "Lưới Nam Cực");
  }
  if (row.source === "synthetic-arctic-grid") {
    return name.replace(/^Arctic Grid/, "Lưới Bắc Cực");
  }
  if (row.source === "synthetic-sahara-grid") {
    return name.replace(/^Sahara Grid/, "Lưới Sahara");
  }
  if (row.source === "synthetic-named-gap") {
    return name.replace(/^Gap/, "Vùng");
  }

  for (const [english, vietnamese] of marineTerms) {
    const trailingMatch = name.match(new RegExp(`^(.+) ${english} (\\d+)$`));
    if (trailingMatch) {
      name = `${vietnamese} ${trailingMatch[1]} ${trailingMatch[2]}`;
      continue;
    }
    name = name.replace(new RegExp(`^${english} `), `${vietnamese} `);
    name = name.replace(new RegExp(` ${english} `), ` ${vietnamese} `);
    name = name.replace(new RegExp(` ${english}( \\d+)$`), ` ${vietnamese}$1`);
  }
  return name;
};

const planetaryExactNames = new Map([
  ["Mare Tranquillitatis", "Biển Tĩnh Lặng"],
  ["Mare Serenitatis", "Biển Thanh Bình"],
  ["Mare Imbrium", "Biển Mưa"],
  ["Mare Nubium", "Biển Mây"],
  ["Mare Crisium", "Biển Khủng Hoảng"],
  ["Mare Nectaris", "Biển Mật Hoa"],
  ["Mare Humorum", "Biển Ẩm"],
  ["Mare Fecunditatis", "Biển Phì Nhiêu"],
  ["Oceanus Procellarum", "Đại dương Bão Tố"],
  ["Olympus Mons", "Núi Olympus"],
  ["Ascraeus Mons", "Núi Ascraeus"],
  ["Arsia Mons", "Núi Arsia"],
  ["Pavonis Mons", "Núi Pavonis"],
  ["Valles Marineris", "Thung lũng Mariner"],
]);

const planetaryLeadingTerms = [
  ["Crater", "Hố va chạm"],
  ["Mons", "Núi"],
  ["Montes", "Dãy núi"],
  ["Mare", "Biển"],
  ["Oceanus", "Đại dương"],
  ["Vallis", "Thung lũng"],
  ["Valles", "Thung lũng"],
  ["Planitia", "Đồng bằng"],
  ["Planum", "Cao nguyên"],
  ["Terra", "Vùng đất"],
  ["Chaos", "Vùng hỗn độn"],
  ["Dorsa", "Sống núi"],
  ["Rupes", "Vách dốc"],
  ["Fossa", "Rãnh"],
  ["Fossae", "Rãnh"],
];

const translatePlanetaryName = (name) => {
  const normalized = removeUnsafeRegionChars(name);
  const exact = planetaryExactNames.get(normalized);
  if (exact) return exact;

  const numberedCrater = normalized.match(/^(.+) Crater (\d+)$/);
  if (numberedCrater) {
    return `Hố va chạm ${numberedCrater[1]} ${numberedCrater[2]}`;
  }

  for (const [english, vietnamese] of planetaryLeadingTerms) {
    if (normalized.startsWith(`${english} `)) {
      return `${vietnamese} ${normalized.slice(english.length + 1)}`;
    }
    if (normalized.endsWith(` ${english}`)) {
      return `${vietnamese} ${normalized.slice(0, -english.length - 1)}`;
    }
  }
  return normalized;
};

const buildLocalizedRows = (inputPath, outputPath, translateName, maxLength) => {
  const rows = readJson(inputPath).map((row) => ({
    ...row,
    name: translateName(row),
  }));
  writeJson(outputPath, dedupeNames(rows, maxLength));
};

const avoidNamedGapLookupCollisions = (region3Path, lookupPaths) => {
  const rows = readJson(region3Path);
  const existingNames = new Set();

  for (const lookupPath of lookupPaths) {
    for (const row of readJson(lookupPath)) {
      existingNames.add(String(row.name ?? "").toLocaleLowerCase("vi"));
      existingNames.add(String(row.code ?? "").toLocaleLowerCase("vi"));
    }
  }

  for (const row of rows) {
    if (row.source !== "synthetic-named-gap") {
      existingNames.add(String(row.name ?? "").toLocaleLowerCase("vi"));
    }
  }

  let index = 1;
  for (const row of rows) {
    if (row.source !== "synthetic-named-gap") continue;
    while (existingNames.has(String(row.name).toLocaleLowerCase("vi"))) {
      row.name = truncateCodePoints(`Vùng trống ${index++}`, 20);
    }
    existingNames.add(String(row.name).toLocaleLowerCase("vi"));
  }

  writeJson(region3Path, rows);
};

const buildEmbeddedRegionDb = async (regionName) => {
  const regions = readJson(`packages/geoint/region-dist/${regionName}.json`);
  const regionDbPath = new URL("packages/geoint/region-db/", root);
  const regionLevelDbPath = path.join(regionDbPath.pathname, regionName);
  const regionKDBushPath = path.join(regionDbPath.pathname, `${regionName}.index`);

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

writeJson(
  "packages/codebook/codebook-dist/vietnamese.json",
  buildVietnameseCodebook(),
);

if (mode === "all") {
  buildLocalizedRows(
    "packages/geoint/region-dist/region-2.json",
    "packages/geoint/region-dist/region-2-vietnamese.json",
    translateEarthRegionName,
  );
  buildLocalizedRows(
    "packages/geoint/region-dist/region-3.json",
    "packages/geoint/region-dist/region-3-vietnamese.json",
    translateRegion3Name,
    20,
  );
  avoidNamedGapLookupCollisions(
    "packages/geoint/region-dist/region-3-vietnamese.json",
    [
      "packages/geoint/region-dist/region-1.json",
      "packages/geoint/region-dist/region-2-vietnamese.json",
    ],
  );
  buildLocalizedRows(
    "packages/geoint/region-dist/region-2-moon.json",
    "packages/geoint/region-dist/region-2-moon-vietnamese.json",
    (row) => translatePlanetaryName(row.name),
  );
  buildLocalizedRows(
    "packages/geoint/region-dist/region-2-mars.json",
    "packages/geoint/region-dist/region-2-mars-vietnamese.json",
    (row) => translatePlanetaryName(row.name),
  );
  buildLocalizedRows(
    "packages/geoint/region-dist/region-3-mars.json",
    "packages/geoint/region-dist/region-3-mars-vietnamese.json",
    (row) => translatePlanetaryName(row.name),
  );

  for (const regionName of [
    "region-2-vietnamese",
    "region-3-vietnamese",
    "region-2-moon-vietnamese",
    "region-2-mars-vietnamese",
    "region-3-mars-vietnamese",
  ]) {
    await buildEmbeddedRegionDb(regionName);
  }
}
