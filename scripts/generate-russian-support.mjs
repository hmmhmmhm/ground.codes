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

const russianWordPattern = /^[\p{Script=Cyrillic}\p{Mark}]+$/u;

const blockedTokens = new Set([
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
  "вино",
  "пиво",
  "водка",
  "пуля",
  "бомба",
  "смерть",
  "труп",
]);

const standaloneWords = [
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
  "лес",
  "луг",
  "сад",
  "поле",
  "море",
  "озеро",
  "берег",
  "пруд",
  "двор",
  "парк",
  "порт",
  "путь",
  "ключ",
  "камень",
  "песок",
  "глина",
  "почва",
  "лист",
  "ветка",
  "корень",
  "ствол",
  "трава",
  "мох",
  "лугок",
  "ручей",
  "родник",
  "холм",
  "скала",
  "долина",
  "равнина",
  "остров",
  "залив",
  "бухта",
  "сосна",
  "ель",
  "дуб",
  "клен",
  "липа",
  "ива",
  "ясень",
  "ольха",
  "осина",
  "тополь",
  "рябина",
  "черемуха",
  "шиповник",
  "смородина",
  "малина",
  "клюква",
  "брусника",
  "черника",
  "земляника",
  "груша",
  "слива",
  "вишня",
  "айва",
  "дыня",
  "тыква",
  "огурец",
  "морковь",
  "репа",
  "редис",
  "лук",
  "чеснок",
  "укроп",
  "петрушка",
  "мята",
  "анис",
  "тмин",
  "лавр",
  "мак",
  "лен",
  "овес",
  "рожь",
  "просо",
  "греча",
  "рис",
  "мука",
  "соль",
  "сыр",
  "масло",
  "мед",
  "чай",
  "кофе",
  "сок",
  "кефир",
  "каша",
  "лапша",
  "булка",
  "пирог",
  "печенье",
  "сушка",
  "бублик",
  "ложка",
  "вилка",
  "чашка",
  "кружка",
  "миска",
  "таз",
  "ведро",
  "кувшин",
  "банка",
  "короб",
  "ящик",
  "мешок",
  "сумка",
  "лукошко",
  "корзина",
  "полка",
  "стол",
  "стул",
  "скамья",
  "лавка",
  "ковер",
  "мат",
  "плед",
  "штора",
  "рама",
  "окно",
  "дверь",
  "крыша",
  "стена",
  "пол",
  "порог",
  "ступень",
  "доска",
  "брус",
  "рейка",
  "планка",
  "гвоздь",
  "винт",
  "замок",
  "петля",
  "ручка",
  "щетка",
  "веник",
  "тряпка",
  "мыло",
  "лента",
  "нитка",
  "игла",
  "ткань",
  "холст",
  "вата",
  "шерсть",
  "шелк",
  "ленок",
  "бумага",
  "листок",
  "тетрадь",
  "карандаш",
  "перо",
  "кисть",
  "краска",
  "мел",
  "глина",
  "горшок",
  "ваза",
  "поднос",
  "свеча",
  "лампа",
  "фонарь",
  "звонок",
  "колокол",
  "сани",
  "телега",
  "вагон",
  "поезд",
  "лодка",
  "плот",
  "весло",
  "колесо",
  "тропа",
  "дорога",
  "улица",
  "площадь",
  "рынок",
  "лавочка",
  "станция",
  "поселок",
  "село",
  "город",
  "квартал",
  "мельница",
  "амбар",
  "сарай",
  "навес",
  "печь",
  "очаг",
  "дымоход",
  "сено",
  "сноп",
  "пучок",
  "снопик",
  "венок",
  "букет",
  "бутон",
  "лепесток",
  "семя",
  "зерно",
  "орех",
  "каштан",
  "желудь",
  "гриб",
  "ягода",
  "плод",
  "ветер",
  "дождь",
  "снег",
  "роса",
  "иней",
  "туман",
  "облако",
  "солнце",
  "луна",
  "звезда",
  "небо",
  "тень",
  "свет",
  "утро",
  "вечер",
  "день",
  "ночь",
  "весна",
  "лето",
  "осень",
  "зима",
  "север",
  "юг",
  "запад",
  "восток",
  "арка",
  "аист",
  "бак",
  "баня",
  "барс",
  "баян",
  "бобр",
  "бок",
  "бор",
  "бусы",
  "век",
  "вена",
  "вера",
  "вес",
  "веха",
  "виш",
  "воск",
  "град",
  "груз",
  "гуща",
  "дар",
  "дым",
  "еж",
  "ель",
  "жар",
  "жук",
  "зал",
  "злак",
  "зной",
  "зуб",
  "ива",
  "изба",
  "икра",
  "иней",
  "йод",
  "кедр",
  "кипа",
  "кит",
  "клен",
  "клуб",
  "клок",
  "клюв",
  "ковш",
  "коза",
  "кол",
  "ком",
  "кома",
  "кора",
  "корм",
  "коса",
  "кран",
  "крот",
  "круг",
  "куб",
  "куст",
  "лапа",
  "лев",
  "лен",
  "лист",
  "ложа",
  "лук",
  "мак",
  "мел",
  "мех",
  "мир",
  "мода",
  "мох",
  "мрак",
  "мяч",
  "нос",
  "нота",
  "овал",
  "овес",
  "овод",
  "омут",
  "орех",
  "ось",
  "пень",
  "перо",
  "пир",
  "плод",
  "плуг",
  "плющ",
  "пруд",
  "пух",
  "пыль",
  "репа",
  "рис",
  "рог",
  "рожь",
  "роза",
  "роса",
  "рука",
  "рыба",
  "сад",
  "сани",
  "свет",
  "сено",
  "сито",
  "скат",
  "сноп",
  "сова",
  "соль",
  "сота",
  "соя",
  "стог",
  "стол",
  "сыр",
  "таз",
  "тмин",
  "том",
  "торф",
  "трос",
  "труд",
  "туя",
  "тык",
  "утка",
  "утро",
  "ухо",
  "фаза",
  "фига",
  "флот",
  "фон",
  "форма",
  "хвоя",
  "холм",
  "хор",
  "хруст",
  "чай",
  "чаша",
  "чек",
  "шаг",
  "шар",
  "шест",
  "шип",
  "шов",
  "шум",
  "щепа",
  "эхо",
  "юла",
  "юрта",
  "явор",
  "ягода",
  "якорь",
  "ясень",
];

