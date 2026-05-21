import { readFileSync, writeFileSync } from "node:fs";

const root = new URL("../", import.meta.url);

const readJson = (path) => JSON.parse(readFileSync(new URL(path, root), "utf8"));
const writeJson = (path, value) =>
  writeFileSync(new URL(path, root), `${JSON.stringify(value, null, 2)}\n`);

const normalizeAscii = (value) =>
  value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/œ/g, "oe")
    .replace(/Œ/g, "Oe")
    .replace(/æ/g, "ae")
    .replace(/Æ/g, "Ae")
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
  "Abri",
  "Aire",
  "Album",
  "Amande",
  "Ancre",
  "Aneth",
  "Anis",
  "Anneau",
  "Arbre",
  "Archet",
  "Argile",
  "Armoire",
  "Arome",
  "Atelier",
  "Aubepine",
  "Aulne",
  "Aurore",
  "Avoine",
  "Baguette",
  "Balai",
  "Balle",
  "Banc",
  "Bande",
  "Bateau",
  "Baton",
  "Baume",
  "Bocal",
  "Bois",
  "Boite",
  "Bol",
  "Bonbon",
  "Borne",
  "Bosse",
  "Boucle",
  "Bougie",
  "Boule",
  "Bouquet",
  "Bourgeon",
  "Bouton",
  "Branche",
  "Brique",
  "Brise",
  "Brosse",
  "Buis",
  "Cabane",
  "Cacao",
  "Cache",
  "Cahier",
  "Caisse",
  "Calebasse",
  "Canal",
  "Canne",
  "Carafe",
  "Carotte",
  "Carte",
  "Casier",
  "Cedre",
  "Cerisier",
  "Cerise",
  "Chalet",
  "Champ",
  "Chapeau",
  "Charme",
  "Chene",
  "Chevalet",
  "Cheville",
  "Ciel",
  "Cire",
  "Citron",
  "Clairiere",
  "Cloche",
  "Clou",
  "Coing",
  "Colline",
  "Coquille",
  "Corbeille",
  "Corde",
  "Coton",
  "Coupe",
  "Coussin",
  "Couvercle",
  "Craie",
  "Cruche",
  "Cuiller",
  "Cuivre",
  "Cypres",
  "Dalle",
  "Digue",
  "Drap",
  "Dune",
  "Echelle",
  "Ecorce",
  "Ecrin",
  "Ecuelle",
  "Etain",
  "Etagere",
  "Etang",
  "Etui",
  "Eventail",
  "Fagot",
  "Faience",
  "Farine",
  "Fauvette",
  "Feuille",
  "Ficelle",
  "Figue",
  "Fil",
  "Fleur",
  "Flocon",
  "Fontaine",
  "Fougere",
  "Fraise",
  "Frene",
  "Galet",
  "Gazon",
  "Givre",
  "Gobelet",
  "Graine",
  "Grange",
  "Gravier",
  "Griffe",
  "Grille",
  "Groseille",
  "Haie",
  "Herbe",
  "Hetre",
  "Houx",
  "Housse",
  "Iris",
  "Jardin",
  "Jarre",
  "Jasmin",
  "Jonc",
  "Laiton",
  "Lampe",
  "Lanterne",
  "Lavande",
  "Lierre",
  "Lin",
  "Lisiere",
  "Livre",
  "Louche",
  "Lueur",
  "Lutin",
  "Luzerne",
  "Macaron",
  "Malle",
  "Manche",
  "Manguier",
  "Margelle",
  "Marron",
  "Menthe",
  "Merisier",
  "Miel",
  "Miroir",
  "Moisson",
  "Moule",
  "Mousse",
  "Muguet",
  "Murier",
  "Myrtille",
  "Nappe",
  "Nectar",
  "Noisette",
  "Noyer",
  "Nuage",
  "Olivier",
  "Ombelle",
  "Orge",
  "Osier",
  "Outil",
  "Paille",
  "Panier",
  "Papier",
  "Parasol",
  "Parfum",
  "Passoire",
  "Patere",
  "Pavillon",
  "Peigne",
  "Perle",
  "Pichet",
  "Pierre",
  "Pince",
  "Pinson",
  "Plateau",
  "Plume",
  "Poignee",
  "Poire",
  "Pommier",
  "Prairie",
  "Prune",
  "Pupitre",
  "Rayon",
  "Regle",
  "Rideau",
  "Rive",
  "Roseau",
  "Ruban",
  "Sable",
  "Sabot",
  "Safran",
  "Sapin",
  "Sauge",
  "Seau",
  "Seigle",
  "Semence",
  "Serre",
  "Serviette",
  "Silex",
  "Sureau",
  "Table",
  "Tamis",
  "Tasse",
  "Thym",
  "Tilleul",
  "Tiroir",
  "Toile",
  "Torchon",
  "Tournesol",
  "Trefle",
  "Treille",
  "Tuiles",
  "Tulipe",
  "Vallee",
  "Vanille",
  "Vase",
  "Verger",
  "Verre",
  "Verveine",
  "Vigne",
  "Violette",
  "Volet",
];

