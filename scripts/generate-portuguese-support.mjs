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
  String(value)
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
  "Acacia",
  "Acucar",
  "Agata",
  "Agua",
  "Alecrim",
  "Algodao",
  "Alho",
  "Almendra",
  "Aloe",
  "Amora",
  "Anil",
  "Areia",
  "Arroz",
  "Arvore",
  "Avelan",
  "Azeite",
  "Azeitona",
  "Bambu",
  "Barro",
  "Basilio",
  "Bau",
  "Beira",
  "Betula",
  "Bico",
  "Bolota",
  "Bolsa",
  "Borda",
  "Bosque",
  "Botao",
  "Brisa",
  "Bronze",
  "Broto",
  "Cacau",
  "Cacto",
  "Cafe",
  "Cal",
  "Canela",
  "Canoa",
  "Canto",
  "Carvalho",
  "Casca",
  "Cebola",
  "Cedro",
  "Cera",
  "Cereja",
  "Cesto",
  "Cha",
  "Chave",
  "Cipreste",
  "Cobre",
  "Colina",
  "Concha",
  "Copo",
  "Coral",
  "Corda",
  "Cortica",
  "Cravo",
  "Cristal",
  "Cuia",
  "Duna",
  "Erva",
  "Esfera",
  "Esparto",
  "Esteira",
  "Estrela",
  "Fava",
  "Feno",
  "Figueira",
  "Fio",
  "Fita",
  "Flor",
  "Folha",
  "Fonte",
  "Frasco",
  "Freixo",
  "Fruta",
  "Galho",
  "Garrafa",
  "Gesso",
  "Giz",
  "Gomo",
  "Grao",
  "Granito",
  "Hera",
  "Hortela",
  "Ilhota",
  "Jade",
  "Jardim",
  "Jarro",
  "Jasmim",
  "Juta",
  "Lago",
  "Lama",
  "Laranja",
  "Lata",
  "Laurel",
  "Lavanda",
  "Lenco",
  "Lentilha",
  "Lima",
  "Limo",
  "Linho",
  "Livro",
  "Lona",
  "Louro",
  "Luz",
  "Madeira",
  "Malva",
  "Mapa",
  "Marmelo",
  "Marmore",
  "Mel",
  "Menta",
  "Mesa",
  "Milho",
  "Mirtilo",
  "Musgo",
  "Nabo",
  "Noz",
  "Oliveira",
  "Orvalho",
  "Palha",
  "Pano",
  "Papel",
  "Parra",
  "Pedra",
  "Pena",
  "Pente",
  "Perola",
  "Pessego",
  "Pinho",
  "Pote",
  "Prata",
  "Prato",
  "Quartzo",
  "Ramo",
  "Rede",
  "Relva",
  "Riacho",
  "Ribeiro",
  "Rio",
  "Roble",
  "Roda",
  "Rosa",
  "Rubi",
  "Sabao",
  "Saco",
  "Safira",
  "Sal",
  "Salsa",
  "Seda",
  "Selo",
  "Semente",
  "Serra",
  "Tabua",
  "Tampa",
  "Tecido",
  "Telha",
  "Tenda",
  "Terra",
  "Tigela",
  "Tomilho",
  "Trevo",
  "Trigo",
  "Tulipa",
  "Uva",
  "Vale",
  "Vara",
  "Vaso",
  "Vela",
  "Vime",
  "Vinha",
  "Violeta",
  "Yute",
  "Zimbro",
];

const prefixes = [
  "Acacia",
  "Acucar",
  "Agua",
  "Aloe",
  "Amora",
  "Anil",
  "Areia",
  "Arroz",
  "Arvore",
  "Bambu",
  "Barro",
  "Brisa",
  "Cacau",
  "Cafe",
  "Canela",
  "Canoa",
  "Casca",
  "Cedro",
  "Cera",
  "Cereja",
  "Cha",
  "Cobre",
  "Coral",
  "Erva",
  "Fava",
  "Feno",
  "Fio",
  "Flor",
  "Folha",
  "Fonte",
  "Freixo",
  "Fruta",
  "Galho",
  "Giz",
  "Grao",
  "Hera",
  "Jade",
  "Juta",
  "Lago",
  "Lama",
  "Lima",
  "Linho",
  "Louro",
  "Luz",
  "Malva",
  "Mel",
  "Menta",
  "Milho",
  "Musgo",
  "Noz",
  "Palha",
  "Pano",
  "Papel",
  "Parra",
  "Pedra",
  "Pena",
  "Pinho",
  "Prata",
  "Ramo",
  "Relva",
  "Riacho",
  "Rio",
  "Roda",
  "Rosa",
  "Rubi",
  "Sabao",
  "Safira",
  "Sal",
  "Salsa",
  "Seda",
  "Selo",
  "Serra",
  "Tabua",
  "Tecido",
  "Telha",
  "Terra",
  "Trevo",
  "Trigo",
  "Uva",
  "Vale",
  "Vara",
  "Vela",
  "Vime",
  "Vinha",
  "Yute",
  "Zimbro",
];

