import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, test } from "node:test";

const languages = [
  "swahili",
  "filipino",
  "hausa",
  "bengali",
  "urdu",
  "amharic",
  "burmese",
  "khmer",
  "nepali",
  "somali",
  "pashto",
  "lingala",
  "mongolian",
  "lao",
  "malagasy",
  "dari",
  "oromo",
  "chichewa",
  "tigrinya",
  "bambara",
  "fula",
  "wolof",
  "sinhala",
  "tamil",
  "kinyarwanda",
  "kirundi",
  "krio",
  "ewe",
  "fon",
  "sango",
  "moore",
  "kanuri",
  "quechua",
  "aymara",
  "guarani",
  "kongo",
  "zarma",
  "tamasheq",
  "songhay",
  "twi",
  "dagbani",
  "luganda",
  "acholi",
  "dinka",
  "nuer",
  "shona",
  "ndebele",
  "tok_pisin",
];

const readCodebook = (language) =>
  JSON.parse(
    readFileSync(
      new URL(
        `../packages/codebook/codebook-dist/${language}.json`,
        import.meta.url,
      ),
      "utf8",
    ),
  );

const lexicalizedFusions = {
  amharic: new Set(["ዳቦቤት"]),
  burmese: new Set(["စေိကကအန", "မိုးတိမ်"]),
  khmer: new Set(["ឆ្នេរសមុទ្រ", "ហាងនំប៉័ង", "ហាងកាហ្វេ", "ឡានក្រុង"]),
};

