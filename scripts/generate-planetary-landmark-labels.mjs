import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;

const readText = (relativePath) =>
  readFileSync(join(root, relativePath), "utf8");

const stripNumberSuffix = (value) => value.replace(/\s*\d+$/, "");

const localeLanguageSource = readText(
  "apps/web/lib/i18n/ground-code-language.ts",
);
const languages = [
  "english",
  ...Array.from(
    localeLanguageSource.matchAll(
      /if \(locale === "[^"]+"\) return "([^"]+)";/g,
    ),
    (match) => match[1],
  ),
].filter((language, index, all) => all.indexOf(language) === index);

const targets = {
  moon: [
    { id: "mare-imbrium", level: 2, matchName: "Mare Imbrium" },
    { id: "oceanus-procellarum", level: 2, matchName: "Oceanus Procellarum" },
    { id: "mare-tranquillitatis", level: 2, matchName: "Mare Tranquillitatis" },
    { id: "mare-serenitatis", level: 2, matchName: "Mare Serenitatis" },
    { id: "mare-crisium", level: 2, matchName: "Mare Crisium" },
    { id: "tycho", level: 2, matchName: "Tycho" },
    { id: "copernicus", level: 2, matchName: "Copernicus" },
    { id: "aristarchus", level: 2, matchName: "Aristarchus" },
    { id: "clavius", level: 2, matchName: "Clavius" },
    { id: "shackleton", level: 2, matchName: "Shackleton" },
    { id: "mare-smythii", level: 2, matchName: "Mare Smythii" },
    { id: "mare-marginis", level: 2, matchName: "Mare Marginis" },
    { id: "mare-moscoviense", level: 2, matchName: "Mare Moscoviense" },
    { id: "mare-ingenii", level: 2, matchName: "Mare Ingenii" },
    { id: "mare-australe", level: 2, matchName: "Mare Australe" },
    { id: "tsiolkovskiy", level: 2, matchName: "Tsiolkovskiy" },
    { id: "korolev", level: 2, matchName: "Korolev" },
    { id: "von-karman", level: 2, matchName: "Von Karman" },
    { id: "mendeleev", level: 2, matchName: "Mendeleev" },
    { id: "giordano-bruno", level: 2, matchName: "Giordano Bruno" },
    { id: "mare-orientale", level: 2, matchName: "Mare Orientale" },
    { id: "hertzsprung", level: 2, matchName: "Hertzsprung" },
  ],
  mars: [
    { id: "olympus-mons", level: 2, matchName: "Olympus Mons" },
    { id: "valles-marineris", level: 2, matchName: "Valles Marineris" },
    {
      id: "gale-crater",
      level: 3,
      matchName: "Gale Crater 1",
      normalize: stripNumberSuffix,
    },
    {
      id: "jezero-crater",
      level: 3,
      matchName: "Jezero Crater 2",
      normalize: stripNumberSuffix,
    },
    { id: "hellas-planitia", level: 2, matchName: "Hellas Planitia" },
    { id: "utopia-planitia", level: 2, matchName: "Utopia Planitia" },
    { id: "syrtis-major", level: 2, matchName: "Syrtis Major" },
    { id: "elysium-mons", level: 2, matchName: "Elysium Mons" },
    { id: "tharsis", level: 2, matchName: "Tharsis" },
    { id: "noctis-labyrinthus", level: 2, matchName: "Noctis Labyrinthus" },
    { id: "arsia-mons", level: 2, matchName: "Arsia Mons" },
    { id: "ascraeus-mons", level: 2, matchName: "Ascraeus Mons" },
    { id: "pavonis-mons", level: 2, matchName: "Pavonis Mons" },
    { id: "isidis-planitia", level: 2, matchName: "Isidis Planitia" },
    { id: "arabia-terra", level: 2, matchName: "Arabia Terra" },
    { id: "meridiani-planum", level: 2, matchName: "Meridiani Planum" },
    { id: "chryse-planitia", level: 2, matchName: "Chryse Planitia" },
    { id: "amazonis-planitia", level: 2, matchName: "Amazonis Planitia" },
    { id: "arcadia-planitia", level: 2, matchName: "Arcadia Planitia" },
    { id: "argyre-planitia", level: 2, matchName: "Argyre Planitia" },
    { id: "terra-cimmeria", level: 2, matchName: "Terra Cimmeria" },
  ],
};

const missionFallbacks = {
  korean: {
    moon: {
      "apollo-11": "아폴로 11",
      "south-pole-aitken": "남극-에이트켄 분지",
    },
    mars: {
      "viking-1": "바이킹 1",
    },
  },
  chinese: {
    moon: {
      "apollo-11": "阿波罗11号",
      "south-pole-aitken": "南极-艾特肯盆地",
    },
    mars: {
      "viking-1": "维京1号",
    },
  },
  japanese: {
    moon: {
      "apollo-11": "アポロ11号",
      "south-pole-aitken": "南極エイトケン盆地",
    },
    mars: {
      "viking-1": "バイキング1号",
    },
  },
  spanish: {
    moon: {
      "apollo-11": "Apolo 11",
      "south-pole-aitken": "Cuenca Polo Sur-Aitken",
    },
    mars: {
      "viking-1": "Vikingo 1",
    },
  },
  french: {
    moon: {
      "apollo-11": "Apollo 11",
      "south-pole-aitken": "Bassin Pole Sud-Aitken",
    },
    mars: {
      "viking-1": "Viking 1",
    },
  },
  german: {
    moon: {
      "apollo-11": "Apollo 11",
      "south-pole-aitken": "Sudpol-Aitken-Becken",
    },
    mars: {
      "viking-1": "Viking 1",
    },
  },
  portuguese: {
    moon: {
      "apollo-11": "Apollo 11",
      "south-pole-aitken": "Bacia Polo Sul-Aitken",
    },
    mars: {
      "viking-1": "Viking 1",
    },
  },
  indonesian: {
    moon: {
      "apollo-11": "Apollo 11",
      "south-pole-aitken": "Cekungan Kutub Selatan-Aitken",
    },
    mars: {
      "viking-1": "Viking 1",
    },
  },
  thai: {
    moon: {
      "apollo-11": "อะพอลโล 11",
      "south-pole-aitken": "แอ่งขั้วใต้-เอตเคน",
    },
    mars: {
      "viking-1": "ไวกิง 1",
    },
  },
  vietnamese: {
    moon: {
      "apollo-11": "Apollo 11",
      "south-pole-aitken": "Bồn địa Cực Nam-Aitken",
    },
    mars: {
      "viking-1": "Viking 1",
    },
  },
  hindi: {
    moon: {
      "apollo-11": "अपोलो 11",
      "south-pole-aitken": "दक्षिणी ध्रुव-ऐटकेन बेसिन",
    },
    mars: {
      "viking-1": "वाइकिंग 1",
    },
  },
  arabic: {
    moon: {
      "apollo-11": "أبولو 11",
      "south-pole-aitken": "حوض القطب الجنوبي-أيتكن",
    },
    mars: {
      "viking-1": "فايكنغ 1",
    },
  },
  russian: {
    moon: {
      "apollo-11": "Аполлон-11",
      "south-pole-aitken": "Бассейн Южный полюс-Эйткен",
    },
    mars: {
      "viking-1": "Викинг-1",
    },
  },
};

const manualLabelOverrides = {
  korean: {
    moon: {
      "mare-imbrium": "비의 바다",
      "oceanus-procellarum": "폭풍의 대양",
      "mare-tranquillitatis": "고요의 바다",
      "mare-serenitatis": "맑음의 바다",
      "mare-crisium": "위기의 바다",
      tycho: "티코 크레이터",
      copernicus: "코페르니쿠스 크레이터",
      aristarchus: "아리스타르코스 크레이터",
      clavius: "클라비우스 크레이터",
      shackleton: "섀클턴 크레이터",
      "mare-smythii": "스미스의 바다",
      "mare-marginis": "가장자리의 바다",
      "mare-moscoviense": "모스크바의 바다",
      "mare-ingenii": "지혜의 바다",
      "mare-australe": "남쪽의 바다",
      tsiolkovskiy: "치올콥스키 크레이터",
      korolev: "코롤료프 크레이터",
      "von-karman": "폰 카르만 크레이터",
      mendeleev: "멘델레예프 크레이터",
      "giordano-bruno": "조르다노 브루노 크레이터",
      "mare-orientale": "동방의 바다",
      hertzsprung: "헤르츠스프룽 크레이터",
    },
    mars: {
      "olympus-mons": "올림푸스 산",
      "valles-marineris": "마리네리스 협곡",
      "hellas-planitia": "헬라스 평원",
      "utopia-planitia": "유토피아 평원",
      "syrtis-major": "대시르티스",
      "elysium-mons": "엘리시움 산",
      tharsis: "타르시스",
      "noctis-labyrinthus": "녹티스 라비린투스",
      "arsia-mons": "아르시아 산",
      "ascraeus-mons": "아스크레우스 산",
      "pavonis-mons": "파보니스 산",
      "isidis-planitia": "이시디스 평원",
      "arabia-terra": "아라비아 테라",
      "meridiani-planum": "메리디아니 평원",
      "chryse-planitia": "크리세 평원",
      "amazonis-planitia": "아마조니스 평원",
      "arcadia-planitia": "아르카디아 평원",
      "argyre-planitia": "아르기레 평원",
      "terra-cimmeria": "킴메리아 테라",
      "gale-crater": "게일 크레이터",
      "jezero-crater": "예제로 크레이터",
    },
  },
  chinese: {
    moon: {
      "mare-imbrium": "雨海",
      "oceanus-procellarum": "风暴洋",
      "mare-tranquillitatis": "静海",
      "mare-serenitatis": "澄海",
      "mare-crisium": "危海",
      tycho: "第谷环形山",
      copernicus: "哥白尼环形山",
      aristarchus: "阿里斯塔克斯环形山",
      clavius: "克拉维环形山",
      shackleton: "沙克尔顿环形山",
      "mare-moscoviense": "莫斯科海",
      tsiolkovskiy: "齐奥尔科夫斯基环形山",
      korolev: "科罗廖夫环形山",
      "von-karman": "冯·卡门环形山",
      mendeleev: "门捷列夫环形山",
      "giordano-bruno": "焦尔达诺·布鲁诺环形山",
      "mare-orientale": "东方海",
      hertzsprung: "赫茨普龙环形山",
    },
    mars: {
      "olympus-mons": "奥林帕斯山",
      "valles-marineris": "水手峡谷",
      "hellas-planitia": "希腊平原",
      "utopia-planitia": "乌托邦平原",
      "syrtis-major": "大瑟提斯",
      "elysium-mons": "埃律西昂山",
      tharsis: "塔尔西斯",
      "noctis-labyrinthus": "夜迷宫",
      "arsia-mons": "阿尔西亚山",
      "ascraeus-mons": "艾斯克雷尔斯山",
      "pavonis-mons": "帕弗尼斯山",
      "isidis-planitia": "伊西地平原",
      "arabia-terra": "阿拉伯高地",
      "meridiani-planum": "子午线高原",
      "chryse-planitia": "克律塞平原",
      "amazonis-planitia": "亚马逊平原",
      "arcadia-planitia": "阿卡迪亚平原",
      "argyre-planitia": "阿耳古瑞平原",
      "terra-cimmeria": "辛梅利亚高地",
      "gale-crater": "盖尔撞击坑",
      "jezero-crater": "耶泽罗撞击坑",
    },
  },
  japanese: {
    moon: {
      "mare-imbrium": "雨の海",
      "oceanus-procellarum": "嵐の大洋",
      "mare-tranquillitatis": "静かの海",
      "mare-serenitatis": "晴れの海",
      "mare-crisium": "危難の海",
      tycho: "ティコ",
      copernicus: "コペルニクス",
      aristarchus: "アリスタルコス",
      clavius: "クラヴィウス",
      shackleton: "シャクルトン",
      "mare-moscoviense": "モスクワの海",
      tsiolkovskiy: "ツィオルコフスキー",
      korolev: "コロリョフ",
      "von-karman": "フォン・カルマン",
      mendeleev: "メンデレーエフ",
      "giordano-bruno": "ジョルダーノ・ブルーノ",
      "mare-orientale": "東の海",
      hertzsprung: "ヘルツシュプルング",
    },
    mars: {
      "olympus-mons": "オリンポス山",
      "valles-marineris": "マリネリス峡谷",
      "hellas-planitia": "ヘラス平原",
      "utopia-planitia": "ユートピア平原",
      "syrtis-major": "大シルチス",
      "elysium-mons": "エリシウム山",
      tharsis: "タルシス",
      "noctis-labyrinthus": "夜の迷路",
      "arsia-mons": "アルシア山",
      "ascraeus-mons": "アスクレウス山",
      "pavonis-mons": "パヴォニス山",
      "isidis-planitia": "イシディス平原",
      "arabia-terra": "アラビア大陸",
      "meridiani-planum": "メリディアニ平原",
      "chryse-planitia": "クリュセ平原",
      "amazonis-planitia": "アマゾニス平原",
      "arcadia-planitia": "アルカディア平原",
      "argyre-planitia": "アルギュレ平原",
      "terra-cimmeria": "キンメリア大陸",
      "gale-crater": "ゲール・クレーター",
      "jezero-crater": "ジェゼロ・クレーター",
    },
  },
  french: {
    moon: {
      "mare-imbrium": "Mer des Pluies",
      "oceanus-procellarum": "Ocean des Tempetes",
      "mare-tranquillitatis": "Mer de la Tranquillite",
      "mare-serenitatis": "Mer de la Serenite",
      "mare-crisium": "Mer des Crises",
      "mare-australe": "Mer Australe",
      "mare-orientale": "Mer Orientale",
    },
    mars: {
      "olympus-mons": "Mont Olympe",
      "valles-marineris": "Vallees Marineris",
      "hellas-planitia": "Plaine Hellas",
      "utopia-planitia": "Plaine Utopia",
      "elysium-mons": "Mont Elysium",
      "arsia-mons": "Mont Arsia",
      "ascraeus-mons": "Mont Ascraeus",
      "pavonis-mons": "Mont Pavonis",
      "isidis-planitia": "Plaine Isidis",
      "meridiani-planum": "Plateau Meridiani",
      "amazonis-planitia": "Plaine Amazonis",
      "argyre-planitia": "Plaine Argyre",
      "gale-crater": "Cratere Gale",
      "jezero-crater": "Cratere Jezero",
    },
  },
  german: {
    moon: {
      "mare-imbrium": "Regenmeer",
      "oceanus-procellarum": "Ozean der Stuerme",
      "mare-tranquillitatis": "Meer der Ruhe",
      "mare-serenitatis": "Meer der Heiterkeit",
      "mare-crisium": "Krisenmeer",
      "mare-australe": "Suedmeer",
      "mare-orientale": "Ostmeer",
    },
    mars: {
      "olympus-mons": "Olympusberg",
      "valles-marineris": "Mariner-Taeler",
      "hellas-planitia": "Hellas-Ebene",
      "utopia-planitia": "Utopia-Ebene",
      "elysium-mons": "Elysiumberg",
      "arsia-mons": "Arsiaberg",
      "ascraeus-mons": "Ascraeusberg",
      "pavonis-mons": "Pavonisberg",
      "isidis-planitia": "Isidis-Ebene",
      "meridiani-planum": "Meridiani-Plateau",
      "amazonis-planitia": "Amazonis-Ebene",
      "argyre-planitia": "Argyre-Ebene",
      "gale-crater": "Gale-Krater",
      "jezero-crater": "Jezero-Krater",
    },
  },
  portuguese: {
    moon: {
      "mare-imbrium": "Mar das Chuvas",
      "oceanus-procellarum": "Oceano das Tempestades",
      "mare-tranquillitatis": "Mar da Tranquilidade",
      "mare-serenitatis": "Mar da Serenidade",
      "mare-crisium": "Mar das Crises",
      "mare-australe": "Mar Austral",
      "mare-orientale": "Mar Oriental",
    },
    mars: {
      "olympus-mons": "Monte Olimpo",
      "valles-marineris": "Vales Marineris",
      "hellas-planitia": "Planicie Hellas",
      "utopia-planitia": "Planicie Utopia",
      "elysium-mons": "Monte Elisio",
      "arsia-mons": "Monte Arsia",
      "ascraeus-mons": "Monte Ascraeus",
      "pavonis-mons": "Monte Pavonis",
      "isidis-planitia": "Planicie Isidis",
      "meridiani-planum": "Planalto Meridiani",
      "amazonis-planitia": "Planicie Amazonis",
      "argyre-planitia": "Planicie Argyre",
      "gale-crater": "Cratera Gale",
      "jezero-crater": "Cratera Jezero",
    },
  },
  indonesian: {
    moon: {
      "mare-imbrium": "Laut Hujan",
      "oceanus-procellarum": "Samudra Badai",
      "mare-tranquillitatis": "Laut Ketenangan",
      "mare-serenitatis": "Laut Serenitas",
      "mare-crisium": "Laut Krisis",
      "mare-australe": "Laut Selatan",
      "mare-orientale": "Laut Timur",
    },
    mars: {
      "olympus-mons": "Gunung Olympus",
      "valles-marineris": "Lembah Marineris",
      "hellas-planitia": "Dataran Hellas",
      "utopia-planitia": "Dataran Utopia",
      "elysium-mons": "Gunung Elysium",
      "arsia-mons": "Gunung Arsia",
      "ascraeus-mons": "Gunung Ascraeus",
      "pavonis-mons": "Gunung Pavonis",
      "isidis-planitia": "Dataran Isidis",
      "meridiani-planum": "Dataran Meridiani",
      "amazonis-planitia": "Dataran Amazonis",
      "argyre-planitia": "Dataran Argyre",
      "gale-crater": "Kawah Gale",
      "jezero-crater": "Kawah Jezero",
    },
  },
  thai: {
    moon: {
      "mare-imbrium": "ทะเลแห่งฝน",
      "oceanus-procellarum": "มหาสมุทรพายุ",
      "mare-tranquillitatis": "ทะเลแห่งความสงบ",
      "mare-serenitatis": "ทะเลเซเรนิตาติส",
      "mare-crisium": "ทะเลคริเซียม",
      "mare-australe": "ทะเลใต้",
      "mare-orientale": "ทะเลตะวันออก",
    },
    mars: {
      "olympus-mons": "ภูเขาโอลิมปัส",
      "valles-marineris": "หุบเขามารีเนอริส",
      "hellas-planitia": "ที่ราบเฮลลัส",
      "utopia-planitia": "ที่ราบยูโทเปีย",
      "elysium-mons": "ภูเขาเอลิเซียม",
      "arsia-mons": "ภูเขาอาร์เซีย",
      "ascraeus-mons": "ภูเขาแอสเครอัส",
      "pavonis-mons": "ภูเขาพาโวนิส",
      "isidis-planitia": "ที่ราบอิซิดิส",
      "amazonis-planitia": "ที่ราบแอมะโซนิส",
      "argyre-planitia": "ที่ราบอาร์ไจร์",
    },
  },
  vietnamese: {
    moon: {
      "mare-imbrium": "Biển Mưa",
      "oceanus-procellarum": "Đại dương Bão Tố",
      "mare-tranquillitatis": "Biển Tĩnh Lặng",
      "mare-serenitatis": "Biển Thanh Bình",
      "mare-crisium": "Biển Khủng Hoảng",
    },
    mars: {
      "olympus-mons": "Núi Olympus",
      "valles-marineris": "Thung lũng Mariner",
      "hellas-planitia": "Đồng bằng Hellas",
      "utopia-planitia": "Đồng bằng Utopia",
      "arsia-mons": "Núi Arsia",
      "ascraeus-mons": "Núi Ascraeus",
      "pavonis-mons": "Núi Pavonis",
      "isidis-planitia": "Đồng bằng Isidis",
      "meridiani-planum": "Cao nguyên Meridiani",
      "amazonis-planitia": "Đồng bằng Amazonis",
      "gale-crater": "Hố va chạm Gale",
      "jezero-crater": "Hố va chạm Jezero",
    },
  },
  hindi: {
    moon: {
      "mare-imbrium": "वर्षा सागर",
      "oceanus-procellarum": "तूफान महासागर",
      "mare-tranquillitatis": "शांति सागर",
      "mare-serenitatis": "निर्मल सागर",
      "mare-crisium": "क्रिसियम सागर",
    },
    mars: {
      "olympus-mons": "ओलिम्पस पर्वत",
      "valles-marineris": "मैरिनर घाटी",
      "hellas-planitia": "हेलस मैदान",
      "utopia-planitia": "यूटोपिया मैदान",
      "arsia-mons": "अर्सिया पर्वत",
      "ascraeus-mons": "अस्क्रेअस पर्वत",
      "pavonis-mons": "पावोनिस पर्वत",
      "isidis-planitia": "इसिडिस मैदान",
      "amazonis-planitia": "अमेज़ोनिस मैदान",
    },
  },
  arabic: {
    moon: {
      "mare-imbrium": "بحر الأمطار",
      "oceanus-procellarum": "محيط العواصف",
      "mare-tranquillitatis": "بحر السكون",
      "mare-serenitatis": "بحر الصفاء",
      "mare-crisium": "بحر الأزمات",
    },
    mars: {
      "olympus-mons": "جبل أوليمبوس",
      "valles-marineris": "وادي مارينر",
      "hellas-planitia": "سهل هيلاس",
      "utopia-planitia": "سهل يوتوبيا",
      "arsia-mons": "جبل أرسيا",
      "ascraeus-mons": "جبل أسكرايوس",
      "pavonis-mons": "جبل بافونيس",
      "isidis-planitia": "سهل إيزيديس",
      "gale-crater": "فوهة غيل",
      "jezero-crater": "فوهة جيزيرو",
    },
  },
  russian: {
    moon: {
      "mare-imbrium": "Море Дождей",
      "oceanus-procellarum": "Океан Бурь",
      "mare-tranquillitatis": "Море Спокойствия",
      "mare-serenitatis": "Море Ясности",
      "mare-crisium": "Море Кризисов",
    },
    mars: {
      "olympus-mons": "гора Олимп",
      "valles-marineris": "долины Маринера",
      "hellas-planitia": "равнина Эллада",
      "utopia-planitia": "равнина Утопия",
      "elysium-mons": "гора Элизий",
      "arsia-mons": "гора Арсия",
      "ascraeus-mons": "гора Аскрийская",
      "pavonis-mons": "гора Павлина",
      "amazonis-planitia": "равнина Амазония",
      "gale-crater": "кратер Гейла",
      "jezero-crater": "кратер Езеро",
    },
  },
};

const getDatasetPath = (body, level, language) => {
  const suffix = language === "english" ? "" : `-${language}`;
  return `packages/geoint/region-dist/region-${level}-${body}${suffix}.json`;
};

const baseNameIndexCache = new Map();

const getNameIndexes = (body, level) => {
  const key = `${body}:${level}`;
  if (baseNameIndexCache.has(key)) return baseNameIndexCache.get(key);

  const namesByIndex = extractNamesAtIndexes(
    getDatasetPath(body, level, "english"),
    null,
  );
  const indexes = new Map();
  namesByIndex.forEach((name, index) => indexes.set(name, index));
  baseNameIndexCache.set(key, indexes);
  return indexes;
};

const extractNamesAtIndexes = (relativePath, targetIndexes) => {
  const text = readText(relativePath);
  const names = [];
  const remaining =
    targetIndexes === null
      ? null
      : new Set([...targetIndexes].sort((a, b) => a - b));
  const pattern = /"name":\s*"((?:\\.|[^"\\])*)"/g;
  let index = 0;
  let match;

  while ((match = pattern.exec(text))) {
    if (remaining === null || remaining.has(index)) {
      names[index] = JSON.parse(`"${match[1]}"`);
      remaining?.delete(index);
      if (remaining?.size === 0) break;
    }
    index += 1;
  }

  if (remaining?.size) {
    throw new Error(
      `Missing indexes ${[...remaining].join(", ")} in ${relativePath}`,
    );
  }

  return names;
};