const naturalCompoundSuffixes = [
  "branco",
  "claro",
  "doce",
  "fino",
  "leve",
  "manso",
  "novo",
  "redondo",
  "seco",
  "verde",
  "alto",
  "baixo",
  "macio",
  "liso",
  "raro",
  "vivo",
  "calmo",
  "limpo",
  "duro",
  "curto",
  "longo",
  "fresco",
  "suave",
  "cheio",
  "raso",
  "largo",
  "estreito",
  "quente",
  "frio",
  "brilho",
  "sombra",
  "jardim",
  "campo",
  "pomar",
  "trilho",
  "caminho",
  "canteiro",
  "ramo",
  "flor",
  "folha",
];

const suffixes = [
  "anel",
  "banco",
  "bandeja",
  "bastao",
  "bau",
  "bolsa",
  "botao",
  "brocha",
  "caixa",
  "cesta",
  "cesto",
  "chave",
  "copo",
  "corda",
  "cuba",
  "cuia",
  "escova",
  "esteira",
  "fita",
  "folha",
  "frasco",
  "gancho",
  "jarra",
  "lata",
  "livro",
  "lona",
  "luz",
  "mapa",
  "marco",
  "mesa",
  "pano",
  "pote",
  "prato",
  "rede",
  "saco",
  "selo",
  "suporte",
  "tabua",
  "tampa",
  "tela",
  "tigela",
  "vaso",
  "vela",
];

const blockedCodebookWords = new Set([
  "Aposta",
  "Arma",
  "Casino",
  "Crime",
  "Culpa",
  "Dever",
  "Dizer",
  "Doenca",
  "Dor",
  "Droga",
  "Erro",
  "Fazer",
  "Guerra",
  "Matar",
  "Medico",
  "Medo",
  "Morte",
  "Morrer",
  "Obrigar",
  "Odio",
  "Perda",
  "Perigo",
  "Poder",
  "Politica",
  "Problema",
  "Proibido",
  "Querer",
  "Religiao",
  "Risco",
  "Saber",
  "Sexo",
  "Violencia",
]);

const isAwkwardPortugueseCompound = (word) => {
  const lower = word.toLowerCase();
  if (lower.length % 2 === 0) {
    const half = lower.slice(0, lower.length / 2);
    if (half.length >= 4 && lower === `${half}${half}`) return true;
  }

  return /^(?:Agua|Areia|Barro|Lama|Rio|Riacho)(?:fita|lona|livro|mesa|pano|selo)$/u.test(
    word,
  );
};

const buildPortugueseCodebook = () => {
  const words = [];
  const seen = new Set();

  const add = (word) => {
    const candidate = titleWord(word);
    if (!candidate) return;
    if (!/^[A-Z][a-z]+$/.test(candidate)) return;
    if (candidate.length > 12) return;
    if (blockedCodebookWords.has(candidate)) return;
    if (isAwkwardPortugueseCompound(candidate)) return;
    if (seen.has(candidate)) return;
    seen.add(candidate);
    words.push(candidate);
  };

  for (const word of standaloneWords) add(word);

  for (const suffix of naturalCompoundSuffixes) {
    for (const prefix of prefixes) {
      add(`${prefix}${suffix}`);
      if (words.length >= 5000) break;
    }
    if (words.length >= 5000) break;
  }

  for (const suffix of suffixes) {
    for (const prefix of prefixes) {
      add(`${prefix}${suffix}`);
      if (words.length >= 5000) break;
    }
    if (words.length >= 5000) break;
  }

  if (words.length < 5000) {
    throw new Error(`Portuguese codebook generated ${words.length} words`);
  }

  return words.slice(0, 5000);
};