const compoundPrefixes = [
  "озеро",
  "река",
  "гора",
  "лес",
  "сад",
  "поле",
  "море",
  "пруд",
  "берег",
  "двор",
  "парк",
  "луг",
  "ручей",
  "родник",
  "холм",
  "скала",
  "сосна",
  "береза",
  "дуб",
  "клен",
  "липа",
  "ива",
  "трава",
  "лист",
  "ветка",
  "корень",
  "цветок",
  "яблоко",
  "груша",
  "слива",
  "вишня",
  "тыква",
  "морковь",
  "репа",
  "лук",
  "укроп",
  "мята",
  "анис",
  "лавр",
  "мак",
  "лен",
  "овес",
  "рожь",
  "рис",
  "хлеб",
  "мука",
  "мед",
  "чай",
  "каша",
  "булка",
  "книга",
  "листок",
  "бумага",
  "кисть",
  "краска",
  "мел",
  "глина",
  "камень",
  "песок",
  "снег",
  "роса",
  "иней",
  "туман",
  "свет",
  "ветер",
  "солнце",
  "луна",
  "звезда",
  "утро",
  "вечер",
  "зима",
  "лето",
  "весна",
  "осень",
  "север",
  "юг",
  "запад",
  "восток",
  "изба",
  "окно",
  "дверь",
  "крыша",
  "стена",
  "стол",
  "стул",
  "полка",
  "лавка",
  "корзина",
  "ящик",
  "мешок",
  "сумка",
  "ведро",
  "банка",
  "чашка",
  "кружка",
  "миска",
  "ложка",
  "вилка",
  "лампа",
  "свеча",
  "фонарь",
  "лодка",
  "вагон",
  "поезд",
  "тропа",
  "дорога",
  "улица",
  "село",
  "город",
  "амбар",
  "сарай",
  "сено",
  "сноп",
  "букет",
  "орех",
  "гриб",
  "ягода",
];

