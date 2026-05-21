import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const root = new URL("../", import.meta.url);
const geointRequire = createRequire(
  new URL("../packages/geoint/", import.meta.url),
);
const { default: KDBush } = await import(geointRequire.resolve("kdbush"));
const { Level } = await import(geointRequire.resolve("level"));

const readJson = (path) =>
  JSON.parse(readFileSync(new URL(path, root), "utf8"));
const writeJson = (path, value) =>
  writeFileSync(new URL(path, root), `${JSON.stringify(value, null, 2)}\n`);

const normalizeAscii = (value) =>
  value
    .replace(/Ä/g, "Ae")
    .replace(/Ö/g, "Oe")
    .replace(/Ü/g, "Ue")
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[’']/g, "")
    .replace(/[-/#?]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const titleWord = (value) => {
  const normalized = normalizeAscii(value).replace(/[^A-Za-z]/g, "");
  if (!normalized) return "";
  return `${normalized[0].toUpperCase()}${normalized.slice(1).toLowerCase()}`;
};

const standaloneWords = [
  "Acker",
  "Ahorn",
  "Akelei",
  "Allee",
  "Ampel",
  "Anis",
  "Apfel",
  "Armreif",
  "Aster",
  "Aue",
  "Bach",
  "Baguette",
  "Balken",
  "Bank",
  "Barke",
  "Becher",
  "Beere",
  "Beet",
  "Beutel",
  "Birke",
  "Birne",
  "Blatt",
  "Blech",
  "Blume",
  "Bohne",
  "Borke",
  "Brett",
  "Brise",
  "Brot",
  "Brunnen",
  "Buche",
  "Buch",
  "Buegel",
  "Buerste",
  "Bund",
  "Dose",
  "Draht",
  "Dorn",
  "Düne",
  "Efeu",
  "Eiche",
  "Eimer",
  "Erbse",
  "Erde",
  "Esche",
  "Faden",
  "Farn",
  "Fass",
  "Feder",
  "Feige",
  "Feld",
  "Fenchel",
  "Fichte",
  "Flaum",
  "Flieder",
  "Fliese",
  "Floete",
  "Flur",
  "Foehre",
  "Gabel",
  "Garten",
  "Garbe",
  "Geflecht",
  "Geige",
  "Gerste",
  "Glas",
  "Glocke",
  "Gras",
  "Griff",
  "Hafer",
  "Hagebutte",
  "Hain",
  "Haken",
  "Halm",
  "Hanf",
  "Hasel",
  "Heide",
  "Heft",
  "Holz",
  "Honig",
  "Hut",
  "Jasmin",
  "Kachel",
  "Kanne",
  "Karton",
  "Kasten",
  "Kelle",
  "Kerze",
  "Kiesel",
  "Kiefer",
  "Kiste",
  "Klee",
  "Klinge",
  "Klotz",
  "Knopf",
  "Kohl",
  "Korn",
  "Korb",
  "Kork",
  "Kranz",
  "Kreide",
  "Krug",
  "Kuerbis",
  "Kupfer",
  "Lampe",
  "Laerche",
  "Laube",
  "Lehm",
  "Lein",
  "Leiste",
  "Lilie",
  "Linde",
  "Linse",
  "Loewenzahn",
  "Loeffel",
  "Mais",
  "Malve",
  "Mandel",
  "Mappe",
  "Marmor",
  "Matte",
  "Melisse",
  "Messer",
  "Minze",
  "Mohn",
  "Moos",
  "Muesli",
  "Muschel",
  "Nadel",
  "Nelke",
  "Nessel",
  "Nuss",
  "Obst",
  "Olive",
  "Papier",
  "Perle",
  "Pfanne",
  "Pflaume",
  "Pfeffer",
  "Pfeife",
  "Pinsel",
  "Platte",
  "Polster",
  "Quitte",
  "Rahmen",
  "Rain",
  "Rebe",
  "Reis",
  "Riegel",
  "Rinde",
  "Ring",
  "Roggen",
  "Rohr",
  "Rose",
  "Rosmarin",
  "Rost",
  "Rute",
  "Sack",
  "Safran",
  "Salbei",
  "Sand",
  "Satin",
  "Schale",
  "Schilf",
  "Schleife",
  "Schlitten",
  "Schrank",
  "Schublade",
  "Schüssel",
  "Seide",
  "Seil",
  "Senf",
  "Sessel",
  "Sieb",
  "Silber",
  "Sohle",
  "Sonnenhut",
  "Spange",
  "Spatel",
  "Speicher",
  "Spiegel",
  "Spule",
  "Steg",
  "Stein",
  "Stift",
  "Stroh",
  "Tafel",
  "Tanne",
  "Tasche",
  "Tasse",
  "Thymian",
  "Tisch",
  "Topf",
  "Truhe",
  "Tulpe",
  "Ulme",
  "Veilchen",
  "Vlies",
  "Vogel",
  "Wacholder",
  "Wagen",
  "Walnuss",
  "Weide",
  "Weizen",
  "Wiese",
  "Wolle",
  "Wurzel",
  "Zeder",
  "Ziegel",
  "Zimt",
  "Zinn",
  "Zwiebel",
];

const prefixes = [
  "Acker",
  "Ahorn",
  "Apfel",
  "Bach",
  "Beeren",
  "Birken",
  "Birnen",
  "Blatt",
  "Blumen",
  "Bohnen",
  "Buchen",
  "Dinkel",
  "Eichen",
  "Erbsen",
  "Farn",
  "Feigen",
  "Feld",
  "Fichten",
  "Flachs",
  "Flieder",
  "Garten",
  "Gersten",
  "Gras",
  "Hafer",
  "Hanf",
  "Hasel",
  "Heide",
  "Holz",
  "Honig",
  "Jasmin",
  "Klee",
  "Korn",
  "Kork",
  "Kuerbis",
  "Kupfer",
  "Laerchen",
  "Lehm",
  "Lein",
  "Lilien",
  "Linden",
  "Mais",
  "Mandel",
  "Marmor",
  "Minz",
  "Mohn",
  "Moos",
  "Nuss",
  "Oliven",
  "Papier",
  "Pfeffer",
  "Pflaumen",
  "Quitten",
  "Reis",
  "Roggen",
  "Rosen",
  "Salbei",
  "Sand",
  "Schilf",
  "Seiden",
  "Silber",
  "Stein",
  "Stroh",
  "Tannen",
  "Thymian",
  "Tulpen",
  "Ulmen",
  "Weiden",
  "Weizen",
  "Wiesen",
  "Woll",
  "Zedern",
  "Ziegel",
  "Zimt",
];

const suffixes = [
  "band",
  "bank",
  "becher",
  "beet",
  "beutel",
  "blatt",
  "blech",
  "brett",
  "bund",
  "dose",
  "eimer",
  "faden",
  "fass",
  "feld",
  "fliese",
  "gabel",
  "glas",
  "griff",
  "haken",
  "hut",
  "kachel",
  "kanne",
  "karton",
  "kasten",
  "kelle",
  "kerze",
  "kiste",
  "klotz",
  "knopf",
  "korb",
  "kranz",
  "kreide",
  "krug",
  "lampe",
  "leiste",
  "mappe",
  "matte",
  "messer",
  "nadel",
  "papier",
  "perle",
  "pfanne",
  "pfeife",
  "pinsel",
  "platte",
  "polster",
  "rahmen",
  "riegel",
  "ring",
  "rohr",
  "sack",
  "schale",
  "seil",
  "sieb",
  "sohle",
  "spange",
  "spatel",
  "spiegel",
  "spule",
  "steg",
  "stein",
  "stift",
  "tafel",
  "tasche",
  "tasse",
  "tisch",
  "topf",
  "truhe",
  "vlies",
  "wagen",
];

const blockedCodebookWords = new Set([
  "Abbauen",
  "Aendern",
  "Anfangen",
  "Angst",
  "Arbeiten",
  "Arzt",
  "Besuchen",
  "Bleiben",
  "Casino",
  "Denken",
  "Droge",
  "Fehler",
  "Fragen",
  "Gefahr",
  "Gehen",
  "Gewalt",
  "Hass",
  "Kaufen",
  "Koennen",
  "Krankheit",
  "Krieg",
  "Laufen",
  "Machen",
  "Muessen",
  "Politik",
  "Problem",
  "Religion",
  "Risiko",
  "Sagen",
  "Schmerz",
  "Schuld",
  "Sehen",
  "Sex",
  "Sollen",
  "Sterben",
  "Suchen",
  "Tod",
  "Toeten",
  "Tragen",
  "Verbot",
  "Verbrechen",
  "Verlust",
  "Waffe",
  "Wollen",
  "Zwang",
]);

const buildGermanCodebook = () => {
  const words = [];
  const seen = new Set();

  const add = (word) => {
    const candidate = titleWord(word);
    if (!candidate) return;
    if (!/^[A-Z][a-z]+$/.test(candidate)) return;
    if (candidate.length > 12) return;
    if (blockedCodebookWords.has(candidate)) return;
    if (seen.has(candidate)) return;
    seen.add(candidate);
    words.push(candidate);
  };

  for (const word of standaloneWords) add(word);

  for (const suffix of suffixes) {
    for (const prefix of prefixes) {
      add(`${prefix}${suffix}`);
      if (words.length >= 5000) break;
    }
    if (words.length >= 5000) break;
  }

  if (words.length < 5000) {
    throw new Error(`German codebook generated ${words.length} words`);
  }

  return words.slice(0, 5000);
};

const earthNameOverridesByCode = new Map(
  Object.entries({
    1835848: "Seoul",
    1850147: "Tokio",
    1816670: "Peking",
    2988507: "Paris",
    5128581: "New York",
    2643743: "London",
    2950159: "Berlin",
    3169070: "Rom",
    3530597: "Mexiko",
    2147714: "Sydney",
    5368361: "Los Angeles",
    1880252: "Singapur",
    292223: "Dubai",
    745044: "Istanbul",
    3451190: "Rio",
    3435910: "Buenos Aires",
    360630: "Kairo",
    3369157: "Kapstadt",
    1275339: "Mumbai",
    1273294: "Delhi",
    1609350: "Bangkok",
    1796236: "Shanghai",
    1819729: "Hong Kong",
    6167865: "Toronto",
    6077243: "Montreal",
    6094817: "Ottawa",
    6173331: "Vancouver",
  }),
);

const translateEarthRegionName = (row) => {
  if (earthNameOverridesByCode.has(String(row.code))) {
    return earthNameOverridesByCode.get(String(row.code));
  }
  return normalizeAscii(row.name);
};

const marineTerms = new Map([
  ["Sea", "Meer"],
  ["Ocean", "Ozean"],
  ["Bay", "Bucht"],
  ["Gulf", "Golf"],
  ["Channel", "Kanal"],
  ["Strait", "Meerenge"],
  ["Sound", "Sund"],
  ["Basin", "Becken"],
  ["Ridge", "Ruecken"],
  ["Plateau", "Plateau"],
  ["Rise", "Schwelle"],
  ["Trench", "Graben"],
  ["Bank", "Bank"],
]);

const translateRegion3Name = (row) => {
  let name = normalizeAscii(row.name);

  if (name === "Antarctic Continent") {
    return "Antarktis";
  }

  if (row.source === "natural-earth-marine") {
    const marineGridMatch = name.match(
      /^(.+) (Sea|Ocean|Bay|Gulf|Channel|Strait|Sound|Basin|Ridge|Plateau|Rise|Trench|Bank) (\d+)$/,
    );
    if (marineGridMatch) {
      const [, base, term, index] = marineGridMatch;
      return normalizeAscii(
        `${base} ${marineTerms.get(term) ?? term} ${index}`,
      );
    }

    for (const [english, german] of marineTerms) {
      name = name.replace(new RegExp(`^${english} `), `${german} `);
      name = name.replace(new RegExp(` ${english} `), ` ${german} `);
      name = name.replace(new RegExp(` ${english}( \\d+)$`), ` ${german}$1`);
    }
  }

  name = name
    .replace(/^Antarctic /, "Antarktis ")
    .replace(/^Arctic /, "Arktis ")
    .replace(/^Sahara /, "Sahara ")
    .replace(/^Greenland /, "Groenland ")
    .replace(/^Desert /, "Wuesten ")
    .replace(/^Forest /, "Wald ")
    .replace(/^Island /, "Insel ")
    .replace(/^Lake /, "See ")
    .replace(/^Mount /, "Berg ")
    .replace(/^River /, "Fluss ")
    .replace(/^Valley /, "Tal ");

  return normalizeAscii(name);
};

const planetaryPhraseOverrides = new Map([
  ["Mare Tranquillitatis", "Meer Ruhe"],
  ["Mare Serenitatis", "Meer Heiterkeit"],
  ["Mare Imbrium", "Meer Regen"],
  ["Mare Crisium", "Meer Krisen"],
  ["Mare Nectaris", "Meer Nektar"],
  ["Mare Nubium", "Meer Wolken"],
  ["Mare Humorum", "Meer Feuchte"],
  ["Mare Frigoris", "Meer Kaelte"],
  ["Mare Orientale", "Meer Osten"],
  ["Mare Australe", "Meer Sueden"],
  ["Oceanus Procellarum", "Ozean Stuerme"],
  ["Sinus Iridum", "Bucht Regenbogen"],
  ["Lacus Somniorum", "See Traeume"],
  ["Olympus Mons", "Olympus Berg"],
  ["Elysium Mons", "Elysium Berg"],
  ["Ascraeus Mons", "Ascraeus Berg"],
  ["Arsia Mons", "Arsia Berg"],
  ["Pavonis Mons", "Pavonis Berg"],
  ["Valles Marineris", "Mariner Tal"],
  ["Hellas Planitia", "Hellas Ebene"],
  ["Utopia Planitia", "Utopia Ebene"],
  ["Amazonis Planitia", "Amazonis Ebene"],
  ["Isidis Planitia", "Isidis Ebene"],
  ["Argyre Planitia", "Argyre Ebene"],
  ["Borealis Planitia", "Borealis Ebene"],
]);

const planetaryTerms = [
  [/^Mare /, "Meer "],
  [/^Maria /, "Meere "],
  [/^Oceanus /, "Ozean "],
  [/^Sinus /, "Bucht "],
  [/^Lacus /, "See "],
  [/^Palus /, "Sumpf "],
  [/^Mons /, "Berg "],
  [/^Montes /, "Berge "],
  [/^Vallis /, "Tal "],
  [/^Valles /, "Taeler "],
  [/^Rima /, "Rille "],
  [/^Rimae /, "Rillen "],
  [/^Rupes /, "Steilhang "],
  [/^Dorsum /, "Ruecken "],
  [/^Dorsa /, "Ruecken "],
  [/^Planitia /, "Ebene "],
  [/^Planum /, "Plateau "],
  [/^Terra /, "Land "],
  [/^Chaos /, "Chaos "],
  [/^Chasma /, "Schlucht "],
  [/^Chasmata /, "Schluchten "],
  [/^Vastitas /, "Weite "],
  [/^Cavus /, "Mulde "],
  [/^Cavi /, "Mulden "],
  [/^Fossa /, "Graben "],
  [/^Fossae /, "Graeben "],
  [/^Labes /, "Rutschung "],
  [/^Lingula /, "Zunge "],
  [/^Mensae /, "Tafelberge "],
  [/^Mensa /, "Tafelberg "],
  [/^Patera /, "Patera "],
  [/^Scopulus /, "Steilhang "],
  [/^Scopuli /, "Steilhaenge "],
  [/^Sulcus /, "Furche "],
  [/^Sulci /, "Furchen "],
  [/^Tholus /, "Kuppe "],
  [/^Tholi /, "Kuppen "],
  [/^Undae /, "Duenen "],
  [/^Vicus /, "Dorf "],
  [/ Crater( \d+)?$/, " Krater$1"],
];

const translatePlanetaryName = (name) => {
  const normalized = normalizeAscii(name);
  if (planetaryPhraseOverrides.has(normalized)) {
    return planetaryPhraseOverrides.get(normalized);
  }

  let translated = normalized;
  for (const [pattern, replacement] of planetaryTerms) {
    translated = translated.replace(pattern, replacement);
  }
  translated = translated.replace(/^([A-Za-z]+) Krater( \d+)?$/, "Krater $1$2");
  return normalizeAscii(translated);
};

const dedupeNames = (rows) => {
  const seen = new Set();
  return rows.map((row) => {
    const baseName = row.name;
    let name = baseName;
    let count = 2;
    while (seen.has(name.toLowerCase())) {
      name = `${baseName} ${count}`;
      count += 1;
    }
    seen.add(name.toLowerCase());
    if (name === row.name) return row;
    return {
      ...row,
      name,
    };
  });
};

const buildLocalizedRows = (sourcePath, targetPath, translateName) => {
  const rows = readJson(sourcePath).map((row) => ({
    ...row,
    name: translateName(row),
  }));
  writeJson(targetPath, dedupeNames(rows));
};

const addLookupKeys = (keys, row) => {
  keys.add(String(row.name ?? "").toLowerCase());
  keys.add(String(row.code ?? "").toLowerCase());
};

const avoidNamedGapLookupCollisions = (targetPath, reservedPaths) => {
  const rows = readJson(targetPath);
  const lookupKeys = new Set();

  for (const reservedPath of reservedPaths) {
    for (const row of readJson(reservedPath)) {
      addLookupKeys(lookupKeys, row);
    }
  }

  for (const row of rows) {
    if (row.source !== "synthetic-named-gap") {
      addLookupKeys(lookupKeys, row);
    }
  }

  const localizedRows = rows.map((row) => {
    if (row.source !== "synthetic-named-gap") {
      return row;
    }

    const baseName = row.name;
    let name = baseName;
    let count = 2;
    while (lookupKeys.has(name.toLowerCase())) {
      const suffix = ` ${count}`;
      name = `${baseName.slice(0, 20 - suffix.length).trim()}${suffix}`;
      count += 1;
    }
    lookupKeys.add(name.toLowerCase());

    if (name === row.name) {
      return row;
    }
    return {
      ...row,
      name,
    };
  });

  writeJson(targetPath, localizedRows);
};

const buildEmbeddedRegionDb = async (regionName) => {
  const regionJsonPath = new URL(
    `packages/geoint/region-dist/${regionName}.json`,
    root,
  );
  const regionDbPath = new URL("packages/geoint/region-db/", root);
  const regionLevelDbPath = path.join(regionDbPath.pathname, regionName);
  const regionKDBushPath = path.join(
    regionDbPath.pathname,
    `${regionName}.index`,
  );
  const regionLevel = Number(regionName.split("-")[1]);
  const regions = JSON.parse(readFileSync(regionJsonPath, "utf8"));

  mkdirSync(regionDbPath, { recursive: true });
  rmSync(regionLevelDbPath, { recursive: true, force: true });
  rmSync(regionKDBushPath, { force: true });

  const kdbush = new KDBush(regions.length);
  const db = new Level(regionLevelDbPath);
  await db.open();

  for (const [index, region] of regions.entries()) {
    await db.put(`I-${index}`, JSON.stringify(region));
    await db.put(
      `N-${regionLevel === 1 ? region.code : region.name}`,
      `I-${index}`,
    );
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

writeJson("packages/codebook/codebook-dist/german.json", buildGermanCodebook());

if (mode === "all") {
  buildLocalizedRows(
    "packages/geoint/region-dist/region-2.json",
    "packages/geoint/region-dist/region-2-german.json",
    translateEarthRegionName,
  );
  buildLocalizedRows(
    "packages/geoint/region-dist/region-3.json",
    "packages/geoint/region-dist/region-3-german.json",
    translateRegion3Name,
  );
  avoidNamedGapLookupCollisions(
    "packages/geoint/region-dist/region-3-german.json",
    [
      "packages/geoint/region-dist/region-1.json",
      "packages/geoint/region-dist/region-2-german.json",
    ],
  );
  buildLocalizedRows(
    "packages/geoint/region-dist/region-2-moon.json",
    "packages/geoint/region-dist/region-2-moon-german.json",
    (row) => translatePlanetaryName(row.name),
  );
  buildLocalizedRows(
    "packages/geoint/region-dist/region-2-mars.json",
    "packages/geoint/region-dist/region-2-mars-german.json",
    (row) => translatePlanetaryName(row.name),
  );
  buildLocalizedRows(
    "packages/geoint/region-dist/region-3-mars.json",
    "packages/geoint/region-dist/region-3-mars-german.json",
    (row) => translatePlanetaryName(row.name),
  );

  for (const regionName of [
    "region-2-german",
    "region-3-german",
    "region-2-moon-german",
    "region-2-mars-german",
    "region-3-mars-german",
  ]) {
    await buildEmbeddedRegionDb(regionName);
  }
}
