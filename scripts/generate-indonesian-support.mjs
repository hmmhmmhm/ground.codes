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

const reviewedStandaloneFiles = [
  "packages/codebook/codebook-dataset/indonesian/standalone-review-2026-05-22.md",
];

const readReviewedStandaloneWords = () => {
  const words = [];

  for (const file of reviewedStandaloneFiles) {
    const text = readFileSync(new URL(file, root), "utf8");
    for (const match of text.matchAll(/`([A-Z][a-z]+)`/g)) {
      words.push(match[1]);
    }
  }

  return words;
};

const standaloneWords = [
  "Akar",
  "Alam",
  "Angin",
  "Awan",
  "Bakul",
  "Bambu",
  "Batu",
  "Bayam",
  "Beras",
  "Biji",
  "Bintang",
  "Bunga",
  "Bukit",
  "Bulan",
  "Bumi",
  "Cabai",
  "Cawan",
  "Cempaka",
  "Cendana",
  "Cengkeh",
  "Ceri",
  "Damar",
  "Daun",
  "Dapur",
  "Delima",
  "Duku",
  "Embun",
  "Emas",
  "Enau",
  "Gaharu",
  "Gambir",
  "Garam",
  "Gelas",
  "Genta",
  "Gerabah",
  "Gula",
  "Gunung",
  "Hutan",
  "Intan",
  "Jagung",
  "Jahe",
  "Jambu",
  "Jarum",
  "Jati",
  "Jerami",
  "Jeruk",
  "Kaca",
  "Kakao",
  "Kain",
  "Kaleng",
  "Kapas",
  "Kapur",
  "Karet",
  "Kayu",
  "Kedelai",
  "Kelapa",
  "Kemiri",
  "Kendi",
  "Kenanga",
  "Kentang",
  "Kerang",
  "Kerikil",
  "Kertas",
  "Ketela",
  "Ketumbar",
  "Kipas",
  "Kismis",
  "Kopi",
  "Kubis",
  "Kunci",
  "Kunyit",
  "Labu",
  "Ladang",
  "Lada",
  "Langit",
  "Lantai",
  "Laut",
  "Layar",
  "Lemari",
  "Lempung",
  "Lensa",
  "Lidi",
  "Limas",
  "Linen",
  "Lontar",
  "Lumut",
  "Madu",
  "Mangga",
  "Manggis",
  "Mawar",
  "Melati",
  "Melon",
  "Menara",
  "Merica",
  "Mutiara",
  "Nanas",
  "Nila",
  "Nira",
  "Nyiru",
  "Ombak",
  "Padi",
  "Pagar",
  "Pala",
  "Palem",
  "Panci",
  "Papan",
  "Pasir",
  "Pati",
  "Payung",
  "Pelita",
  "Pepaya",
  "Perak",
  "Piring",
  "Pisang",
  "Pita",
  "Pot",
  "Rakit",
  "Rami",
  "Ranting",
  "Rebung",
  "Rotan",
  "Rumah",
  "Rumput",
  "Sagu",
  "Sawo",
  "Selasih",
  "Selimut",
  "Semangka",
  "Serai",
  "Serat",
  "Sikat",
  "Sirsak",
  "Sutra",
  "Tali",
  "Taman",
  "Tebu",
  "Telaga",
  "Telur",
  "Tembaga",
  "Teratai",
  "Timah",
  "Tomat",
  "Topi",
  "Ubi",
  "Ulin",
  "Vanili",
  "Wadah",
  "Wajan",
  "Wangi",
  "Warna",
  "Zaitun",
];