const compoundSuffixes = [
  "дом",
  "мост",
  "лист",
  "сад",
  "двор",
  "луг",
  "парк",
  "берег",
  "пруд",
  "лес",
  "поле",
  "камень",
  "песок",
  "ветка",
  "корень",
  "ствол",
  "цветок",
  "плод",
  "ягода",
  "орех",
  "зерно",
  "семя",
  "трава",
  "мох",
  "сноп",
  "венок",
  "букет",
  "чаша",
  "кружка",
  "миска",
  "банка",
  "ведро",
  "ящик",
  "короб",
  "мешок",
  "сумка",
  "корзина",
  "полка",
  "стол",
  "стул",
  "лавка",
  "рама",
  "окно",
  "дверь",
  "крыша",
  "доска",
  "брус",
  "рейка",
  "замок",
  "ручка",
  "лента",
  "нитка",
  "ткань",
  "холст",
  "бумага",
  "книга",
  "кисть",
  "краска",
  "горшок",
  "ваза",
  "лампа",
  "свеча",
  "фонарь",
  "лодка",
  "весло",
  "колесо",
  "тропа",
  "дорога",
  "рынок",
  "сарай",
  "амбар",
  "навес",
  "печь",
];

const addWord = (words, seen, word) => {
  const normalized = word.normalize("NFC").toLowerCase();
  if (!russianWordPattern.test(normalized)) return;
  if ([...normalized].length > 14) return;
  if (blockedTokens.has(normalized)) return;
  if (seen.has(normalized)) return;
  seen.add(normalized);
  words.push(normalized);
};

const buildRussianCodebook = () => {
  const words = [];
  const seen = new Set();

  for (const word of standaloneWords) {
    addWord(words, seen, word);
  }

  for (const prefix of compoundPrefixes) {
    for (const suffix of compoundSuffixes) {
      if (prefix === suffix) continue;
      addWord(words, seen, `${prefix}${suffix}`);
    }
  }

  if (words.length < 5000) {
    throw new Error(`Russian codebook generated ${words.length} words`);
  }

  return words.slice(0, 5000);
};

const removeUnsafeRegionChars = (value) =>
  String(value)
    .replace(/[’'`´/#?\-]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const earthNameOverridesByCode = new Map([
  ["524901", "Москва"],
  ["498817", "Санкт Петербург"],
  ["703448", "Киев"],
  ["625144", "Минск"],
  ["2950159", "Берлин"],
  ["2643743", "Лондон"],
  ["2988507", "Париж"],
  ["5128581", "Нью Йорк"],
  ["5368361", "Лос Анджелес"],
  ["1816670", "Пекин"],
  ["1850147", "Токио"],
  ["1835848", "Сеул"],
  ["1273294", "Дели"],
  ["1275339", "Мумбаи"],
  ["360630", "Каир"],
  ["1609350", "Бангкок"],
  ["1581130", "Ханой"],
  ["1642911", "Джакарта"],
  ["2267057", "Лиссабон"],
  ["3169070", "Рим"],
  ["745044", "Стамбул"],
  ["292223", "Дубай"],
  ["1880252", "Сингапур"],
  ["2147714", "Сидней"],
  ["6167865", "Торонто"],
]);

const latinPairs = [
  [/sch/gi, "щ"],
  [/sh/gi, "ш"],
  [/ch/gi, "ч"],
  [/zh/gi, "ж"],
  [/kh/gi, "х"],
  [/ts/gi, "ц"],
  [/yu/gi, "ю"],
  [/ya/gi, "я"],
  [/yo/gi, "ё"],
  [/ye/gi, "е"],
  [/ph/gi, "ф"],
  [/th/gi, "т"],
  [/qu/gi, "кв"],
  [/ck/gi, "к"],
];

const latinMap = new Map([
  ["a", "а"],
  ["b", "б"],
  ["c", "к"],
  ["d", "д"],
  ["e", "е"],
  ["f", "ф"],
  ["g", "г"],
  ["h", "х"],
  ["i", "и"],
  ["j", "дж"],
  ["k", "к"],
  ["l", "л"],
  ["m", "м"],
  ["n", "н"],
  ["o", "о"],
  ["p", "п"],
  ["q", "к"],
  ["r", "р"],
  ["s", "с"],
  ["t", "т"],
  ["u", "у"],
  ["v", "в"],
  ["w", "в"],
  ["x", "кс"],
  ["y", "и"],
  ["z", "з"],
]);