const frontLoadedExpectedWords = {
  mongolian: ["Хаалга", "Цонх", "Найз", "Сургууль", "Сэтгүүл"],
  lao: ["ປະຕູ", "ປ່ອງຢ້ຽມ", "ເພື່ອນ", "ໂຮງຮຽນ", "ວາລະສານ"],
  burmese: ["ရေ", "အိမ်", "စာအုပ်", "တံခါး", "ပြတင်းပေါက်"],
  khmer: ["ទឹក", "ផ្ទះ", "សៀវភៅ", "ទ្វារ", "បង្អួច"],
  malagasy: ["Varavarana", "Namana", "Ankizy", "Sekoly", "Gazety"],
  dari: ["دروازه", "پنجره", "دوست", "مکتب", "روزنامه"],
  pashto: ["اوبه", "کور", "کتاب", "دروازه", "کړکۍ"],
  oromo: ["Balbala", "Foddaa", "Hiriyyaa", "Manabarumsaa", "Gaazexaa"],
  chichewa: ["Khomo", "Zenera", "Bwenzi", "Sukulu", "Magazini"],
  tigrinya: ["ደገ", "መስኮት", "ዓርኪ", "ቤትትምህርቲ", "መጽሔት"],
  bambara: ["Tabali", "Sigilan", "Terike", "Kalan", "Gazeti"],
  fula: ["Dammugal", "Henorde", "Gido", "Lekkol", "Jaarol"],
  wolof: ["Bunt", "Palanteer", "Xarit", "Daara", "Surnal"],
  sinhala: ["දොර", "ජනේලය", "මිතුරා", "පාසල", "සඟරාව"],
  tamil: ["கதவு", "சாளரம்", "நண்பர்", "பள்ளி", "இதழ்"],
  kinyarwanda: ["Urugi", "Idirishya", "Ishuri", "Ibitaro", "Uruzitiro"],
  kirundi: ["Urugi", "Idirisha", "Ishure", "Ibitaro", "Uruzitiro"],
  krio: ["Doa", "Windo", "Skul", "Ospitul", "Steshon"],
  ewe: ["Agbo", "Safui", "Sukuu", "Dowofe", "Atikpo"],
  fon: ["Xota", "Safa", "Sukulu", "Dokita", "Atin"],
  sango: ["Bango", "Tabulu", "Ecole", "Hopital", "Lopango"],
  moore: ["Daare", "Taabala", "Karensa", "Oteli", "Weoogo"],
  kanuri: ["Kofa", "Tagar", "Makaranta", "Asibiti", "Katanga"],
  quechua: ["Punku", "Qhawana", "Yachaywasi", "Hampinawasi", "Kancha"],
  aymara: ["Punku", "Tiji", "Yatiqana", "Qullanauta", "Uywana"],
  guarani: ["Oke", "Oveta", "Mboehao", "Tasyo", "Kora"],
  kongo: ["Kielo", "Luketo", "Kalasi", "Lupitalu", "Lupangu"],
  zarma: ["Mey", "Feneti", "Lekkol", "Fajikay", "Koyra"],
  tamasheq: ["Taggurt", "Taqmirt", "Agharbaz", "Asbitar", "Tenere"],
  songhay: ["Mey", "Feneti", "Lekkol", "Fajikay", "Koyra"],
  twi: ["Pon", "Mfensere", "Sukuu", "Ayaresabea", "Kwae"],
  dagbani: ["Dua", "Maje", "Sakuli", "Asibiti", "Tinga"],
  luganda: ["Oluggi", "Eddirisa", "Essomero", "Eddwaliro", "Ekibira"],
  acholi: ["Doggola", "Dirica", "Gangkwan", "Ospital", "Lutino"],
  dinka: ["Adoor", "Thual", "Panakim", "Wut", "Meth"],
  nuer: ["Dhor", "Thok", "Pankim", "Cieng", "Gat"],
  shona: ["Gonhi", "Hwindo", "Chikoro", "Chipatara", "Sango"],
  ndebele: ["Umnyango", "Iwindi", "Isikolo", "Isibhedlela", "Ihlathi"],
  tok_pisin: ["Doa", "Windua", "Skul", "Haussik", "Pikinini"],
  afrikaans: ["Watertjie", "Huis", "Rivier", "Skool", "Venster"],
  albanian: ["Uje", "Shtepi", "Lume", "Shkolle", "Dritare"],
  basque: ["Ura", "Etxea", "Ibaia", "Eskola", "Leihoa"],
  catalan: ["Aigua", "Casa", "Riu", "Escola", "Finestra"],
  croatian: ["Voda", "Kuca", "Rijeka", "Skola", "Prozor"],
  finnish: ["Vesi", "Talo", "Joki", "Koulu", "Ikkuna"],
  malay: ["AirSungai", "Rumah", "Sungai", "Sekolah", "Tingkap"],
  hebrew: ["מים", "בית", "נהר", "ביתספר", "חלון"],
  bosnian: ["Voda", "Kuca", "Rijeka", "Skola", "Prozor"],
  estonian: ["Vesi", "Maja", "Jogi", "Kool", "Aken"],
  galician: ["Auga", "Casa", "Rio", "Escola", "Xanela"],
  icelandic: ["Vatn", "Hus", "A", "Skoli", "Gluggi"],
  latvian: ["Udens", "Maja", "Upe", "Skola", "Logs"],
  lithuanian: ["Vanduo", "Namas", "Upe", "Mokykla", "Langas"],
  armenian: ["ջուր", "տուն", "գետ", "դպրոց", "պատուհան"],
  georgian: ["წყალი", "სახლი", "მდინარე", "სკოლა", "ფანჯარა"],
  azerbaijani: ["Su", "Ev", "Cay", "Mekteb", "Pencere"],
  belarusian: ["вада", "дом", "рака", "школа", "акно"],
  bulgarian: ["вода", "къща", "река", "училище", "прозорец"],
  kazakh: ["су", "үй", "өзен", "мектеп", "терезе"],
  esperanto: ["Akvo", "Domo", "Rivero", "Lernejo", "Fenestro"],
  ido: ["Aquo", "Domo", "Rivero", "Skolo", "Fenestro"],
  interlingua: ["AquaClara", "Casa", "Fluvio", "Schola", "Fenestra"],
  interlingue: ["AquaPura", "Domo", "Rivere", "Scole", "Fenestre"],
  latin: ["AquaClara", "Domus", "Flumen", "Schola", "Fenestra"],
  romansh: ["Aua", "Chasa", "Flum", "Scola", "Fanestra"],
  bislama: ["Wota", "Haos", "Reva", "Skul", "Windou"],
  fijian: ["Wai", "Vale", "Uciwai", "Koronivuli", "Katuba"],
  haitian: ["Dlo", "Kay", "Rivye", "Lekol", "Fenèt"],
  hiri_motu: ["Ranu", "Ruma", "Sinavai", "Skulu", "Windou"],
  maori: ["Wai", "Whare", "Awa", "Kura", "Matapihi"],
  samoan: ["Vai", "Fale", "Vaitafe", "Aoga", "Faamalama"],
  faroese: ["Vatn", "Hus", "A", "Skuli", "Vindeyga"],
  western_frisian: ["Wetter", "Hus", "Rivier", "Skoalle", "Finster"],
  luxembourgish: ["Waasser", "Haus", "Floss", "Schoul", "Fënster"],
  norwegian: ["Vann", "Hus", "Elv", "Skole", "Vindu"],
  norwegian_bokm_l: ["Vann", "Hjem", "Elv", "Skole", "Vindu"],
  norwegian_nynorsk: ["Vatn", "Hus", "Elv", "Skule", "Vindauge"],
  aragonese: ["Augua", "Casa", "Río", "Escuela", "Finestra"],
  breton: ["Dour", "Ti", "Stêr", "Skol", "Prenestr"],
  cornish: ["Dowr", "Chi", "Avon", "Skol", "Fenester"],
  corsican: ["Acqua", "Casa", "Fiume", "Scola", "Finestra"],
  slovak: ["Voda", "Dom", "Rieka", "Skola", "Okno"],
  slovenian: ["Voda", "Hisa", "Reka", "Sola", "Okno"],
  herero: ["Omeva", "Ondjuwo", "Omuoko", "Osikore", "Oruveze"],
  igbo: ["Mmiri", "Ulo", "Osimiri", "Uloakwukwo", "Mpio"],
  kikuyu: ["Mai", "Nyumba", "Rui", "Thukuru", "Dirisha"],
  kuanyama: ["Omeva", "Egumbo", "Omulonga", "Osikola", "Oshivikelo"],
  luba_katanga: ["Mema", "Nzo", "Mulonga", "Skola", "Cibi"],
  sotho_southern: ["Metsi", "Ntlo", "Noka", "Sekolo", "Fensetere"],
  gaelic: ["Uisge", "Taigh", "Abhainn", "Sgoil", "Uinneag"],
  irish: ["Uisce", "Teach", "Abhainn", "Scoil", "Fuinneog"],
  manx: ["Ushtey", "Thie", "Awin", "Scoill", "Uinnag"],
  limburgan: ["Waoter", "Hoes", "Rivier", "Sjoal", "Venster"],
  maltese: ["Ilma", "Dar", "Xmara", "Skola", "Tieqa"],
  sardinian: ["Abba", "Domo", "Riu", "Iscola", "Bentana"],
  bashkir: ["һыу", "өй", "йылға", "мәктәп", "тәҙрә"],
  chuvash: ["шыв", "кил", "юханшыв", "шкул", "чӳрече"],
  kirghiz: ["суу", "үй", "дарыя", "мектеп", "терезе"],
  komi: ["ва", "керка", "ю", "школа", "öшинь"],
  kurdish: ["Av", "Mal", "Rubar", "Dibistan", "Pencere"],
  macedonian: ["вода", "куќа", "река", "училиште", "прозорец"],
  abkhazian: ["аӡы", "аҩны", "аӡиас", "ашкол", "аԥенџьыр"],
  afar: ["Lee", "Buxa", "Weeqaytu", "Madrasah", "Dukaana"],
  akan: ["Nsuo", "Fie", "Asubɔnten", "Sukuu", "Mfɛnsere"],
  assamese: ["পানী", "ঘৰ", "নদী", "বিদ্যালয়", "খিৰিকী"],
  avaric: ["лъим", "хъизан", "рагъ", "школа", "нуцIа"],
  avestan: ["Asha", "Vohu", "Mazda", "Yasna", "Gatha"],
  chamorro: ["Hanom", "Guma", "Tasi", "Eskuela", "Bentana"],
  chechen: ["хи", "цIа", "хиэча", "школа", "ков"],
  church_slavic: ["вода", "домъ", "рѣка", "школа", "окно"],
  cree: ["Nipi", "Waskahikan", "Sipi", "Kiskinwahamatosowin", "Otenaw"],
  divehi: ["ފެން", "ގެ", "ކޯރު", "ސްކޫލް", "ދޮރު"],
  dzongkha: ["ཆུ", "ཁྱིམ", "གཙང་ཆུ", "སློབ་གྲྭ", "སྒོ"],
  inuktitut: ["ᐃᒪᖅ", "ᐃᒡᓗ", "ᑰᒃ", "ᐃᓕᓴᕕᒃ", "ᐅᒃᑯᐊᖅ"],
  inupiaq: ["Imiq", "Tupiq", "Kuuk", "Iḷisaġvik", "Igalaaq"],
  javanese: ["Banyu", "Omah", "Kali", "Sekolah", "Jendhela"],
  kalaallisut: ["Imeq", "Illu", "Kuuk", "Atuarfik", "Igalaaq"],
  kashmiri: ["آب", "گھر", "دریاه", "مکتب", "کھڑکی"],
  marshallese: ["Dren", "Mweo", "Ilooj", "Jikuul", "WindoMajol"],
  nauru: ["Eo", "Bwiema", "Ijow", "Skuul", "Iwindo"],
  navajo: ["To", "Kin", "Tooh", "Ołtaʼ", "Shikeeʼ"],
  ndonga: ["Omeva", "Egumbo", "Omulonga", "Osikola", "Omukelo"],
  northern_sami: ["Čáhci", "Ruoktu", "Johka", "Skuvla", "Láse"],
  occitan: ["Aiga", "Ostal", "Riu", "Escòla", "Fenèstra"],
  ojibwa: ["Nibi", "Wigamig", "Ziibi", "Gikinooamaadiiwigamig", "Ishkwaandem"],
  oriya: ["ପାଣି", "ଘର", "ନଦୀ", "ବିଦ୍ୟାଳୟ", "ଝରକା"],
  ossetian: ["дон", "хæдзар", "донхæст", "скъола", "рудзынг"],
  pali: ["Udaka", "Geha", "Nadi", "Sikkhaghara", "Vataka"],
  panjabi: ["ਪਾਣੀ", "ਘਰ", "ਦਰਿਆ", "ਸਕੂਲ", "ਖਿੜਕੀ"],
  sanskrit: ["जलम्", "गृहम्", "नदी", "विद्यालयः", "वातायनम्"],
  serbian: ["вода", "кућа", "река", "школа", "прозор"],
  sichuan_yi: ["ꆀ", "ꎧ", "ꃅ", "ꑭꏦ", "ꆍ"],
  sindhi: ["پاڻي", "گهر", "درياهه", "اسڪول", "دري"],
  south_ndebele: ["Amanzi", "Ikhaya", "Umlambo", "Isikolo", "Iwindi"],
  sundanese: ["Cai", "Imah", "Walungan", "Sakola", "Jandéla"],
  swati: ["Emanti", "Likhaya", "Umfula", "Sikolo", "Lifasitelo"],
  tahitian: ["Vai", "Fare", "Anavai", "Haapiiraa", "Haamaramarama"],
  tatar: ["су", "өй", "елга", "мәктәп", "тәрәзә"],
};

