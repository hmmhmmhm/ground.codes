export const GERMAN_BLOCKED_TERMS = [
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
];

export const GERMAN_TEMPLATE_COMPOUND_PATTERN =
  /^[A-Z][a-z]{3,}(?:band|bank|becher|beet|beutel|blatt|blech|brett|bund|dose|eimer|faden|fass|feld|fliese|gabel|glas|griff|haken|hut|kachel|kanne|karton|kasten|kelle|kerze|kiste|klotz|knopf|korb|kranz|kreide|krug|lampe|leiste|mappe|matte|messer|nadel|papier|perle|pfanne|pfeife|pinsel|platte|polster|rahmen|riegel|ring|rohr|sack|schale|seil|sieb|sohle|spange|spatel|spiegel|spule|steg|stein|stift|tafel|tasche|tasse|tisch|topf|truhe|vlies|wagen)$/u;
export const GERMAN_COMPOUND_SATURATION_LIMIT = 3500;
export const GERMAN_AWKWARD_COMPOUNDS = new Set([
  "Ackerfass",
  "Ackerglas",
  "Ackerhut",
  "Ackerring",
  "Ackerseil",
  "Ackerwagen",
  "Apfelpfeife",
  "Apfelsohle",
  "Blattblatt",
  "Feldfeld",
  "Grasvlies",
  "Papierpapier",
  "Roggenpfeife",
  "Steinstein",
]);
export const GERMAN_AWKWARD_COMPOUND_PATTERN =
  /^(?:Acker|Bach|Feld|Garten|Gras)(?:dose|fass|glas|hut|ring|seil|vlies|wagen)$|^(?:Apfel|Birne|Beere|Bohne|Erbse|Feige|Kuerbis|Mandel|Nuss|Olive|Reis|Roggen|Weizen)(?:pfeife|riegel|sohle|spange|spule|vlies)$|^(?:Ahorn|Birken|Buchen|Eichen|Fichten|Tannen|Ulmen|Weiden|Zedern)(?:becher|dose|fass|glas|topf)$/u;

export const isAwkwardGermanCompound = (word) => {
  if (GERMAN_AWKWARD_COMPOUNDS.has(word)) return true;
  if (GERMAN_AWKWARD_COMPOUND_PATTERN.test(word)) return true;

  const lower = word.toLowerCase();
  if (lower.length % 2 !== 0) return false;
  const half = lower.slice(0, lower.length / 2);
  return half.length >= 4 && lower === `${half}${half}`;
};

export const PORTUGUESE_BLOCKED_TERMS = [
  "Acucarbanco",
  "Acucarfolha",
  "Aguabanco",
  "Aguafolha",
  "Almendra",
  "Arvorebranco",
  "Avelan",
  "Aposta",
  "Arma",
  "Basilio",
  "Betula",
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
  "Roble",
  "Saber",
  "Sexo",
  "Violencia",
  "Yute",
];

export const PORTUGUESE_TEMPLATE_COMPOUND_PATTERN =
  /^[A-Z][a-z]{3,}(?:anel|banco|bandeja|bastao|bau|bolsa|botao|brocha|caixa|cesta|cesto|chave|copo|corda|cuba|cuia|escova|esteira|fita|folha|frasco|gancho|jarra|lata|livro|lona|luz|mapa|marco|mesa|pano|pote|prato|rede|saco|selo|suporte|tabua|tampa|tela|tigela|vaso|vela)$/u;
export const PORTUGUESE_COMPOUND_SATURATION_LIMIT = 3500;

export const PORTUGUESE_AWKWARD_COMPOUND_PATTERN =
  /^(?:Acucar|Agua|Areia|Barro|Lama|Rio|Riacho)(?:banco|fita|folha|lona|livro|mesa|pano|selo)$|^(?:Arvore|Folha|Luz)branco$/u;

export const isAwkwardPortugueseCompound = (word) => {
  if (PORTUGUESE_AWKWARD_COMPOUND_PATTERN.test(word)) return true;

  const lower = word.toLowerCase();
  if (lower.length % 2 !== 0) return false;
  const half = lower.slice(0, lower.length / 2);
  return half.length >= 4 && lower === `${half}${half}`;
};