const titleCyrillic = (value) =>
  value.replace(/\p{Script=Cyrillic}+/gu, (word) => {
    const chars = [...word];
    return `${chars[0].toLocaleUpperCase("ru")}${chars
      .slice(1)
      .join("")
      .toLocaleLowerCase("ru")}`;
  });

const transliterateLatinWord = (word) => {
  let value = removeUnsafeRegionChars(word)
    .normalize("NFD")
    .replace(/\p{Mark}/gu, "");
  for (const [pattern, replacement] of latinPairs) {
    value = value.replace(pattern, replacement);
  }

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
    if (/[\p{Script=Cyrillic}\p{Mark}]/u.test(char)) {
      output += char;
      continue;
    }
    const mapped = latinMap.get(char.toLowerCase());
    if (mapped) output += mapped;
  }
  return titleCyrillic(output.replace(/\s+/g, " ").trim());
};

const translateEarthRegionName = (row) =>
  earthNameOverridesByCode.get(String(row.code)) ??
  transliterateLatinWord(row.name);

const marineTerms = [
  ["Ocean", "Океан"],
  ["Sea", "Море"],
  ["Bay", "Залив"],
  ["Gulf", "Залив"],
  ["Channel", "Канал"],
  ["Strait", "Пролив"],
  ["Sound", "Залив"],
  ["Basin", "Котловина"],
  ["Ridge", "Хребет"],
  ["Plateau", "Плато"],
  ["Rise", "Поднятие"],
  ["Trench", "Желоб"],
  ["Bank", "Банка"],
];

const marineProperFragments = new Map([
  ["Ross", "Росса"],
  ["Weddell", "Уэдделла"],
  ["Amundsen", "Амундсена"],
  ["Bellingshausen", "Беллинсгаузена"],
  ["Scotia", "Скотия"],
  ["Lazarev", "Лазарева"],
  ["Davis", "Дейвиса"],
  ["Mawson", "Моусона"],
  ["Somov", "Сомова"],
]);

const translateMarineProper = (value) => {
  let name = value;
  for (const [english, russian] of marineProperFragments) {
    name = name.replace(new RegExp(`\\b${english}\\b`, "g"), russian);
  }
  return transliterateLatinWord(name);
};

const translateRegion3Name = (row) => {
  let name = removeUnsafeRegionChars(row.name);
  if (row.source === "synthetic-antarctic-grid") {
    return name.replace(/^Antarctic Grid/, "Антарктика");
  }
  if (row.source === "synthetic-arctic-grid") {
    return name.replace(/^Arctic Grid/, "Арктика");
  }
  if (row.source === "synthetic-sahara-grid") {
    return name.replace(/^Sahara Grid/, "Сахара");
  }
  if (row.source === "synthetic-named-gap") {
    return transliterateLatinWord(name.replace(/^Gap/, "Участок"));
  }

  for (const [english, russian] of marineTerms) {
    const trailingMatch = name.match(new RegExp(`^(.+) ${english} (\\d+)$`));
    if (trailingMatch) {
      return `${russian} ${translateMarineProper(trailingMatch[1])} ${trailingMatch[2]}`;
    }
    name = name.replace(new RegExp(`^${english} `), `${russian} `);
    name = name.replace(new RegExp(` ${english} `), ` ${russian} `);
    name = name.replace(new RegExp(` ${english}( \\d+)$`), ` ${russian}$1`);
  }
  return transliterateLatinWord(name);
};

const planetaryExactNames = new Map([
  ["Mare Tranquillitatis", "Море Спокойствия"],
  ["Mare Serenitatis", "Море Ясности"],
  ["Mare Imbrium", "Море Дождей"],
  ["Mare Nubium", "Море Облаков"],
  ["Mare Crisium", "Море Кризисов"],
  ["Mare Nectaris", "Море Нектара"],
  ["Mare Humorum", "Море Влажности"],
  ["Oceanus Procellarum", "Океан Бурь"],
  ["Sinus Iridum", "Залив Радуги"],
  ["Olympus Mons", "гора Олимпус"],
  ["Nix Olympica", "гора Олимп"],
  ["Ascraeus Mons", "гора Аскрийская"],
  ["Arsia Mons", "гора Арсия"],
  ["Pavonis Mons", "гора Павлина"],
  ["Elysium Mons", "гора Элизий"],
  ["Valles Marineris", "долины Маринера"],
  ["Hellas Planitia", "равнина Эллада"],
  ["Utopia Planitia", "равнина Утопия"],
  ["Amazonis Planitia", "равнина Амазония"],
]);

