import { readFileSync } from "node:fs";

const CODEBOOK_FILES = {
  english: "../packages/codebook/codebook-dist/english.json",
  korean: "../packages/codebook/codebook-dist/korean.json",
  chinese: "../packages/codebook/codebook-dist/chinese.json",
  japanese: "../packages/codebook/codebook-dist/japanese.json",
  spanish: "../packages/codebook/codebook-dist/spanish.json",
  french: "../packages/codebook/codebook-dist/french.json",
  german: "../packages/codebook/codebook-dist/german.json",
  portuguese: "../packages/codebook/codebook-dist/portuguese.json",
  indonesian: "../packages/codebook/codebook-dist/indonesian.json",
  thai: "../packages/codebook/codebook-dist/thai.json",
  vietnamese: "../packages/codebook/codebook-dist/vietnamese.json",
  hindi: "../packages/codebook/codebook-dist/hindi.json",
  arabic: "../packages/codebook/codebook-dist/arabic.json",
};

const SPANISH_REVIEW_FILES = [
  "../packages/codebook/codebook-dataset/spanish/standalone-review-2026-05-21.md",
];

const INDONESIAN_REVIEW_FILES = [
  "../packages/codebook/codebook-dataset/indonesian/standalone-review-2026-05-22.md",
  "../packages/codebook/codebook-dataset/indonesian/standalone-review-2026-05-22-v2.md",
  "../packages/codebook/codebook-dataset/indonesian/standalone-review-2026-05-24.md",
];

const GERMAN_REVIEW_FILES = [
  "../packages/codebook/codebook-dataset/german/standalone-review-2026-05-24.md",
];

const FRENCH_REVIEW_FILES = [
  "../packages/codebook/codebook-dataset/french/standalone-review-2026-05-24.md",
];

const PORTUGUESE_REVIEW_FILES = [
  "../packages/codebook/codebook-dataset/portuguese/standalone-review-2026-05-24.md",
];

const readReviewedSpanishStandaloneWords = () => {
  const words = new Set();

  for (const path of SPANISH_REVIEW_FILES) {
    const text = readFileSync(new URL(path, import.meta.url), "utf8");
    for (const match of text.matchAll(/`([A-Z][a-z]+)`/g)) {
      words.add(match[1]);
    }
  }

  return words;
};

const SPANISH_REVIEWED_STANDALONE_WORDS = readReviewedSpanishStandaloneWords();

const readReviewedIndonesianStandaloneWords = () => {
  const words = new Set();

  for (const path of INDONESIAN_REVIEW_FILES) {
    const text = readFileSync(new URL(path, import.meta.url), "utf8");
    for (const match of text.matchAll(/`([A-Z][a-z]+)`/g)) {
      words.add(match[1]);
    }
  }

  return words;
};

const INDONESIAN_REVIEWED_STANDALONE_WORDS =
  readReviewedIndonesianStandaloneWords();

const readReviewedGermanStandaloneWords = () => {
  const words = new Set();

  for (const path of GERMAN_REVIEW_FILES) {
    const text = readFileSync(new URL(path, import.meta.url), "utf8");
    for (const match of text.matchAll(/`([A-Z][a-z]+)`/g)) {
      words.add(match[1]);
    }
  }

  return words;
};

const GERMAN_REVIEWED_STANDALONE_WORDS = readReviewedGermanStandaloneWords();

const readReviewedFrenchStandaloneWords = () => {
  const words = new Set();

  for (const path of FRENCH_REVIEW_FILES) {
    const text = readFileSync(new URL(path, import.meta.url), "utf8");
    for (const match of text.matchAll(/`([A-Z][a-z]+)`/g)) {
      words.add(match[1]);
    }
  }

  return words;
};

const FRENCH_REVIEWED_STANDALONE_WORDS = readReviewedFrenchStandaloneWords();