const oldSyllableFallbackExamples = {
  mongolian: ["мана", "мала"],
  lao: ["ມານາ", "ມາລາ"],
  burmese: [
    "ေိန",
    "မယိတ",
    "လအဟပေတ",
    "ဇိန",
    "ဟစအယအဝုန",
    "ကအလေ",
    "ေဂဂ",
    "ဗိရဒ",
    "ကိုရန",
    "ဗေအန",
    "ပေအနုတ",
  ],
  khmer: [
    "ពតេអហ",
    "កអ",
    "សិេវូវ",
    "កអូ",
    "កអសេកូរ",
    "បេអន",
    "កូរន",
    "ពេអរ",
    "ពេពពេរ",
  ],
  malagasy: ["Mana", "Mala"],
  dari: ["مانا", "مالا"],
  pashto: [
    "وبا",
    "مانرا",
    "ماکتاب",
    "رېام",
    "وار",
    "سالت",
    "ېګګ",
    "يککېن",
    "بېان",
    "پېانوت",
  ],
  chichewa: ["Mana", "Mala"],
  tigrinya: ["ምአንአ", "ምአልአ"],
  sinhala: ["මඅනඅ", "මඅලඅ"],
  tamil: ["மஅநஅ", "மஅலஅ"],
};

const earlyEnglishFallbackExamples = {
  filipino: ["Basket", "Bag"],
  somali: [
    "Cat",
    "Dog",
    "Chicken",
    "Cow",
    "Fish",
    "Bird",
    "Egg",
    "Salt",
    "Sugar",
    "Coffee",
    "Corn",
    "Bean",
    "Peanut",
    "Mango",
    "Papaya",
    "Pineapple",
    "Pear",
    "Garlic",
    "Bamboo",
    "Knife",
    "Phone",
    "Computer",
    "Calendar",
    "Teacher",
    "Doctor",
    "Office",
    "Station",
    "Newspaper",
    "Notebook",
  ],
};