const prefixes = [
  "Abricot",
  "Acacia",
  "Amande",
  "Aneth",
  "Anis",
  "Argile",
  "Aulne",
  "Avoine",
  "Bambou",
  "Basilic",
  "Baie",
  "Ble",
  "Bois",
  "Bouleau",
  "Brise",
  "Bruyere",
  "Buis",
  "Cacao",
  "Cannelle",
  "Carotte",
  "Cedre",
  "Cerise",
  "Chene",
  "Cire",
  "Citron",
  "Coton",
  "Cypres",
  "Eau",
  "Dune",
  "Ecorce",
  "Erable",
  "Figue",
  "Fleur",
  "Fraise",
  "Frene",
  "Fer",
  "Galet",
  "Givre",
  "Graine",
  "Gravier",
  "Herbe",
  "Hetre",
  "Houx",
  "Iris",
  "Jasmin",
  "Jonc",
  "Lac",
  "Lavande",
  "Lierre",
  "Lin",
  "Lis",
  "Lys",
  "Luzerne",
  "Menthe",
  "Mer",
  "Miel",
  "Mousse",
  "Muguet",
  "Murier",
  "Myrtille",
  "Noisette",
  "Noyer",
  "Or",
  "Olive",
  "Orge",
  "Osier",
  "Paille",
  "Papier",
  "Peche",
  "Poire",
  "Pomme",
  "Pois",
  "Prairie",
  "Prune",
  "Roseau",
  "Riz",
  "Safran",
  "Sapin",
  "Sauge",
  "Seigle",
  "Sel",
  "Son",
  "Sureau",
  "Thym",
  "Tilleul",
  "Trefle",
  "Tulipe",
  "The",
  "Vanille",
  "Verveine",
  "Vigne",
  "Violette",
];

const suffixes = [
  "abri",
  "anse",
  "arc",
  "bague",
  "balai",
  "banc",
  "bocal",
  "boite",
  "bol",
  "borne",
  "boule",
  "brin",
  "brosse",
  "cache",
  "cadre",
  "caisse",
  "canne",
  "carafe",
  "carte",
  "casier",
  "cloche",
  "clou",
  "corde",
  "coupe",
  "coussin",
  "cruche",
  "dalle",
  "ecrin",
  "etui",
  "fagot",
  "ficelle",
  "fil",
  "flacon",
  "gobelet",
  "grille",
  "housse",
  "jarre",
  "lampe",
  "louche",
  "malle",
  "manche",
  "moule",
  "nappe",
  "panier",
  "patere",
  "peigne",
  "pichet",
  "pince",
  "plaque",
  "plateau",
  "poche",
  "poignee",
  "pot",
  "regle",
  "rideau",
  "ruban",
  "sac",
  "seau",
  "tamis",
  "tasse",
  "tiroir",
  "toile",
  "vase",
  "verre",
  "volet",
];

const blockedCodebookWords = new Set([
  "Alcool",
  "Arme",
  "Casino",
  "Crime",
  "Drogue",
  "Guerre",
  "Haine",
  "Maladie",
  "Medecin",
  "Mort",
  "Politique",
  "Religion",
  "Sexe",
  "Violence",
  "Vin",
]);