const additionalStandaloneWords = [
  "Air",
  "Api",
  "Arang",
  "Atap",
  "Ayam",
  "Baju",
  "Balai",
  "Balok",
  "Bangku",
  "Bantal",
  "Baskom",
  "Belanga",
  "Belimbing",
  "Benang",
  "Benteng",
  "Beranda",
  "Besi",
  "Biskuit",
  "Bola",
  "Botol",
  "Buah",
  "Buku",
  "Bumbu",
  "Cabang",
  "Cangkir",
  "Cangkul",
  "Cermin",
  "Cokelat",
  "Cuka",
  "Daging",
  "Dahan",
  "Danau",
  "Dinding",
  "Dompet",
  "Durian",
  "Gading",
  "Gang",
  "Garpu",
  "Gasing",
  "Gubuk",
  "Gudang",
  "Gulali",
  "Halaman",
  "Hujan",
  "Ikan",
  "Jalan",
  "Jamur",
  "Jangkar",
  "Jarak",
  "Jendela",
  "Jembatan",
  "Kacang",
  "Kamar",
  "Kampung",
  "Kanopi",
  "Kantong",
  "Karpet",
  "Kasur",
  "Kebun",
  "Kecambah",
  "Kecapi",
  "Keju",
  "Kembang",
  "Kemoceng",
  "Kepiting",
  "Keranjang",
  "Kereta",
  "Ketupat",
  "Kolam",
  "Kompor",
  "Korek",
  "Kursi",
  "Lampion",
  "Lembah",
  "Lengkuas",
  "Lesung",
  "Lonceng",
  "Lorong",
  "Mahkota",
  "Mangkuk",
  "Manik",
  "Mentimun",
  "Minyak",
  "Nampan",
  "Nangka",
  "Nasi",
  "Obor",
  "Paku",
  "Pakis",
  "Palu",
  "Pantai",
  "Parut",
  "Pelangi",
  "Pematang",
  "Pena",
  "Penggaris",
  "Peniti",
  "Perahu",
  "Perigi",
  "Pintu",
  "Pohon",
  "Pucuk",
  "Puding",
  "Ranjang",
  "Roda",
  "Roti",
  "Rumbai",
  "Sabun",
  "Sapu",
  "Sarung",
  "Sawah",
  "Sendok",
  "Sepatu",
  "Seruling",
  "Sirop",
  "Suling",
  "Sumur",
  "Sungai",
  "Tampah",
  "Tanah",
  "Teko",
  "Tepung",
  "Teras",
  "Tikar",
  "Timba",
  "Tombol",
  "Tunas",
  "Udang",
  "Vas",
  "Wayang",
  "Wortel",
  "Abu",
  "Adonan",
  "Anyaman",
  "Asam",
  "Balon",
  "Becak",
  "Bengkel",
  "Biola",
  "Brokoli",
  "Bubur",
  "Bungkus",
  "Cahaya",
  "Canting",
  "Cemara",
  "Centong",
  "Cermai",
  "Cerek",
  "Cincin",
  "Cobek",
  "Dadih",
  "Dedak",
  "Dempul",
  "Dendeng",
  "Dipan",
  "Dodol",
  "Dusun",
  "Emping",
  "Gabus",
  "Gagang",
  "Gambas",
  "Gamelan",
  "Gantungan",
  "Gayung",
  "Gembok",
  "Genteng",
  "Gergaji",
  "Gerobak",
  "Getah",
  "Gorden",
  "Handuk",
  "Ijuk",
  "Ilalang",
  "Jala",
  "Jalinan",
  "Jemuran",
  "Jepit",
  "Jerigen",
  "Kapuk",
  "Karung",
  "Katrol",
  "Kawah",
  "Kebaya",
  "Kecap",
  "Kedai",
  "Kedondong",
  "Kompas",
  "Konde",
  "Koral",
  "Kran",
  "Kuali",
  "Kue",
  "Kukusan",
  "Kumparan",
  "Kuncup",
  "Laguna",
  "Lalang",
  "Layang",
  "Leci",
  "Lemang",
  "Lengkung",
  "Lentera",
  "Lilin",
  "Lobak",
  "Logam",
  "Lumbung",
  "Lumpang",
  "Mahoni",
  "Marmer",
  "Melinjo",
  "Meranti",
  "Merbau",
  "Mesin",
  "Nusa",
  "Pahat",
  "Pandan",
  "Panggung",
  "Paprika",
  "Pasak",
  "Patung",
  "Pecahan",
  "Pelepah",
  "Penjepit",
  "Perada",
  "Perunggu",
  "Pinang",
  "Pinggan",
  "Pondok",
  "Prasasti",
  "Pualam",
  "Rajutan",
  "Rantang",
  "Rebana",
  "Relung",
  "Rempah",
  "Renda",
  "Rengginang",
  "Rujak",
  "Sabut",
  "Sadel",
  "Sambal",
  "Sampan",
  "Sangkar",
  "Santan",
  "Saringan",
  "Selendang",
  "Semai",
  "Sepeda",
  "Serambi",
  "Serbuk",
  "Serokan",
  "Seruas",
  "Setang",
  "Sisir",
  "Sodet",
  "Sofa",
  "Soka",
  "Sumbu",
  "Talang",
  "Tambak",
  "Tambang",
  "Tandan",
  "Tangguk",
  "Tangkai",
  "Tanjung",
  "Terasi",
  "Timbangan",
  "Toples",
  "Tudung",
  "Tugu",
  "Ukiran",
  "Umbi",
  "Undakan",
  "Unggun",
  "Usuk",
  "Waru",
  "Wedang",
  "Wijen",
  "Yoyo",
  "Zamrud",
];