const getBaseIndex = (body, level, matchName) => {
  const index = getNameIndexes(body, level).get(matchName);
  if (index === undefined) {
    throw new Error(
      `Missing base planetary label ${body}:${level}:${matchName}`,
    );
  }
  return index;
};

const translations = {};

for (const language of languages) {
  const bodyTranslations = {};

  for (const [body, bodyTargets] of Object.entries(targets)) {
    const labels = {};
    const targetsByLevel = new Map();
    for (const target of bodyTargets) {
      const levelTargets = targetsByLevel.get(target.level) ?? [];
      levelTargets.push(target);
      targetsByLevel.set(target.level, levelTargets);
    }

    for (const [level, levelTargets] of targetsByLevel) {
      const indexedTargets = levelTargets.map((target) => ({
        ...target,
        index: getBaseIndex(body, target.level, target.matchName),
      }));
      const datasetPath = getDatasetPath(body, level, language);
      if (!existsSync(join(root, datasetPath))) continue;
      const localizedNames = extractNamesAtIndexes(
        datasetPath,
        indexedTargets.map((target) => target.index),
      );

      for (const target of indexedTargets) {
        const localizedName = localizedNames[target.index];
        if (!localizedName) {
          throw new Error(
            `Missing localized label ${language}:${body}:${target.id}`,
          );
        }
        labels[target.id] = target.normalize
          ? target.normalize(localizedName)
          : localizedName;
      }
    }

    for (const target of bodyTargets) {
      const localizedName = labels[target.id];
      if (!localizedName) {
        throw new Error(
          `Missing localized label ${language}:${body}:${target.id}`,
        );
      }
    }

    Object.assign(
      labels,
      manualLabelOverrides[language]?.[body],
      missionFallbacks[language]?.[body],
    );
    bodyTranslations[body] = labels;
  }

  translations[language] = bodyTranslations;
}

const header = `// Generated by scripts/generate-planetary-landmark-labels.mjs.\n`;
const body = `export const PLANETARY_LANDMARK_LOCALIZED_LABELS: Record<
  string,
  { moon?: Record<string, string>; mars?: Record<string, string> }
> = ${JSON.stringify(translations, null, 2)};\n`;

writeFileSync(
  join(root, "apps/web/lib/map/planetary-landmark-labels.ts"),
  `${header}${body}`,
);