export const INDONESIAN_BLOCKED_TERMS = [
  "Benci",
  "Bohong",
  "Halia",
  "Jahat",
  "Judi",
  "Kalah",
  "Korupsi",
  "Mabuk",
  "Mati",
  "Narkoba",
  "Papaya",
  "Politik",
  "Racun",
  "Sakit",
  "Salah",
  "Senjata",
  "Seks",
  "Utang",
];

export const INDONESIAN_AWKWARD_COMPOUND_PATTERN =
  /^(?:Laut|Ombak|Garam|Gula)(?:kaca|kain|kertas|meja|panci|piring|saku|topi)$/u;

export const INDONESIAN_AWKWARD_ADJECTIVE_PREFIXES = [
  "Akar",
  "Alam",
  "Angin",
  "Awan",
  "Bambu",
  "Bayam",
  "Beras",
  "Cabai",
  "Cawan",
  "Emas",
  "Garam",
  "Gelas",
  "Gula",
  "Hutan",
  "Karet",
  "Kerang",
  "Kertas",
  "Lantai",
  "Laut",
  "Lidi",
  "Merica",
  "Ombak",
  "Panci",
  "Papan",
  "Pati",
  "Perak",
  "Pot",
  "Rotan",
  "Sagu",
  "Sikat",
  "Topi",
  "Wadah",
];

export const INDONESIAN_AWKWARD_ADJECTIVE_SUFFIXES = [
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
];

export const INDONESIAN_AWKWARD_OBJECT_PREFIXES = [
  "Akar",
  "Alam",
  "Angin",
  "Awan",
  "Bambu",
  "Cabai",
  "Garam",
  "Gelas",
  "Gula",
  "Kaca",
  "Kain",
  "Kapas",
  "Kapur",
  "Karet",
  "Kayu",
  "Kelapa",
  "Laut",
  "Ombak",
  "Pita",
  "Sikat",
  "Wadah",
  "Warna",
  "Zaitun",
];

export const INDONESIAN_AWKWARD_OBJECT_SUFFIXES = [
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
  "kaleng",
  "kaca",
  "kain",
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
];

export const INDONESIAN_AWKWARD_UNIVERSAL_OBJECT_SUFFIXES = [
  "benda",
  "bilik",
  "cawan",
  "dulang",
  "guci",
];

export const INDONESIAN_ALLOWED_SELF_REPEATING_WORDS = new Set(["Cincin"]);

export const hasGeneratedPair = (word, prefixes, suffixes) =>
  prefixes.some((prefix) =>
    suffixes.some((suffix) => word === `${prefix}${suffix}`),
  );

export const hasGeneratedSuffix = (word, suffixes) =>
  suffixes.some(
    (suffix) =>
      word.endsWith(suffix) && word.length >= suffix.length + "Akar".length,
  );

export const isAwkwardIndonesianCompound = (word) => {
  if (INDONESIAN_AWKWARD_COMPOUND_PATTERN.test(word)) return true;
  if (
    hasGeneratedPair(
      word,
      INDONESIAN_AWKWARD_ADJECTIVE_PREFIXES,
      INDONESIAN_AWKWARD_ADJECTIVE_SUFFIXES,
    )
  ) {
    return true;
  }
  if (
    hasGeneratedPair(
      word,
      INDONESIAN_AWKWARD_OBJECT_PREFIXES,
      INDONESIAN_AWKWARD_OBJECT_SUFFIXES,
    )
  ) {
    return true;
  }
  if (hasGeneratedSuffix(word, INDONESIAN_AWKWARD_UNIVERSAL_OBJECT_SUFFIXES)) {
    return true;
  }

  const lower = word.toLowerCase();
  if (lower.length % 2 !== 0) return false;
  if (INDONESIAN_ALLOWED_SELF_REPEATING_WORDS.has(word)) return false;
  const half = lower.slice(0, lower.length / 2);
  return half.length >= 3 && lower === `${half}${half}`;
};