const prefixes = [
  "Akar",
  "Alam",
  "Angin",
  "Awan",
  "Bambu",
  "Batu",
  "Bayam",
  "Beras",
  "Biji",
  "Bunga",
  "Bukit",
  "Bulan",
  "Bumi",
  "Cabai",
  "Cawan",
  "Daun",
  "Damar",
  "Embun",
  "Emas",
  "Garam",
  "Gelas",
  "Gula",
  "Hutan",
  "Intan",
  "Jagung",
  "Jambu",
  "Jarum",
  "Jati",
  "Jeruk",
  "Kaca",
  "Kain",
  "Kapas",
  "Kapur",
  "Karet",
  "Kayu",
  "Kelapa",
  "Kendi",
  "Kerang",
  "Kertas",
  "Kipas",
  "Kopi",
  "Kunci",
  "Labu",
  "Lada",
  "Langit",
  "Lantai",
  "Laut",
  "Layar",
  "Lensa",
  "Lidi",
  "Linen",
  "Lontar",
  "Lumut",
  "Madu",
  "Mangga",
  "Mawar",
  "Melati",
  "Melon",
  "Merica",
  "Nanas",
  "Nila",
  "Ombak",
  "Padi",
  "Pagar",
  "Pala",
  "Palem",
  "Panci",
  "Papan",
  "Pasir",
  "Pati",
  "Payung",
  "Pelita",
  "Perak",
  "Pisang",
  "Pita",
  "Pot",
  "Rakit",
  "Rami",
  "Rotan",
  "Rumah",
  "Rumput",
  "Sagu",
  "Sawo",
  "Serai",
  "Serat",
  "Sikat",
  "Sutra",
  "Tali",
  "Taman",
  "Tebu",
  "Telaga",
  "Telur",
  "Timah",
  "Tomat",
  "Topi",
  "Ubi",
  "Ulin",
  "Wadah",
  "Wajan",
  "Warna",
  "Zaitun",
];

const naturalCompoundSuffixes = [
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
];

const suffixes = [
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
];

const blockedCodebookWords = new Set([
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
]);