const generatedLanguagePrefixExamples = {
  afrikaans: ["AfrikaBranch", "AfrikaAlaWater", "AfrikaAlaSchool"],
  albanian: ["AlbaniBranch", "AlbaniAlaWater", "AlbaniAlaSchool"],
  basque: ["BasqueBranch", "BasqueAlaWater", "BasqueAlaSchool"],
  catalan: ["CatalaBranch", "CatalaAlaWater", "CatalaAlaSchool"],
  croatian: ["CroatiBranch", "CroatiAlaWater", "CroatiAlaSchool"],
  finnish: ["FinnisBranch", "FinnisAlaWater", "FinnisAlaSchool"],
  malay: ["MalayBranch", "MalayAlaWater", "MalayAlaSchool"],
  hebrew: ["HebrewBranch", "HebrewAlaWater", "HebrewAlaSchool"],
  bosnian: ["BosniaBranch", "BosniaAlaWater", "BosniaAlaSchool"],
  estonian: ["EstoniBranch", "EstoniAlaWater", "EstoniAlaSchool"],
  galician: ["GaliciBranch", "GaliciAlaWater", "GaliciAlaSchool"],
  icelandic: ["IcelanBranch", "IcelanAlaWater", "IcelanAlaSchool"],
  latvian: ["LatviaBranch", "LatviaAlaWater", "LatviaAlaSchool"],
  lithuanian: ["LithuaBranch", "LithuaAlaWater", "LithuaAlaSchool"],
  armenian: ["ArmeniBranch", "ArmeniAlaWater", "ArmeniAlaSchool"],
  georgian: ["GeorgiBranch", "GeorgiAlaWater", "GeorgiAlaSchool"],
  azerbaijani: ["AzerbaBranch", "AzerbaAlaWater", "AzerbaAlaSchool"],
  belarusian: ["BelaruBranch", "BelaruAlaWater", "BelaruAlaSchool"],
  bulgarian: ["BulgarBranch", "BulgarAlaWater", "BulgarAlaSchool"],
  kazakh: ["KazakhBranch", "KazakhAlaWater", "KazakhAlaSchool"],
  esperanto: ["EsperaBranch", "EsperaAlaWater", "EsperaAlaSchool"],
  ido: ["IdoBranch", "IdoAlaWater", "IdoAlaSchool"],
  interlingua: ["InterlBranch", "InterlAlaWater", "InterlAlaSchool"],
  interlingue: ["InterlBranch", "InterlAlaWater", "InterlAlaSchool"],
  latin: ["LatinBranch", "LatinAlaWater", "LatinAlaSchool"],
  romansh: ["RomansBranch", "RomansAlaWater", "RomansAlaSchool"],
  bislama: ["BislamBranch", "BislamAlaWater", "BislamAlaSchool", "BislamAlaBranch"],
  fijian: ["FijianBranch", "FijianAlaWater", "FijianAlaSchool"],
  haitian: ["HaitiaBranch", "HaitiaAlaWater", "HaitiaAlaSchool"],
  hiri_motu: [
    "HirimoBranch",
    "HirimoAlaWater",
    "HirimoAlaSchool",
    "HirimoAlaBrick",
    "HirimoBelaWater",
  ],
  maori: ["MaoriBranch", "MaoriAlaWater", "MaoriAlaSchool"],
  samoan: ["SamoanBranch", "SamoanAlaWater", "SamoanAlaSchool"],
  faroese: ["FaroesBranch", "FaroesAlaWater", "FaroesAlaSchool"],
  western_frisian: [
    "WesterAlaBook",
    "WesterAlaWater",
    "WesterAlaSchool",
    "WesterAlaBrick",
    "WesterBelaWater",
  ],
  luxembourgish: ["LuxembBranch", "LuxembAlaWater", "LuxembAlaSchool"],
  norwegian: ["NorwegBranch", "NorwegAlaWater", "NorwegAlaSchool"],
  norwegian_bokm_l: ["NorwegBranch", "NorwegAlaWater", "NorwegAlaSchool"],
  norwegian_nynorsk: ["NorwegBranch", "NorwegAlaWater", "NorwegAlaSchool"],
  aragonese: ["AragonBranch", "AragonAlaWater", "AragonAlaSchool"],
  breton: ["BretonBranch", "BretonAlaWater", "BretonAlaSchool"],
  cornish: [
    "CornisBranch",
    "CornisAlaWater",
    "CornisAlaSchool",
    "CornisAlaBrick",
  ],
  corsican: ["CorsicBranch", "CorsicAlaWater", "CorsicAlaSchool"],
  slovak: ["SlovakAlaBook", "SlovakAlaWater", "SlovakAlaSchool"],
  slovenian: ["SlovenAlaBook", "SlovenAlaWater", "SlovenAlaSchool"],
  herero: ["HereroBranch", "HereroAlaWater", "HereroAlaSchool"],
  igbo: ["IgboBranch", "IgboAlaWater", "IgboAlaSchool"],
  kikuyu: ["KikuyuBranch", "KikuyuAlaWater", "KikuyuAlaSchool"],
  kuanyama: ["KuanyaBranch", "KuanyaAlaWater", "KuanyaAlaSchool"],
  luba_katanga: ["LubakaBranch", "LubakaAlaWater", "LubakaAlaSchool"],
  sotho_southern: [
    "SothosAlaBook",
    "SothosAlaWater",
    "SothosAlaSchool",
    "SothosAlaBrick",
    "SothosBelaWater",
  ],
  gaelic: ["GaelicBranch", "GaelicAlaWater", "GaelicAlaSchool"],
  irish: ["IrishBranch", "IrishAlaWater", "IrishAlaSchool"],
  manx: ["ManxBranch", "ManxAlaWater", "ManxAlaSchool"],
  limburgan: ["LimburBranch", "LimburAlaWater", "LimburAlaSchool"],
  maltese: ["MaltesBranch", "MaltesAlaWater", "MaltesAlaSchool"],
  sardinian: ["SardinBranch", "SardinAlaWater", "SardinAlaSchool"],
  bashkir: ["BashkiBranch", "BashkiAlaWater", "BashkiAlaSchool"],
  chuvash: ["ChuvasBranch", "ChuvasAlaWater", "ChuvasAlaSchool"],
  kirghiz: ["KirghiBranch", "KirghiAlaWater", "KirghiAlaSchool"],
  komi: ["KomiBranch", "KomiAlaWater", "KomiAlaSchool"],
  kurdish: ["KurdisBranch", "KurdisAlaWater", "KurdisAlaSchool"],
  macedonian: ["MacedoBranch", "MacedoAlaWater", "MacedoAlaSchool"],
  abkhazian: ["AbkhazBranch", "AbkhazAlaWater", "AbkhazAlaSchool"],
  afar: ["AfarBranch", "AfarAlaWater", "AfarAlaSchool"],
  akan: ["AkanBranch", "AkanAlaWater", "AkanAlaSchool"],
  assamese: ["AssameBranch", "AssameAlaWater", "AssameAlaSchool"],
  avaric: ["AvaricBranch", "AvaricAlaWater", "AvaricAlaSchool"],
  avestan: ["AvestaBranch", "AvestaAlaWater", "AvestaAlaSchool"],
  chamorro: [
    "ChamorBranch",
    "ChamorAlaWater",
    "ChamorAlaSchool",
    "ChamorAlaBranch",
  ],
  chechen: ["ChecheBranch", "ChecheAlaWater", "ChecheAlaSchool"],
  church_slavic: ["ChurchBranch", "ChurchAlaWater", "ChurchAlaSchool"],
  cree: ["CreeBranch", "CreeAlaWater", "CreeAlaSchool"],
  divehi: ["DivehiBranch", "DivehiAlaWater", "DivehiAlaSchool"],
  dzongkha: ["DzongkBranch", "DzongkAlaWater", "DzongkAlaSchool"],
  inuktitut: ["InuktiBranch", "InuktiAlaWater", "InuktiAlaSchool"],
  inupiaq: [
    "InupiaBranch",
    "InupiaAlaWater",
    "InupiaAlaSchool",
    "InupiaAlaBranch",
  ],
  javanese: [
    "JavaneBranch",
    "JavaneAlaWater",
    "JavaneAlaSchool",
    "JavaneAlaBrick",
    "JavaneBelaWater",
  ],
  kalaallisut: [
    "KalaalBranch",
    "KalaalAlaWater",
    "KalaalAlaSchool",
    "KalaalAlaBranch",
    "KalaalBelaWater",
  ],
  kashmiri: ["KashmiBranch", "KashmiAlaWater", "KashmiAlaSchool"],
  marshallese: ["MarshaBranch", "MarshaAlaWater", "MarshaAlaSchool"],
  nauru: ["NauruBranch", "NauruAlaWater", "NauruAlaSchool"],
  navajo: ["NavajoBranch", "NavajoAlaWater", "NavajoAlaSchool"],
  ndonga: ["NdongaBranch", "NdongaAlaWater", "NdongaAlaSchool"],
  northern_sami: [
    "NortheBranch",
    "NortheAlaWater",
    "NortheAlaSchool",
    "NortheAlaBrick",
    "NortheBelaWater",
  ],
  occitan: ["OccitaBranch", "OccitaAlaWater", "OccitaAlaSchool"],
  ojibwa: ["OjibwaBranch", "OjibwaAlaWater", "OjibwaAlaSchool"],
  oriya: ["OriyaBranch", "OriyaAlaWater", "OriyaAlaSchool"],
  ossetian: ["OssetiBranch", "OssetiAlaWater", "OssetiAlaSchool"],
  pali: ["PaliBranch", "PaliAlaWater", "PaliAlaSchool"],
  panjabi: ["PanjabBranch", "PanjabAlaWater", "PanjabAlaSchool"],
  sanskrit: ["SanskrBranch", "SanskrAlaWater", "SanskrAlaSchool"],
  serbian: ["SerbiaBranch", "SerbiaAlaWater", "SerbiaAlaSchool"],
  sichuan_yi: ["SichuaBranch", "SichuaAlaWater", "SichuaAlaSchool"],
  sindhi: ["SindhiBranch", "SindhiAlaWater", "SindhiAlaSchool"],
  south_ndebele: [
    "SouthnAlaBook",
    "SouthnAlaWater",
    "SouthnAlaSchool",
    "SouthnAlaBrick",
    "SouthnBelaWater",
  ],
  sundanese: [
    "SundanAlaBook",
    "SundanAlaWater",
    "SundanAlaSchool",
    "SundanAlaBrick",
    "SundanBelaWater",
  ],
  swati: ["SwatiAlaBook", "SwatiAlaWater", "SwatiAlaSchool"],
  tahitian: [
    "TahitiAlaBook",
    "TahitiAlaWater",
    "TahitiAlaSchool",
    "TahitiAlaBrick",
    "TahitiBelaWater",
  ],
  tatar: ["TatarAlaBook", "TatarAlaWater", "TatarAlaSchool"],
};