const planetaryLeadingTerms = [
  ["Crater", "кратер"],
  ["Mons", "гора"],
  ["Montes", "горы"],
  ["Mare", "море"],
  ["Oceanus", "океан"],
  ["Sinus", "залив"],
  ["Lacus", "озеро"],
  ["Vallis", "долина"],
  ["Valles", "долины"],
  ["Planitia", "равнина"],
  ["Planum", "плато"],
  ["Terra", "земля"],
  ["Chaos", "хаос"],
  ["Dorsa", "хребет"],
  ["Rupes", "уступ"],
  ["Fossa", "борозда"],
  ["Fossae", "борозды"],
  ["Cavus", "впадина"],
  ["Mensa", "плато"],
  ["Mensae", "плато"],
  ["Vastitas", "простор"],
  ["Chasma", "ущелье"],
  ["Chasmata", "ущелья"],
  ["Patera", "патера"],
  ["Tholus", "купол"],
  ["Undae", "дюны"],
];

const translatePlanetaryName = (value) => {
  const name = removeUnsafeRegionChars(value);
  const exact = planetaryExactNames.get(name);
  if (exact) return exact;

  const numberedCrater = name.match(/^(.+) Crater (\d+)$/);
  if (numberedCrater) {
    return `кратер ${transliterateLatinWord(numberedCrater[1])} ${numberedCrater[2]}`;
  }

  for (const [english, russian] of planetaryLeadingTerms) {
    if (name.startsWith(`${english} `)) {
      return `${russian} ${transliterateLatinWord(name.slice(english.length + 1))}`;
    }
    if (name.endsWith(` ${english}`)) {
      return `${russian} ${transliterateLatinWord(name.slice(0, -english.length - 1))}`;
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
    const key = base.toLocaleLowerCase("ru");
    const nextCount = baseCounts.get(key) ?? 0;
    baseCounts.set(key, nextCount + 1);

    let candidate = base;
    let suffixIndex = nextCount + 1;
    while (seenKeys.has(candidate.toLocaleLowerCase("ru"))) {
      const suffix = `${suffixIndex++}`;
      candidate = maxLength
        ? `${truncateCodePoints(base, Math.max(1, maxLength - suffix.length))}${suffix}`
        : `${base}${suffix}`;
    }

    seenKeys.add(candidate.toLocaleLowerCase("ru"));
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

  const db = new Level(regionLevelDbPath);
  const index = new KDBush(regions.length);

  for (const [indexKey, region] of regions.entries()) {
    index.add(region.long, region.lat);
    await db.put(`I-${indexKey}`, JSON.stringify(region));
    await db.put(`N-${region.name}`, `I-${indexKey}`);
  }

  index.finish();
  writeFileSync(indexPath, Buffer.from(index.data));
  await db.close();
};

writeJson(
  "packages/codebook/codebook-dist/russian.json",
  buildRussianCodebook(),
);

buildLocalizedRows(
  "packages/geoint/region-dist/region-2.json",
  "packages/geoint/region-dist/region-2-russian.json",
  translateEarthRegionName,
  32,
);
buildLocalizedRows(
  "packages/geoint/region-dist/region-3.json",
  "packages/geoint/region-dist/region-3-russian.json",
  translateRegion3Name,
  20,
);
buildLocalizedRows(
  "packages/geoint/region-dist/region-2-moon.json",
  "packages/geoint/region-dist/region-2-moon-russian.json",
  ({ name }) => translatePlanetaryName(name),
  48,
);
buildLocalizedRows(
  "packages/geoint/region-dist/region-2-mars.json",
  "packages/geoint/region-dist/region-2-mars-russian.json",
  ({ name }) => translatePlanetaryName(name),
  48,
);
buildLocalizedRows(
  "packages/geoint/region-dist/region-3-mars.json",
  "packages/geoint/region-dist/region-3-mars-russian.json",
  ({ name }) => translatePlanetaryName(name),
  48,
);

for (const regionName of [
  "region-2-russian",
  "region-3-russian",
  "region-2-moon-russian",
  "region-2-mars-russian",
  "region-3-mars-russian",
]) {
  await buildEmbeddedRegionDb(regionName);
}