const buildFrenchCodebook = () => {
  const words = [];
  const seen = new Set();
  const bip39SeedWords = readJson(
    "packages/codebook/codebook-dataset/french/bip39-normalized-seed.json",
  );

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
  for (const word of bip39SeedWords) add(word);

  for (const suffix of suffixes) {
    for (const prefix of prefixes) {
      add(`${prefix}${suffix}`);
      if (words.length >= 5000) break;
    }
    if (words.length >= 5000) break;
  }

  if (words.length < 5000) {
    throw new Error(`French codebook generated ${words.length} words`);
  }

  return words.slice(0, 5000);
};

const earthNameOverridesByCode = new Map(
  Object.entries({
    "1835848": "Seoul",
    "1850147": "Tokyo",
    "1816670": "Pekin",
    "2988507": "Paris",
    "5128581": "New York",
    "2643743": "Londres",
    "2950159": "Berlin",
    "3169070": "Rome",
    "3530597": "Mexico",
    "2147714": "Sydney",
    "5368361": "Los Angeles",
    "1880252": "Singapour",
    "292223": "Dubai",
    "745044": "Istanbul",
    "3451190": "Rio",
    "3435910": "Buenos Aires",
    "360630": "Le Caire",
    "3369157": "Le Cap",
    "1275339": "Bombay",
    "1273294": "Delhi",
    "1609350": "Bangkok",
    "1796236": "Shanghai",
    "1819729": "Hong Kong",
    "6167865": "Toronto",
    "6077243": "Montreal",
    "6094817": "Ottawa",
    "6173331": "Vancouver",
  }),
);

const translateEarthRegionName = (row) => {
  if (earthNameOverridesByCode.has(String(row.code))) {
    return earthNameOverridesByCode.get(String(row.code));
  }
  return normalizeAscii(row.name);
};

const marineTerms = new Map([
  ["Sea", "Mer"],
  ["Ocean", "Ocean"],
  ["Bay", "Baie"],
  ["Gulf", "Golfe"],
  ["Channel", "Chenal"],
  ["Strait", "Detroit"],
  ["Sound", "Detroit"],
  ["Basin", "Bassin"],
  ["Ridge", "Dorsale"],
  ["Plateau", "Plateau"],
  ["Rise", "Ride"],
  ["Trench", "Fosse"],
  ["Bank", "Banc"],
]);

const translateRegion3Name = (row) => {
  let name = normalizeAscii(row.name);

  if (name === "Antarctic Continent") {
    return "Antarctique";
  }

  if (row.source === "synthetic-named-gap" && name === "HavreSaint Pierre") {
    return "Havre Pierre";
  }

  if (row.source === "natural-earth-marine") {
    const marineGridMatch = name.match(/^(.+) (Sea|Ocean|Bay|Gulf|Channel|Strait|Sound|Basin|Ridge|Plateau|Rise|Trench|Bank) (\d+)$/);
    if (marineGridMatch) {
      const [, base, term, index] = marineGridMatch;
      return normalizeAscii(`${marineTerms.get(term) ?? term} ${base} ${index}`);
    }

    for (const [english, french] of marineTerms) {
      name = name.replace(new RegExp(`^${english} `), `${french} `);
      name = name.replace(new RegExp(` ${english} `), ` ${french} `);
      name = name.replace(new RegExp(` ${english}( \\d+)$`), ` ${french}$1`);
    }
  }

  name = name
    .replace(/^Antarctic /, "Antarctique ")
    .replace(/^Arctic /, "Arctique ")
    .replace(/^Sahara /, "Sahara ")
    .replace(/^Greenland /, "Groenland ")
    .replace(/^Desert /, "Desert ")
    .replace(/^Forest /, "Foret ")
    .replace(/^Island /, "Ile ")
    .replace(/^Lake /, "Lac ")
    .replace(/^Mount /, "Mont ")
    .replace(/^River /, "Riviere ")
    .replace(/^Valley /, "Vallee ");

  return normalizeAscii(name);
};