const generatedLanguagePrefixScanLimits = {
  abkhazian: 5000,
  afar: 5000,
  afrikaans: 5000,
  acholi: 705,
  akan: 5000,
  albanian: 5000,
  aragonese: 5000,
  armenian: 5000,
  assamese: 5000,
  avaric: 5000,
  avestan: 5000,
  aymara: 473,
  azerbaijani: 5000,
  bambara: 682,
  bashkir: 5000,
  basque: 5000,
  belarusian: 5000,
  bislama: 5000,
  bosnian: 5000,
  breton: 5000,
  bulgarian: 5000,
  catalan: 5000,
  chamorro: 5000,
  chechen: 5000,
  chichewa: 689,
  church_slavic: 5000,
  chuvash: 5000,
  cornish: 5000,
  corsican: 5000,
  cree: 5000,
  croatian: 5000,
  dagbani: 591,
  dinka: 708,
  divehi: 5000,
  dzongkha: 5000,
  estonian: 5000,
  esperanto: 5000,
  ewe: 667,
  faroese: 5000,
  fijian: 5000,
  finnish: 5000,
  fon: 667,
  fula: 480,
  gaelic: 5000,
  galician: 5000,
  georgian: 5000,
  guarani: 674,
  haitian: 5000,
  hebrew: 5000,
  herero: 5000,
  hiri_motu: 5000,
  icelandic: 5000,
  ido: 5000,
  igbo: 5000,
  interlingua: 5000,
  interlingue: 5000,
  inuktitut: 5000,
  inupiaq: 5000,
  irish: 5000,
  javanese: 5000,
  kalaallisut: 5000,
  kashmiri: 5000,
  kazakh: 5000,
  kikuyu: 5000,
  kinyarwanda: 475,
  kirundi: 675,
  kirghiz: 5000,
  kanuri: 676,
  kongo: 673,
  komi: 5000,
  krio: 662,
  kuanyama: 5000,
  kurdish: 5000,
  latin: 5000,
  latvian: 5000,
  limburgan: 5000,
  lithuanian: 5000,
  luba_katanga: 5000,
  luxembourgish: 5000,
  luganda: 555,
  macedonian: 5000,
  malay: 5000,
  malagasy: 485,
  maltese: 5000,
  manx: 5000,
  maori: 5000,
  marshallese: 5000,
  moore: 665,
  nauru: 5000,
  navajo: 5000,
  ndebele: 552,
  ndonga: 5000,
  northern_sami: 5000,
  nuer: 496,
  norwegian: 5000,
  norwegian_bokm_l: 5000,
  norwegian_nynorsk: 5000,
  occitan: 5000,
  ojibwa: 5000,
  oromo: 479,
  oriya: 5000,
  ossetian: 5000,
  pali: 5000,
  panjabi: 5000,
  quechua: 676,
  romansh: 5000,
  samoan: 5000,
  sanskrit: 5000,
  sardinian: 5000,
  sango: 674,
  serbian: 5000,
  shona: 547,
  sichuan_yi: 5000,
  sindhi: 5000,
  slovak: 5000,
  slovenian: 5000,
  songhay: 591,
  sotho_southern: 5000,
  south_ndebele: 5000,
  sundanese: 5000,
  swati: 5000,
  tahitian: 5000,
  tamasheq: 521,
  tatar: 5000,
  tok_pisin: 741,
  twi: 512,
  western_frisian: 5000,
  wolof: 483,
  zarma: 591,
};