const readReviewedPortugueseStandaloneWords = () => {
  const words = new Set();

  for (const path of PORTUGUESE_REVIEW_FILES) {
    const text = readFileSync(new URL(path, import.meta.url), "utf8");
    for (const match of text.matchAll(/`([A-Z][a-z]+)`/g)) {
      words.add(match[1]);
    }
  }

  return words;
};

const PORTUGUESE_REVIEWED_STANDALONE_WORDS =
  readReviewedPortugueseStandaloneWords();

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
  french: [
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
  ],
  german: [
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
  ],
  portuguese: [
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
    "tigela",
    "vaso",
    "vela",
  ],
  indonesian: [
    "akar",
    "bakul",
    "bambu",
    "batu",
    "benda",
    "biji",
    "bilik",
    "bunga",
    "cawan",
    "daun",
    "dulang",
    "gelas",
    "guci",
    "ikat",
    "jarum",
    "kaca",
    "kain",
    "kaleng",
    "kapas",
    "kayu",
    "kendi",
    "kerang",
    "kertas",
    "kipas",
    "kotak",
    "kubus",
    "kunci",
    "lampu",
    "lantai",
    "layar",
    "lemari",
    "lensa",
    "lidi",
    "lilin",
    "mangga",
    "meja",
    "nyiru",
    "pagar",
    "panci",
    "papan",
    "payung",
    "pelita",
    "piring",
    "pita",
    "pot",
    "rak",
    "rakit",
    "ranting",
    "rotan",
    "rumah",
    "saku",
    "sikat",
    "tali",
    "taman",
    "topi",
    "wadah",
    "wajan",
    "alami",
    "angin",
    "awan",
    "bagus",
    "baru",
    "bening",
    "bersih",
    "biru",
    "bulat",
    "cerah",
    "datar",
    "halus",
    "hangat",
    "harum",
    "hijau",
    "indah",
    "jernih",
    "kecil",
    "kuning",
    "lebar",
    "lebat",
    "lembut",
    "luas",
    "lurus",
    "manis",
    "merah",
    "murni",
    "muda",
    "padat",
    "panjang",
    "pendek",
    "rata",
    "putih",
    "rapi",
    "rendah",
    "ringan",
    "rindang",
    "segar",
    "sejuk",
    "subur",
    "teduh",
    "tenang",
    "terang",
    "tinggi",
    "tipis",
    "utuh",
    "wangi",
  ],
  thai: [
    "น้ำ",
    "ไฟ",
    "ลม",
    "ดิน",
    "หิน",
    "ไม้",
    "ใบ",
    "ดอก",
    "สวน",
    "บ้าน",
    "ข้าว",
    "ปลา",
    "นก",
    "ผ้า",
    "เหล็ก",
    "แก้ว",
    "เมฆ",
    "ฝน",
    "ดาว",
    "ทะเล",
    "ภูเขา",
    "คลอง",
    "เกาะ",
    "ป่า",
    "ไผ่",
    "บัว",
    "ตะกร้า",
    "จาน",
    "ชาม",
    "ถ้วย",
    "หม้อ",
    "ช้อน",
    "โต๊ะ",
    "ตู้",
    "เทียน",
    "เข็ม",
    "ด้าย",
    "กลอง",
    "ว่าว",
    "ภาพ",
    "สี",
    "ขวด",
    "กล่อง",
    "ถาด",
    "พรม",
    "อิฐ",
    "ทราย",
    "รั้ว",
    "ลาน",
    "ทุ่ง",
    "นา",
    "บึง",
    "หมอก",
    "ราก",
    "กิ่ง",
    "ถั่ว",
    "ชา",
    "กาแฟ",
    "นม",
    "เต้าหู้",
    "ใบเตย",
    "มด",
    "เต่า",
    "ไก่",
    "เป็ด",
    "กุ้ง",
    "ปู",
    "หอย",
    "ไข่",
    "ครก",
    "เข่ง",
    "เตา",
    "ป้าย",
    "มุก",
    "หยก",
    "พลอย",
    "หวาย",
  ],
  vietnamese: [
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
  ],
  hindi: [
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
    "लाल",
    "नीला",
    "हरा",
    "पीला",
    "सफेद",
    "काला",
    "गुलाबी",
    "सुनहरा",
    "रूपहला",
  ],
  arabic: [
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
    "أبيض",
    "أزرق",
    "أخضر",
    "أحمر",
    "أصفر",
    "فضي",
    "ذهبي",
    "وردي",
    "صافي",
    "لامع",
    "جميل",
  ],
};

