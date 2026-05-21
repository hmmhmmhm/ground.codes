import { readFileSync } from "node:fs";

const CODEBOOK_FILES = {
  english: "../packages/codebook/codebook-dist/english.json",
  korean: "../packages/codebook/codebook-dist/korean.json",
  chinese: "../packages/codebook/codebook-dist/chinese.json",
  japanese: "../packages/codebook/codebook-dist/japanese.json",
  spanish: "../packages/codebook/codebook-dist/spanish.json",
};

const COMPOUND_SUFFIXES = {
  english: [
    "bag",
    "basket",
    "bell",
    "bin",
    "book",
    "bowl",
    "box",
    "brush",
    "can",
    "cap",
    "card",
    "case",
    "cloth",
    "cord",
    "cover",
    "cup",
    "dish",
    "drop",
    "fork",
    "holder",
    "hook",
    "jar",
    "jug",
    "kite",
    "lamp",
    "land",
    "lid",
    "line",
    "map",
    "mat",
    "mug",
    "pan",
    "pad",
    "pin",
    "plate",
    "pot",
    "pouch",
    "rack",
    "ring",
    "roll",
    "rope",
    "sock",
    "spoon",
    "stand",
    "stick",
    "tag",
    "tin",
    "tray",
    "tub",
  ],
  korean: [
    "가방",
    "갓",
    "걸이",
    "그릇",
    "그림",
    "끈",
    "꽂이",
    "덮개",
    "마개",
    "망",
    "모양",
    "무늬",
    "받침",
    "바구니",
    "방",
    "병",
    "봉지",
    "봉투",
    "상자",
    "솔",
    "수건",
    "자루",
    "잔",
    "장",
    "접시",
    "주머니",
    "집",
    "카드",
    "컵",
    "통",
    "틀",
    "함",
  ],
  chinese: [
    "包",
    "杯",
    "笔",
    "草",
    "袋",
    "垫",
    "碟",
    "盖",
    "锅",
    "果",
    "盒",
    "花",
    "夹",
    "架",
    "篮",
    "盘",
    "盆",
    "瓶",
    "箩",
    "勺",
    "桶",
    "托",
    "匣",
    "叶",
    "盂",
    "盅",
    "罐",
    "管",
    "筒",
    "碗",
    "刷",
  ],
  japanese: [
    "いれ",
    "かご",
    "かけ",
    "くし",
    "こざら",
    "こなべ",
    "こばこ",
    "こま",
    "さら",
    "ざら",
    "だな",
    "たま",
    "つつみ",
    "つぼ",
    "なべ",
    "はこ",
    "ばこ",
    "ひも",
    "ふた",
    "ます",
    "もち",
  ],
  spanish: [
    "aro",
    "asa",
    "abanico",
    "anillo",
    "azulejo",
    "banco",
    "bandeja",
    "barreno",
    "baston",
    "baul",
    "boceto",
    "bol",
    "bolsa",
    "bote",
    "botella",
    "boton",
    "brocha",
    "caja",
    "cajon",
    "canasta",
    "carrete",
    "candil",
    "cepillo",
    "cesta",
    "cesto",
    "cazo",
    "cazuela",
    "cinta",
    "copa",
    "cordel",
    "costal",
    "criba",
    "cuerda",
    "cuenco",
    "cubo",
    "cubeta",
    "cuna",
    "cuchara",
    "dado",
    "dedal",
    "estera",
    "estante",
    "etiqueta",
    "ficha",
    "flor",
    "frasco",
    "gancho",
    "hilera",
    "hoja",
    "jarra",
    "jarron",
    "jofaina",
    "lampara",
    "lata",
    "libro",
    "lienzo",
    "lona",
    "luz",
    "maceta",
    "mango",
    "manta",
    "mapa",
    "marco",
    "mazo",
    "mesa",
    "miel",
    "molde",
    "morral",
    "mortero",
    "olla",
    "pala",
    "paleta",
    "palillo",
    "palo",
    "pan",
    "pano",
    "peine",
    "percha",
    "pinza",
    "pieza",
    "placa",
    "plato",
    "red",
    "regla",
    "saco",
    "sal",
    "sarten",
    "sello",
    "silla",
    "sol",
    "soporte",
    "tamiz",
    "tabla",
    "tablon",
    "tapa",
    "telar",
    "tejido",
    "tarro",
    "varilla",
    "taza",
    "tira",
    "tijera",
    "tinaja",
    "torno",
    "trenza",
    "tubo",
    "vasija",
    "vaso",
    "vela",
  ],
};

const LANGUAGE_LABELS = {
  english: "English",
  korean: "Korean",
  chinese: "Chinese",
  japanese: "Japanese",
  spanish: "Spanish",
};

const TYPE_LABELS = {
  recognizedCompound: "recognized compound",
  shortStandalone: "short standalone",
  otherStandalone: "other standalone or unclassified",
};

const readCodebook = (language) =>
  JSON.parse(readFileSync(new URL(CODEBOOK_FILES[language], import.meta.url), "utf8"));

const characterLength = (word) => [...word].length;

const isShortStandalone = (language, word) => {
  const length = characterLength(word);

  if (language === "english" || language === "spanish") {
    return length <= 4;
  }

  if (language === "korean" || language === "chinese") {
    return length === 1;
  }

  return length <= 2;
};

const minPrefixLength = (language) => {
  if (language === "korean" || language === "chinese") {
    return 1;
  }

  return 3;
};

const normalizeForSuffix = (language, word) => {
  if (language === "english" || language === "spanish") {
    return word.toLowerCase();
  }

  return word;
};

const findCompoundSuffix = (language, word) => {
  const normalized = normalizeForSuffix(language, word);
  const suffixes = COMPOUND_SUFFIXES[language];
  const minPrefix = minPrefixLength(language);

  return suffixes.find(
    (suffix) =>
      normalized.endsWith(suffix) &&
      characterLength(normalized) > characterLength(suffix) + minPrefix - 1,
  );
};

export const buildTypeInventory = () => {
  return Object.keys(CODEBOOK_FILES).map((language) => {
    const words = readCodebook(language);
    const examples = {
      recognizedCompound: [],
      shortStandalone: [],
      otherStandalone: [],
    };
    const counts = {
      recognizedCompound: 0,
      shortStandalone: 0,
      otherStandalone: 0,
    };

    for (const word of words) {
      const type = findCompoundSuffix(language, word)
        ? "recognizedCompound"
        : isShortStandalone(language, word)
          ? "shortStandalone"
          : "otherStandalone";

      counts[type] += 1;

      if (examples[type].length < 5) {
        examples[type].push(word);
      }
    }

    return {
      language,
      label: LANGUAGE_LABELS[language],
      total: words.length,
      counts,
      examples,
    };
  });
};

const formatPercent = (count, total) => `${((count / total) * 100).toFixed(1)}%`;

const formatExamples = (examples) => examples.join(", ");

if (import.meta.url === `file://${process.argv[1]}`) {
  const rows = buildTypeInventory();

  console.log("| Language | Type | Count | Share | Examples |");
  console.log("| --- | --- | ---: | ---: | --- |");

  for (const row of rows) {
    for (const key of ["recognizedCompound", "shortStandalone", "otherStandalone"]) {
      console.log(
        `| ${row.label} | ${TYPE_LABELS[key]} | ${row.counts[key]} | ${formatPercent(
          row.counts[key],
          row.total,
        )} | ${formatExamples(row.examples[key])} |`,
      );
    }
  }
}