const extendedFusionScanLimits = {
  amharic: 5000,
  bengali: 5000,
  hausa: 5000,
  swahili: 5000,
  urdu: 5000,
};

const strippedTransliterationFragments = [
  "Dgtr",
  "Dgtrso",
  "Knnin",
  "Ktn",
  "Jooorgal",
  "Lamam",
  "Gio",
  "Oggol",
  "Rdd",
];

const reviewedNativeLexicalBlocklist = {
  afrikaans: [
    "Museumaf",
    "WatertjieMuseumaf",
    "HuisMuseumaf",
    "WatertjieHuis",
    "NoordWater",
  ],
  bislama: [
    "IsangelRoad",
    "SantoMarket",
    "ErakorBridge",
    "TurtleBay",
    "HogHarbour",
    "ChampagneBeach",
    "WotaHotel",
  ],
  chamorro: [
    "FenaRoad",
    "UgumRiver",
    "PagoBridge",
    "TumonBay",
    "PitiHarbor",
    "ApraHarbor",
  ],
  cornish: [
    "LauncestonRoad",
    "FoweyRiver",
    "LostwithielBridge",
    "CarbisBay",
  ],
  corsican: ["BorguRoad", "SarteneRoad", "AcquaLumioRoad"],
  cree: [
    "KashechewanRoad",
    "MooseRiver",
    "NorwayHouse",
    "SandyBay",
    "NemaskaVillage",
  ],
  fijian: ["Harbour", "WaiHarbour", "ValeHarbour"],
  herero: ["WalvisBay", "OmevaWalvisBay", "OmbatataWalvisBay"],
  igbo: ["OjiRiver", "UloOjiRiver", "MmiriAlaLarịị", "UloAlaAhihia"],
  ido: [
    "IdoWaterPath",
    "IdoHomeGate",
    "IdoRiverField",
    "IdoBridgeGarden",
    "IdoGardenForest",
  ],
  inupiaq: ["HooperBay", "MountainVillage", "PilotStation"],
  interlingua: ["Villageia", "AquaClaraVillageia", "Bruxella"],
  interlingue: [
    "Aquari",
    "Solari",
    "Cafeie",
    "AquariDomo",
    "AquaPuraVillage",
    "DomoHospital",
  ],
  manx: ["GovernorHill", "SulbyBridge", "RamseyHarbour"],
  marshallese: ["LikiepVillage", "MajuroHospital", "MajuroHarbor"],
  kikuyu: ["AthiRiver", "HomaBay", "BurntForest"],
  maltese: ["VallettaHarbour", "MarsaskalaBay", "BalzanVillage"],
  mongolian: ["Усын", "Гэрын", "Цэцэгын", "Будааын", "Навчын"],
  nauru: ["RonHospital", "YarenSchool", "AiwoSchool", "AnibareBay"],
  ndonga: ["WalvisBay", "HentiesBay", "DolphinBeach"],
  navajo: ["Toroad", "Dzigarden", "Chilbridge", "Otamarket"],
  ojibwa: ["ThunderBay", "BlindRiver", "NiagaraFalls", "GardenRiverVillage"],
  samoan: ["LefagaBay", "UafatoBay", "VaiLefagaBay", "VaiAlaSavali"],
  swati: ["AirportRoad", "WhiteRiver"],
};