const LANGUAGE_LABELS = {
  english: "English",
  korean: "Korean",
  chinese: "Chinese",
  japanese: "Japanese",
  spanish: "Spanish",
  french: "French",
  german: "German",
  portuguese: "Portuguese",
  indonesian: "Indonesian",
  thai: "Thai",
  vietnamese: "Vietnamese",
  hindi: "Hindi",
  arabic: "Arabic",
};

const TYPE_LABELS = {
  recognizedCompound: "recognized compound",
  shortStandalone: "short standalone",
  otherStandalone: "other standalone or unclassified",
};

const readCodebook = (language) =>
  JSON.parse(
    readFileSync(new URL(CODEBOOK_FILES[language], import.meta.url), "utf8"),
  );

const characterLength = (word) => [...word].length;

const isShortStandalone = (language, word) => {
  const length = characterLength(word);

  if (
    language === "english" ||
    language === "spanish" ||
    language === "french" ||
    language === "german" ||
    language === "portuguese" ||
    language === "indonesian" ||
    language === "vietnamese" ||
    language === "hindi" ||
    language === "arabic"
  ) {
    return length <= 4;
  }

  if (language === "thai" || language === "hindi") {
    return length <= 3;
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

  if (
    language === "spanish" ||
    language === "french" ||
    language === "german" ||
    language === "portuguese" ||
    language === "indonesian" ||
    language === "vietnamese" ||
    language === "hindi" ||
    language === "arabic"
  ) {
    return 4;
  }

  if (language === "thai") {
    return 1;
  }

  return 3;
};

const normalizeForSuffix = (language, word) => {
  if (
    language === "english" ||
    language === "spanish" ||
    language === "french" ||
    language === "german" ||
    language === "portuguese" ||
    language === "indonesian" ||
    language === "vietnamese"
  ) {
    return word.toLowerCase();
  }

  return word;
};

const findCompoundSuffix = (language, word) => {
  if (language === "spanish" && SPANISH_REVIEWED_STANDALONE_WORDS.has(word)) {
    return undefined;
  }
  if (
    language === "indonesian" &&
    INDONESIAN_REVIEWED_STANDALONE_WORDS.has(word)
  ) {
    return undefined;
  }
  if (language === "german" && GERMAN_REVIEWED_STANDALONE_WORDS.has(word)) {
    return undefined;
  }
  if (language === "french" && FRENCH_REVIEWED_STANDALONE_WORDS.has(word)) {
    return undefined;
  }
  if (
    language === "portuguese" &&
    PORTUGUESE_REVIEWED_STANDALONE_WORDS.has(word)
  ) {
    return undefined;
  }

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

const formatPercent = (count, total) =>
  `${((count / total) * 100).toFixed(1)}%`;

const formatExamples = (examples) => examples.join(", ");

if (import.meta.url === `file://${process.argv[1]}`) {
  const rows = buildTypeInventory();

  console.log("| Language | Type | Count | Share | Examples |");
  console.log("| --- | --- | ---: | ---: | --- |");

  for (const row of rows) {
    for (const key of [
      "recognizedCompound",
      "shortStandalone",
      "otherStandalone",
    ]) {
      console.log(
        `| ${row.label} | ${TYPE_LABELS[key]} | ${row.counts[key]} | ${formatPercent(
          row.counts[key],
          row.total,
        )} | ${formatExamples(row.examples[key])} |`,
      );
    }
  }
}