const planetaryPhraseOverrides = new Map([
  ["Mare Tranquillitatis", "Mer Tranquillite"],
  ["Mare Serenitatis", "Mer Serenite"],
  ["Mare Imbrium", "Mer Pluies"],
  ["Mare Crisium", "Mer Crises"],
  ["Mare Nectaris", "Mer Nectar"],
  ["Mare Nubium", "Mer Nuages"],
  ["Mare Humorum", "Mer Humeurs"],
  ["Mare Frigoris", "Mer Froid"],
  ["Mare Orientale", "Mer Orientale"],
  ["Mare Australe", "Mer Australe"],
  ["Oceanus Procellarum", "Ocean Tempetes"],
  ["Sinus Iridum", "Baie Arcs"],
  ["Lacus Somniorum", "Lac Songes"],
  ["Olympus Mons", "Mont Olympe"],
  ["Elysium Mons", "Mont Elysium"],
  ["Ascraeus Mons", "Mont Ascraeus"],
  ["Arsia Mons", "Mont Arsia"],
  ["Pavonis Mons", "Mont Pavonis"],
  ["Valles Marineris", "Vallees Marineris"],
  ["Hellas Planitia", "Plaine Hellas"],
  ["Utopia Planitia", "Plaine Utopia"],
  ["Amazonis Planitia", "Plaine Amazonis"],
  ["Isidis Planitia", "Plaine Isidis"],
  ["Argyre Planitia", "Plaine Argyre"],
  ["Borealis Planitia", "Plaine Boreale"],
]);

const planetaryTerms = [
  [/^Mare /, "Mer "],
  [/^Maria /, "Mers "],
  [/^Oceanus /, "Ocean "],
  [/^Sinus /, "Baie "],
  [/^Lacus /, "Lac "],
  [/^Palus /, "Marais "],
  [/^Mons /, "Mont "],
  [/^Montes /, "Monts "],
  [/^Vallis /, "Vallee "],
  [/^Valles /, "Vallees "],
  [/^Rima /, "Rainure "],
  [/^Rimae /, "Rainures "],
  [/^Rupes /, "Escarpement "],
  [/^Dorsum /, "Ride "],
  [/^Dorsa /, "Rides "],
  [/^Planitia /, "Plaine "],
  [/^Planum /, "Plateau "],
  [/^Terra /, "Terre "],
  [/^Chaos /, "Chaos "],
  [/^Chasma /, "Gouffre "],
  [/^Chasmata /, "Gouffres "],
  [/^Vastitas /, "Plaine "],
  [/^Cavus /, "Creux "],
  [/^Cavi /, "Creux "],
  [/^Fossa /, "Fosse "],
  [/^Fossae /, "Fosses "],
  [/^Labes /, "Glissement "],
  [/^Lingula /, "Langue "],
  [/^Mensae /, "Mesas "],
  [/^Mensa /, "Mesa "],
  [/^Patera /, "Patera "],
  [/^Scopulus /, "Escarpe "],
  [/^Scopuli /, "Escarpes "],
  [/^Sulcus /, "Sillon "],
  [/^Sulci /, "Sillons "],
  [/^Tholus /, "Dome "],
  [/^Tholi /, "Domes "],
  [/^Undae /, "Dunes "],
  [/^Vicus /, "Village "],
  [/ Crater( \d+)?$/, " Cratere$1"],
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
  translated = translated.replace(/^([A-Za-z]+) Cratere( \d+)?$/, "Cratere $1$2");
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

writeJson("packages/codebook/codebook-dist/french.json", buildFrenchCodebook());

buildLocalizedRows(
  "packages/geoint/region-dist/region-2.json",
  "packages/geoint/region-dist/region-2-french.json",
  translateEarthRegionName,
);
buildLocalizedRows(
  "packages/geoint/region-dist/region-3.json",
  "packages/geoint/region-dist/region-3-french.json",
  translateRegion3Name,
);
buildLocalizedRows(
  "packages/geoint/region-dist/region-2-moon.json",
  "packages/geoint/region-dist/region-2-moon-french.json",
  (row) => translatePlanetaryName(row.name),
);
buildLocalizedRows(
  "packages/geoint/region-dist/region-2-mars.json",
  "packages/geoint/region-dist/region-2-mars-french.json",
  (row) => translatePlanetaryName(row.name),
);
buildLocalizedRows(
  "packages/geoint/region-dist/region-3-mars.json",
  "packages/geoint/region-dist/region-3-mars-french.json",
  (row) => translatePlanetaryName(row.name),
);