const generatedLowercaseEnglishSeedSuffixPattern =
  /(?:leaf|moon|morning|moss|mortar|water|home|river|hill|flower|book|school|market|tree|road|bridge|notebook|driver|springwater|garden|field|basket|chair|table|window|door|gate|phone|family|friend|child|teacher|doctor|farmer|hotel|station|garlic|bamboo)$/;

const generatedStandaloneEnglishSeedPattern =
  /^[A-Z][a-z]+(?:leaf|moon|morning|moss|mortar|water|home|river|hill|flower|book|school|market|tree|road|bridge|notebook|driver|springwater|garden|field|basket|chair|table|window|door|gate|phone|family|friend|child|teacher|doctor|farmer|hotel|station|garlic|bamboo)$/;

const standaloneEnglishSeedExamples = new Set([
  "Garlic",
  "Bamboo",
  "Family",
  "Friend",
  "Child",
  "Teacher",
  "Doctor",
  "Farmer",
  "Hotel",
  "Station",
  "Road",
  "Bridge",
  "Market",
  "Basket",
  "Garden",
  "Field",
  "Chair",
  "Table",
  "Window",
  "Door",
  "Gate",
  "Phone",
  "Driver",
  "Springwater",
  "Mortar",
  "Notebook",
]);

const slug = (value) =>
  String(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .replace(/^x+/, "") || "word";

const isFusedFromEarlierWords = (word, earlierWords) => {
  for (const left of earlierWords) {
    if (!word.startsWith(left) || left.length === word.length) continue;
    const right = word.slice(left.length);
    if ([...left].length < 3 || [...right].length < 3) continue;
    if (earlierWords.has(right)) return true;
  }
  return false;
};

const firstCharLower = (word) => {
  const chars = [...word];
  return `${chars[0]?.toLocaleLowerCase() ?? ""}${chars.slice(1).join("")}`;
};

const addWordForms = (forms, word) => {
  forms.add(word);
  forms.add(firstCharLower(word));
};

const isFusedFromEarlierWordForms = (word, earlierForms) => {
  for (const left of earlierForms) {
    if (!word.startsWith(left) || left.length === word.length) continue;
    const right = word.slice(left.length);
    if ([...left].length < 3 || [...right].length < 3) continue;
    if (earlierForms.has(right)) return true;
  }
  return false;
};

describe("address-gap codebook quality", () => {
  test("keeps the first 220 entries free of mechanical two-word fusions", () => {
    for (const language of languages) {
      const words = readCodebook(language).slice(0, 220);
      const earlierWords = new Set();
      const fused = [];

      for (const word of words) {
        if (
          !lexicalizedFusions[language]?.has(word) &&
          isFusedFromEarlierWords(word, earlierWords)
        ) {
          fused.push(word);
        }
        earlierWords.add(word);
      }

      assert.deepEqual(
        fused,
        [],
        `${language} front-loaded mechanical fusions: ${fused
          .slice(0, 10)
          .join(", ")}`,
      );
    }
  });

  test("front-loads reviewed standalone seeds before synthetic fallback", () => {
    for (const [language, expectedWords] of Object.entries(
      frontLoadedExpectedWords,
    )) {
      const words = readCodebook(language).slice(0, 140);
      for (const word of expectedWords) {
        assert.ok(
          words.includes(word),
          `${language} should front-load ${word}`,
        );
      }
    }
  });

  test("keeps extended reviewed windows free of mechanical fusions", () => {
    for (const [language, limit] of Object.entries(extendedFusionScanLimits)) {
      const words = readCodebook(language).slice(0, limit);
      const earlierForms = new Set();
      const fused = [];

      for (const word of words) {
        if (isFusedFromEarlierWordForms(word, earlierForms)) {
          fused.push(word);
        }
        addWordForms(earlierForms, word);
      }

      assert.deepEqual(
        fused,
        [],
        `${language} first ${limit} entries should not expose mechanical fusions`,
      );
    }
  });

  test("keeps old generated syllable filler out of the first 140 entries", () => {
    for (const [language, blockedWords] of Object.entries(
      oldSyllableFallbackExamples,
    )) {
      const words = readCodebook(language).slice(0, 140);
      assert.deepEqual(
        words.filter((word) => blockedWords.includes(word)),
        [],
        `${language} should not expose old syllable filler early`,
      );
    }
  });

  test("keeps early English fallback out of reviewed codebooks", () => {
    for (const [language, blockedWords] of Object.entries(
      earlyEnglishFallbackExamples,
    )) {
      const words = readCodebook(language).slice(0, 300);
      assert.deepEqual(
        words.filter((word) => blockedWords.includes(word)),
        [],
        `${language} should not expose early English fallback`,
      );
    }
  });

  test("keeps generated language-prefix scaffolds out of reviewed codebooks", () => {
    for (const [language, blockedWords] of Object.entries(
      generatedLanguagePrefixExamples,
    )) {
      const limit = generatedLanguagePrefixScanLimits[language] ?? 120;
      const words = readCodebook(language).slice(0, limit);
      assert.deepEqual(
        words.filter((word) => blockedWords.includes(word)),
        [],
        `${language} should not expose generated language-prefix scaffolds`,
      );
    }
  });

  test("keeps stripped transliteration fragments out of early Latin codebooks", () => {
    for (const language of [
      "bambara",
      "fula",
      "wolof",
      "ewe",
      "fon",
      "aymara",
      "guarani",
    ]) {
      const words = readCodebook(language).slice(0, 220);
      assert.deepEqual(
        words.filter((word) =>
          strippedTransliterationFragments.some((fragment) =>
            word.includes(fragment),
          ),
        ),
        [],
        `${language} should not contain stripped transliteration fragments`,
      );
    }
  });

  test("keeps reviewed native lexical cleanup examples out of codebooks", () => {
    for (const [language, blockedWords] of Object.entries(
      reviewedNativeLexicalBlocklist,
    )) {
      const words = readCodebook(language);
      assert.deepEqual(
        words.filter((word) =>
          blockedWords.some((blockedWord) => word.includes(blockedWord)),
        ),
        [],
        `${language} should not retain reviewed rough lexical forms`,
      );
    }

    const esperantoWords = readCodebook("esperanto");
    assert.deepEqual(
      esperantoWords.filter((word) => /[CcGgHhJjSsUu]x/.test(word)),
      [],
      "esperanto should use Unicode diacritics instead of x-system forms",
    );
  });

  test("keeps generated lowercase English seed suffixes out of reviewed codebook tails", () => {
    for (const language of languages) {
      const languageSlug = slug(language).slice(0, 6);
      const words = readCodebook(language);
      const generatedSuffixes = words
        .map((word, index) => ({ index, word }))
        .filter(({ index, word }) => {
          if (index >= 250 && standaloneEnglishSeedExamples.has(word)) {
            return true;
          }
          return (
            index >= 700 &&
            generatedLowercaseEnglishSeedSuffixPattern.test(word) &&
            (languages.includes(language) ||
              word.toLowerCase().includes(languageSlug) ||
              generatedStandaloneEnglishSeedPattern.test(word))
          );
        });

      assert.deepEqual(
        generatedSuffixes.slice(0, 10),
        [],
        `${language} should not expose generated lowercase English seed suffixes`,
      );
    }
  });
});