const earthNameOverridesByCode = new Map(
  Object.entries({
    1835848: "Seul",
    1850147: "Toquio",
    1816670: "Pequim",
    2988507: "Paris",
    5128581: "Nova York",
    2643743: "Londres",
    2950159: "Berlim",
    3169070: "Roma",
    3530597: "Cidade do Mexico",
    2147714: "Sydney",
    5368361: "Los Angeles",
    1880252: "Singapura",
    292223: "Dubai",
    745044: "Istambul",
    3451190: "Rio de Janeiro",
    3448439: "Sao Paulo",
    3469058: "Brasilia",
    2267057: "Lisboa",
    3435910: "Buenos Aires",
    360630: "Cairo",
    3369157: "Cidade do Cabo",
    1275339: "Mumbai",
    1273294: "Deli",
    1609350: "Bangkok",
    1796236: "Xangai",
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
  ["Sea", "Mar"],
  ["Ocean", "Oceano"],
  ["Bay", "Baia"],
  ["Gulf", "Golfo"],
  ["Channel", "Canal"],
  ["Strait", "Estreito"],
  ["Sound", "Estreito"],
  ["Basin", "Bacia"],
  ["Ridge", "Cordilheira"],
  ["Plateau", "Planalto"],
  ["Rise", "Elevacao"],
  ["Trench", "Fossa"],
  ["Bank", "Banco"],
]);

const limitRegion3Name = (name) => {
  if ([...name].length <= 20) return name;
  const numbered = name.match(/^(.+) (\d+)$/);
  if (!numbered) return name.slice(0, 20).trim();

  const [, base, index] = numbered;
  const maxBaseLength = 20 - index.length - 1;
  return `${base.slice(0, maxBaseLength).trim()} ${index}`;
};

const translateRegion3Name = (row) => {
  let name = normalizeAscii(row.name);

  if (name === "Antarctic Continent") {
    return "Antartida";
  }

  if (row.source === "natural-earth-marine") {
    const marineGridMatch = name.match(
      /^(.+) (Sea|Ocean|Bay|Gulf|Channel|Strait|Sound|Basin|Ridge|Plateau|Rise|Trench|Bank) (\d+)$/,
    );
    if (marineGridMatch) {
      const [, base, term, index] = marineGridMatch;
      if (term === "Sea" && /^[A-Z][A-Za-z]+$/.test(base)) {
        return limitRegion3Name(normalizeAscii(`Mar de ${base} ${index}`));
      }
      return limitRegion3Name(
        normalizeAscii(`${marineTerms.get(term) ?? term} ${base} ${index}`),
      );
    }

    for (const [english, portuguese] of marineTerms) {
      name = name.replace(new RegExp(`^${english} `), `${portuguese} `);
      name = name.replace(new RegExp(` ${english} `), ` ${portuguese} `);
      name = name.replace(
        new RegExp(` ${english}( \\d+)$`),
        ` ${portuguese}$1`,
      );
    }
  }

  name = name
    .replace(/^Antarctic /, "Antartico ")
    .replace(/^Arctic /, "Artico ")
    .replace(/^Sahara /, "Saara ")
    .replace(/^Greenland /, "Groenlandia ")
    .replace(/^Desert /, "Deserto ")
    .replace(/^Forest /, "Floresta ")
    .replace(/^Island /, "Ilha ")
    .replace(/^Lake /, "Lago ")
    .replace(/^Mount /, "Monte ")
    .replace(/^River /, "Rio ")
    .replace(/^Valley /, "Vale ");

  return limitRegion3Name(normalizeAscii(name));
};

const planetaryPhraseOverrides = new Map([
  ["Mare Tranquillitatis", "Mar da Tranquilidade"],
  ["Mare Serenitatis", "Mar da Serenidade"],
  ["Mare Imbrium", "Mar das Chuvas"],
  ["Mare Crisium", "Mar das Crises"],
  ["Mare Nectaris", "Mar do Nectar"],
  ["Mare Nubium", "Mar das Nuvens"],
  ["Mare Humorum", "Mar da Umidade"],
  ["Mare Frigoris", "Mar do Frio"],
  ["Mare Orientale", "Mar Oriental"],
  ["Mare Australe", "Mar Austral"],
  ["Oceanus Procellarum", "Oceano das Tempestades"],
  ["Sinus Iridum", "Baia do Arco Iris"],
  ["Lacus Somniorum", "Lago dos Sonhos"],
  ["Olympus Mons", "Monte Olimpo"],
  ["Elysium Mons", "Monte Elisio"],
  ["Ascraeus Mons", "Monte Ascraeus"],
  ["Arsia Mons", "Monte Arsia"],
  ["Pavonis Mons", "Monte Pavonis"],
  ["Valles Marineris", "Vales Marineris"],
  ["Hellas Planitia", "Planicie Hellas"],
  ["Utopia Planitia", "Planicie Utopia"],
  ["Amazonis Planitia", "Planicie Amazonis"],
  ["Isidis Planitia", "Planicie Isidis"],
  ["Argyre Planitia", "Planicie Argyre"],
  ["Borealis Planitia", "Planicie Boreal"],
]);

const planetaryTerms = [
  [/^Mare /, "Mar "],
  [/^Maria /, "Mares "],
  [/^Oceanus /, "Oceano "],
  [/^Sinus /, "Baia "],
  [/^Lacus /, "Lago "],
  [/^Palus /, "Pantano "],
  [/^Mons /, "Monte "],
  [/^Montes /, "Montes "],
  [/^Vallis /, "Vale "],
  [/^Valles /, "Vales "],
  [/^Rima /, "Rima "],
  [/^Rimae /, "Rimas "],
  [/^Rupes /, "Escarpa "],
  [/^Dorsum /, "Dorso "],
  [/^Dorsa /, "Dorsos "],
  [/^Planitia /, "Planicie "],
  [/^Planum /, "Planalto "],
  [/^Terra /, "Terra "],
  [/^Chaos /, "Caos "],
  [/^Chasma /, "Abismo "],
  [/^Chasmata /, "Abismos "],
  [/^Vastitas /, "Planicie "],
  [/^Cavus /, "Cavo "],
  [/^Cavi /, "Cavos "],
  [/^Fossa /, "Fossa "],
  [/^Fossae /, "Fossas "],
  [/^Labes /, "Deslizamento "],
  [/^Lingula /, "Lingua "],
  [/^Mensae /, "Mesas "],
  [/^Mensa /, "Mesa "],
  [/^Patera /, "Patera "],
  [/^Scopulus /, "Escarpa "],
  [/^Scopuli /, "Escarpas "],
  [/^Sulcus /, "Sulco "],
  [/^Sulci /, "Sulcos "],
  [/^Tholus /, "Domo "],
  [/^Tholi /, "Domos "],
  [/^Undae /, "Dunas "],
  [/^Vicus /, "Povoado "],
  [/ Crater( \d+)?$/, " Cratera$1"],
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
  translated = translated.replace(
    /^([A-Za-z]+) Cratera( \d+)?$/,
    "Cratera $1$2",
  );
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

writeJson(
  "packages/codebook/codebook-dist/portuguese.json",
  buildPortugueseCodebook(),
);

if (mode === "all") {
  buildLocalizedRows(
    "packages/geoint/region-dist/region-2.json",
    "packages/geoint/region-dist/region-2-portuguese.json",
    translateEarthRegionName,
  );
  buildLocalizedRows(
    "packages/geoint/region-dist/region-3.json",
    "packages/geoint/region-dist/region-3-portuguese.json",
    translateRegion3Name,
  );
  avoidNamedGapLookupCollisions(
    "packages/geoint/region-dist/region-3-portuguese.json",
    [
      "packages/geoint/region-dist/region-1.json",
      "packages/geoint/region-dist/region-2-portuguese.json",
    ],
  );
  buildLocalizedRows(
    "packages/geoint/region-dist/region-2-moon.json",
    "packages/geoint/region-dist/region-2-moon-portuguese.json",
    (row) => translatePlanetaryName(row.name),
  );
  buildLocalizedRows(
    "packages/geoint/region-dist/region-2-mars.json",
    "packages/geoint/region-dist/region-2-mars-portuguese.json",
    (row) => translatePlanetaryName(row.name),
  );
  buildLocalizedRows(
    "packages/geoint/region-dist/region-3-mars.json",
    "packages/geoint/region-dist/region-3-mars-portuguese.json",
    (row) => translatePlanetaryName(row.name),
  );

  for (const regionName of [
    "region-2-portuguese",
    "region-3-portuguese",
    "region-2-moon-portuguese",
    "region-2-mars-portuguese",
    "region-3-mars-portuguese",
  ]) {
    await buildEmbeddedRegionDb(regionName);
  }
}