const awkwardAdjectivePrefixes = [
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

const awkwardAdjectiveSuffixes = [
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

const awkwardObjectPrefixes = [
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

const awkwardObjectSuffixes = [
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

const awkwardUniversalObjectSuffixes = [
  "benda",
  "bilik",
  "cawan",
  "dulang",
  "guci",
];

const allowedSelfRepeatingWords = new Set(["Cincin"]);

const hasGeneratedPair = (word, prefixes, suffixes) =>
  prefixes.some((prefix) =>
    suffixes.some((suffix) => word === `${prefix}${suffix}`),
  );

const isAwkwardIndonesianCompound = (word) => {
  const lower = word.toLowerCase();
  if (lower.length % 2 === 0) {
    const half = lower.slice(0, lower.length / 2);
    if (
      half.length >= 3 &&
      lower === `${half}${half}` &&
      !allowedSelfRepeatingWords.has(word)
    ) {
      return true;
    }
  }

  return (
    /^(?:Laut|Ombak|Garam|Gula)(?:kaca|kain|kertas|meja|panci|piring|saku|topi)$/u.test(
      word,
    ) ||
    hasGeneratedPair(
      word,
      awkwardAdjectivePrefixes,
      awkwardAdjectiveSuffixes,
    ) ||
    hasGeneratedPair(word, awkwardObjectPrefixes, awkwardObjectSuffixes) ||
    hasGeneratedPair(word, prefixes, awkwardUniversalObjectSuffixes)
  );
};

const buildIndonesianCodebook = () => {
  const words = [];
  const seen = new Set();

  const add = (word) => {
    const candidate = titleWord(word);
    if (!candidate) return;
    if (!/^[A-Z][a-z]+$/.test(candidate)) return;
    if (candidate.length > 12) return;
    if (blockedCodebookWords.has(candidate)) return;
    if (isAwkwardIndonesianCompound(candidate)) return;
    if (seen.has(candidate)) return;
    seen.add(candidate);
    words.push(candidate);
  };

  for (const word of standaloneWords) add(word);
  for (const word of additionalStandaloneWords) add(word);
  for (const word of readReviewedStandaloneWords()) add(word);

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
    throw new Error(`Indonesian codebook generated ${words.length} words`);
  }

  return words.slice(0, 5000);
};

const earthNameOverridesByCode = new Map(
  Object.entries({
    1642911: "Jakarta",
    1625822: "Surabaya",
    1214520: "Medan",
    1650357: "Bandung",
    1636722: "Malang",
    1645528: "Denpasar",
    1735161: "Kuala Lumpur",
    1880252: "Singapura",
  }),
);

const translateEarthRegionName = (row) => {
  if (earthNameOverridesByCode.has(String(row.code))) {
    return earthNameOverridesByCode.get(String(row.code));
  }
  return normalizeAscii(row.name);
};

const marineTerms = new Map([
  ["Sea", "Laut"],
  ["Ocean", "Samudra"],
  ["Bay", "Teluk"],
  ["Gulf", "Teluk"],
  ["Channel", "Selat"],
  ["Strait", "Selat"],
  ["Sound", "Selat"],
  ["Basin", "Cekungan"],
  ["Ridge", "Punggung"],
  ["Plateau", "Dataran"],
  ["Rise", "Tinggian"],
  ["Trench", "Palung"],
  ["Bank", "Gosong"],
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
    return "Antarktika";
  }

  if (row.source === "natural-earth-marine") {
    const marineGridMatch = name.match(
      /^(.+) (Sea|Ocean|Bay|Gulf|Channel|Strait|Sound|Basin|Ridge|Plateau|Rise|Trench|Bank) (\d+)$/,
    );
    if (marineGridMatch) {
      const [, base, term, index] = marineGridMatch;
      return limitRegion3Name(
        normalizeAscii(`${marineTerms.get(term) ?? term} ${base} ${index}`),
      );
    }

    for (const [english, indonesian] of marineTerms) {
      name = name.replace(new RegExp(`^${english} `), `${indonesian} `);
      name = name.replace(new RegExp(` ${english} `), ` ${indonesian} `);
      name = name.replace(
        new RegExp(` ${english}( \\d+)$`),
        ` ${indonesian}$1`,
      );
    }
  }

  name = name
    .replace(/^Antarctic /, "Antarktika ")
    .replace(/^Arctic /, "Arktik ")
    .replace(/^Sahara /, "Sahara ")
    .replace(/^Greenland /, "Greenland ")
    .replace(/^Desert /, "Gurun ")
    .replace(/^Forest /, "Hutan ")
    .replace(/^Island /, "Pulau ")
    .replace(/^Lake /, "Danau ")
    .replace(/^Mount /, "Gunung ")
    .replace(/^River /, "Sungai ")
    .replace(/^Valley /, "Lembah ");

  return limitRegion3Name(normalizeAscii(name));
};

const planetaryPhraseOverrides = new Map([
  ["Mare Tranquillitatis", "Laut Ketenangan"],
  ["Mare Serenitatis", "Laut Serenitas"],
  ["Mare Imbrium", "Laut Hujan"],
  ["Mare Crisium", "Laut Krisis"],
  ["Mare Nectaris", "Laut Nektar"],
  ["Mare Nubium", "Laut Awan"],
  ["Mare Humorum", "Laut Kelembapan"],
  ["Mare Frigoris", "Laut Dingin"],
  ["Mare Orientale", "Laut Timur"],
  ["Mare Australe", "Laut Selatan"],
  ["Oceanus Procellarum", "Samudra Badai"],
  ["Sinus Iridum", "Teluk Pelangi"],
  ["Lacus Somniorum", "Danau Mimpi"],
  ["Olympus Mons", "Gunung Olympus"],
  ["Elysium Mons", "Gunung Elysium"],
  ["Ascraeus Mons", "Gunung Ascraeus"],
  ["Arsia Mons", "Gunung Arsia"],
  ["Pavonis Mons", "Gunung Pavonis"],
  ["Valles Marineris", "Lembah Marineris"],
  ["Hellas Planitia", "Dataran Hellas"],
  ["Utopia Planitia", "Dataran Utopia"],
  ["Amazonis Planitia", "Dataran Amazonis"],
  ["Isidis Planitia", "Dataran Isidis"],
  ["Argyre Planitia", "Dataran Argyre"],
  ["Borealis Planitia", "Dataran Borealis"],
]);

const planetaryTerms = [
  [/^Mare /, "Laut "],
  [/^Maria /, "Laut "],
  [/^Oceanus /, "Samudra "],
  [/^Sinus /, "Teluk "],
  [/^Lacus /, "Danau "],
  [/^Palus /, "Rawa "],
  [/^Mons /, "Gunung "],
  [/^Montes /, "Pegunungan "],
  [/^Vallis /, "Lembah "],
  [/^Valles /, "Lembah "],
  [/^Rima /, "Alur "],
  [/^Rimae /, "Alur "],
  [/^Rupes /, "Tebing "],
  [/^Dorsum /, "Punggung "],
  [/^Dorsa /, "Punggung "],
  [/^Planitia /, "Dataran "],
  [/^Planum /, "Dataran "],
  [/^Terra /, "Tanah "],
  [/^Chaos /, "Kekacauan "],
  [/^Chasma /, "Jurang "],
  [/^Chasmata /, "Jurang "],
  [/^Vastitas /, "Hamparan "],
  [/^Cavus /, "Cekung "],
  [/^Cavi /, "Cekung "],
  [/^Fossa /, "Parit "],
  [/^Fossae /, "Parit "],
  [/^Labes /, "Longsor "],
  [/^Lingula /, "Lidah "],
  [/^Mensae /, "Mesa "],
  [/^Mensa /, "Mesa "],
  [/^Patera /, "Patera "],
  [/^Scopulus /, "Tebing "],
  [/^Scopuli /, "Tebing "],
  [/^Sulcus /, "Alur "],
  [/^Sulci /, "Alur "],
  [/^Tholus /, "Kubah "],
  [/^Tholi /, "Kubah "],
  [/^Undae /, "Bukit Pasir "],
  [/^Vicus /, "Dusun "],
  [/ Crater( \d+)?$/, " Kawah$1"],
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
  translated = translated.replace(/^([A-Za-z]+) Kawah( \d+)?$/, "Kawah $1$2");
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
  "packages/codebook/codebook-dist/indonesian.json",
  buildIndonesianCodebook(),
);

if (mode === "all") {
  buildLocalizedRows(
    "packages/geoint/region-dist/region-2.json",
    "packages/geoint/region-dist/region-2-indonesian.json",
    translateEarthRegionName,
  );
  buildLocalizedRows(
    "packages/geoint/region-dist/region-3.json",
    "packages/geoint/region-dist/region-3-indonesian.json",
    translateRegion3Name,
  );
  avoidNamedGapLookupCollisions(
    "packages/geoint/region-dist/region-3-indonesian.json",
    [
      "packages/geoint/region-dist/region-1.json",
      "packages/geoint/region-dist/region-2-indonesian.json",
    ],
  );
  buildLocalizedRows(
    "packages/geoint/region-dist/region-2-moon.json",
    "packages/geoint/region-dist/region-2-moon-indonesian.json",
    (row) => translatePlanetaryName(row.name),
  );
  buildLocalizedRows(
    "packages/geoint/region-dist/region-2-mars.json",
    "packages/geoint/region-dist/region-2-mars-indonesian.json",
    (row) => translatePlanetaryName(row.name),
  );
  buildLocalizedRows(
    "packages/geoint/region-dist/region-3-mars.json",
    "packages/geoint/region-dist/region-3-mars-indonesian.json",
    (row) => translatePlanetaryName(row.name),
  );

  for (const regionName of [
    "region-2-indonesian",
    "region-3-indonesian",
    "region-2-moon-indonesian",
    "region-2-mars-indonesian",
    "region-3-mars-indonesian",
  ]) {
    await buildEmbeddedRegionDb(regionName);
  }
}
