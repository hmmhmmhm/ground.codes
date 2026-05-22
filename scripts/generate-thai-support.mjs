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

const thaiScriptPattern = /^[\p{Script=Thai}]+$/u;

const normalizeThaiWord = (value) =>
  String(value)
    .replace(/[\s\-/#?]/g, "")
    .trim();

const characterLength = (value) => [...String(value)].length;

const standaloneWords = [
  "น้ำ",
  "ไฟ",
  "ลม",
  "ดิน",
  "หิน",
  "ไม้",
  "ใบไม้",
  "ดอกไม้",
  "สวน",
  "บ้าน",
  "เรือน",
  "ข้าว",
  "ปลา",
  "นก",
  "แมว",
  "ม้า",
  "ช้าง",
  "กวาง",
  "ผึ้ง",
  "ผ้า",
  "ไหม",
  "ผ้าไหม",
  "เหล็ก",
  "แก้ว",
  "เงิน",
  "ทอง",
  "เมฆ",
  "ฝน",
  "ดาว",
  "จันทร์",
  "แดด",
  "ทะเล",
  "ภูเขา",
  "แม่น้ำ",
  "คลอง",
  "เกาะ",
  "ป่า",
  "หญ้า",
  "ไผ่",
  "สน",
  "บัว",
  "มะลิ",
  "กุหลาบ",
  "มะม่วง",
  "มะพร้าว",
  "กล้วย",
  "ส้ม",
  "ขนม",
  "น้ำตาล",
  "เกลือ",
  "พริก",
  "ขิง",
  "กระเทียม",
  "ตะกร้า",
  "จาน",
  "ชาม",
  "ถ้วย",
  "หม้อ",
  "กระทะ",
  "มีด",
  "ช้อน",
  "โต๊ะ",
  "เก้าอี้",
  "โคมไฟ",
  "หนังสือ",
  "ดินสอ",
  "กระดาษ",
  "เชือก",
  "ประตู",
  "หน้าต่าง",
  "สะพาน",
  "ถนน",
  "ตลาด",
  "ศาลา",
  "โรงเรียน",
  "รถไฟ",
  "เรือ",
  "รถ",
  "จักรยาน",
  "หมวก",
  "รองเท้า",
  "กระเป๋า",
  "ร่ม",
  "พัด",
  "เสื่อ",
  "ผ้าห่ม",
  "หมอน",
  "เตียง",
  "ตู้",
  "ตะเกียง",
  "เทียน",
  "สบู่",
  "หวี",
  "เข็ม",
  "ด้าย",
  "กระดิ่ง",
  "กลอง",
  "ขลุ่ย",
  "ว่าว",
  "ลูกบอล",
  "ตุ๊กตา",
  "ภาพ",
  "สี",
  "แปรง",
  "ขวด",
  "ไห",
  "โอ่ง",
  "ถัง",
  "กระปุก",
  "กล่อง",
  "ตลับ",
  "พาน",
  "ถาด",
  "พรม",
  "อิฐ",
  "ทราย",
  "ปูน",
  "หลังคา",
  "รั้ว",
  "ลาน",
  "ทุ่ง",
  "นา",
  "ไร่",
  "บึง",
  "หนอง",
  "น้ำตก",
  "เนิน",
  "ถ้ำ",
  "ฟ้า",
  "หมอก",
  "สายรุ้ง",
  "เมล็ด",
  "ราก",
  "กิ่ง",
  "ลำต้น",
  "ผลไม้",
  "แตงโม",
  "แตงกวา",
  "ฟักทอง",
  "มะเขือ",
  "มะนาว",
  "มะขาม",
  "ลำไย",
  "ลิ้นจี่",
  "ทุเรียน",
  "ข้าวโพด",
  "ถั่ว",
  "งา",
  "ชา",
  "กาแฟ",
  "นม",
  "น้ำผึ้ง",
  "ขนมปัง",
  "เส้นหมี่",
  "เต้าหู้",
  "มะกรูด",
  "ตะไคร้",
  "โหระพา",
  "กะเพรา",
  "ใบเตย",
  "ขมิ้น",
  "ถั่วงอก",
  "มด",
  "ผีเสื้อ",
  "จิ้งหรีด",
  "เต่า",
  "กระต่าย",
  "ควาย",
  "วัว",
  "แพะ",
  "ไก่",
  "เป็ด",
  "ห่าน",
  "กุ้ง",
  "ปู",
  "หอย",
  "หมึก",
  "ไข่",
  "ขนนก",
  "เปลือก",
  "เกวียน",
  "ครก",
  "สาก",
  "กระด้ง",
  "กระบุง",
  "เข่ง",
  "ตะแกรง",
  "ตะหลิว",
  "เขียง",
  "เตา",
  "เต็นท์",
  "แผนที่",
  "เข็มทิศ",
  "นาฬิกา",
  "ป้าย",
  "ตรา",
  "ลูกปัด",
  "กำไล",
  "สร้อย",
  "แหวน",
  "จี้",
  "ปิ่น",
  "ผ้าซิ่น",
  "โสร่ง",
  "ฝ้าย",
  "ป่าน",
  "หวาย",
  "ยาง",
  "ขี้ผึ้ง",
  "หยก",
  "มุก",
  "ทับทิม",
  "พลอย",
  "กระจก",
  "หินอ่อน",
  "ทองแดง",
  "ดีบุก",
  "สังกะสี",
  "เรซิน",
  "กระเบื้อง",
];

const prefixes = [
  "น้ำ",
  "ไฟ",
  "ลม",
  "ดิน",
  "หิน",
  "ไม้",
  "ใบไม้",
  "ดอกไม้",
  "สวน",
  "บ้าน",
  "ข้าว",
  "ปลา",
  "นก",
  "แมว",
  "ม้า",
  "ช้าง",
  "ผ้า",
  "ไหม",
  "เหล็ก",
  "แก้ว",
  "เงิน",
  "ทอง",
  "เมฆ",
  "ฝน",
  "ดาว",
  "จันทร์",
  "แดด",
  "ทะเล",
  "ภูเขา",
  "แม่น้ำ",
  "คลอง",
  "เกาะ",
  "ป่า",
  "หญ้า",
  "ไผ่",
  "สน",
  "บัว",
  "มะลิ",
  "มะม่วง",
  "มะพร้าว",
  "กล้วย",
  "ส้ม",
  "ขนม",
  "น้ำตาล",
  "เกลือ",
  "พริก",
  "ขิง",
  "ตะกร้า",
  "จาน",
  "ชาม",
  "ถ้วย",
  "หม้อ",
  "กระทะ",
  "ช้อน",
  "โต๊ะ",
  "โคมไฟ",
  "หนังสือ",
  "เชือก",
  "ประตู",
  "สะพาน",
  "ถนน",
  "ตลาด",
  "รถไฟ",
  "เรือ",
  "จักรยาน",
  "หมวก",
  "ร่ม",
  "พัด",
  "เสื่อ",
  "หมอน",
  "เตียง",
  "ตู้",
  "เทียน",
  "เข็ม",
  "ด้าย",
  "กลอง",
  "ว่าว",
  "ภาพ",
  "สี",
  "ขวด",
  "ไห",
  "โอ่ง",
  "กล่อง",
  "ถาด",
  "พรม",
  "อิฐ",
  "ทราย",
  "หลังคา",
  "รั้ว",
  "ลาน",
  "ทุ่ง",
  "นา",
  "บึง",
  "น้ำตก",
  "ฟ้า",
  "หมอก",
  "ราก",
  "กิ่ง",
  "แตงโม",
  "ฟักทอง",
  "มะนาว",
  "มะขาม",
  "ข้าวโพด",
  "ถั่ว",
  "ชา",
  "กาแฟ",
  "นม",
  "เต้าหู้",
  "ตะไคร้",
  "ใบเตย",
  "มด",
  "เต่า",
  "กระต่าย",
  "ควาย",
  "วัว",
  "ไก่",
  "เป็ด",
  "กุ้ง",
  "ปู",
  "หอย",
  "ไข่",
  "ครก",
  "สาก",
  "เข่ง",
  "เตา",
  "ป้าย",
  "มุก",
  "หยก",
  "พลอย",
  "หวาย",
];

const naturalSuffixes = [
  "ใส",
  "ดี",
  "งาม",
  "นุ่ม",
  "หอม",
  "หวาน",
  "สด",
  "ใหม่",
  "เล็ก",
  "ใหญ่",
  "สูง",
  "ต่ำ",
  "กลม",
  "แบน",
  "เบา",
  "หนัก",
  "เขียว",
  "แดง",
  "ขาว",
  "ดำ",
  "ฟ้า",
  "ทอง",
  "เงิน",
  "แก้ว",
  "ไม้",
  "หิน",
  "ดิน",
  "ทราย",
  "ลาย",
  "ร่ม",
  "รื่น",
  "สวย",
  "อุ่น",
  "เย็น",
  "กว้าง",
  "แคบ",
  "ยาว",
  "สั้น",
  "หนา",
  "บาง",
  "เรียบ",
  "เงา",
  "แห้ง",
  "ชุ่ม",
  "นิ่ง",
  "ไหล",
  "สุก",
  "อ่อน",
  "แก่",
  "เรียว",
  "หอมหวาน",
  "สดใส",
  "เรียบงาม",
];

const objectSuffixes = [
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
  "มะลิ",
  "กล้วย",
  "ส้ม",
  "ขนม",
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
];

const blockedCodebookWords = new Set([
  "พนัน",
  "ยาเสพติด",
  "อาวุธ",
  "การเมือง",
  "ศาสนา",
  "หนี้",
  "ป่วย",
  "ตาย",
  "เกลียด",
  "โกง",
  "หลอก",
  "แพ้",
  "ผิด",
]);

const buildThaiCodebook = () => {
  const words = [];
  const seen = new Set();

  const add = (word) => {
    const candidate = normalizeThaiWord(word);
    if (!candidate) return;
    if (!thaiScriptPattern.test(candidate)) return;
    if (characterLength(candidate) > 12) return;
    if (blockedCodebookWords.has(candidate)) return;
    if (seen.has(candidate)) return;
    seen.add(candidate);
    words.push(candidate);
  };

  for (const word of standaloneWords) add(word);

  for (const suffix of naturalSuffixes) {
    for (const prefix of prefixes) {
      add(`${prefix}${suffix}`);
      if (words.length >= 5000) break;
    }
    if (words.length >= 5000) break;
  }

  for (const suffix of objectSuffixes) {
    for (const prefix of prefixes) {
      if (prefix === suffix) continue;
      add(`${prefix}${suffix}`);
      if (words.length >= 5000) break;
    }
    if (words.length >= 5000) break;
  }

  if (words.length < 5000) {
    throw new Error(`Thai codebook generated ${words.length} words`);
  }

  return words.slice(0, 5000);
};

const knownNameTranslations = new Map(
  Object.entries({
    Bangkok: "กรุงเทพมหานคร",
    Seoul: "โซล",
    "Chiang Mai": "เชียงใหม่",
    Phuket: "ภูเก็ต",
    Pattaya: "พัทยา",
    "Nakhon Ratchasima": "นครราชสีมา",
    "Udon Thani": "อุดรธานี",
    "Hat Yai": "หาดใหญ่",
    Ross: "รอสส์",
    Weddell: "เวดเดลล์",
    Scotia: "สโกเชีย",
    Amundsen: "อะมุนด์เซน",
    Bellingshausen: "เบลลิงส์เฮาเซน",
    Tranquillitatis: "ความสงบ",
    Serenitatis: "ความสงบใส",
    Imbrium: "ฝน",
    Crisium: "วิกฤต",
    Nectaris: "น้ำหวาน",
    Nubium: "เมฆ",
    Humorum: "ความชื้น",
    Frigoris: "ความหนาว",
    Procellarum: "พายุ",
    Iridum: "สายรุ้ง",
    Somniorum: "ความฝัน",
    Olympus: "โอลิมปัส",
    Elysium: "เอลิเซียม",
    Ascraeus: "แอสเครอัส",
    Arsia: "อาร์เซีย",
    Pavonis: "พาโวนิส",
    Marineris: "มารีเนอริส",
    Hellas: "เฮลลัส",
    Utopia: "ยูโทเปีย",
    Amazonis: "แอมะโซนิส",
    Isidis: "อิซิดิส",
    Argyre: "อาร์ไจร์",
    Borealis: "โบเรอาลิส",
    Hypatia: "ฮิปาเทีย",
    Bohar: "โบฮาร์",
  }),
);

const letterToThai = new Map(
  Object.entries({
    a: "อา",
    b: "บ",
    c: "ค",
    d: "ด",
    e: "เอ",
    f: "ฟ",
    g: "ก",
    h: "ฮ",
    i: "อิ",
    j: "จ",
    k: "ค",
    l: "ล",
    m: "ม",
    n: "น",
    o: "โอ",
    p: "พ",
    q: "ค",
    r: "ร",
    s: "ส",
    t: "ท",
    u: "อุ",
    v: "ว",
    w: "ว",
    x: "ซ",
    y: "ย",
    z: "ซ",
  }),
);

const normalizeLatin = (value) =>
  String(value)
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[’']/g, "")
    .replace(/[-/#?]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const transliterateLatinToken = (token) => {
  if (!token) return "";
  if (/^\d+$/.test(token)) return token;
  if (knownNameTranslations.has(token)) return knownNameTranslations.get(token);

  const lower = token.toLowerCase();
  let output = "";
  for (const character of lower) {
    output += letterToThai.get(character) ?? "";
  }
  return output || "เขต";
};

const transliterateLatinPhrase = (phrase) =>
  normalizeLatin(phrase)
    .split(" ")
    .filter(Boolean)
    .map(transliterateLatinToken)
    .join("");

const transliterateLatinPhraseWithNumericSuffix = (phrase) => {
  const normalized = normalizeLatin(phrase);
  const numbered = normalized.match(/^(.+) (\d+)$/);
  if (!numbered) return transliterateLatinPhrase(normalized);

  const [, base, index] = numbered;
  return `${transliterateLatinPhrase(base)} ${index}`;
};

const earthNameOverridesByCode = new Map(
  Object.entries({
    1609350: "กรุงเทพมหานคร",
    1835848: "โซล",
    1153671: "เชียงใหม่",
    1151254: "ภูเก็ต",
    1614295: "พัทยา",
    1608529: "นครราชสีมา",
    1605239: "อุดรธานี",
    1610780: "หาดใหญ่",
  }),
);

const translateEarthRegionName = (row) => {
  const override = earthNameOverridesByCode.get(String(row.code));
  if (override) return override;
  if (knownNameTranslations.has(row.name))
    return knownNameTranslations.get(row.name);
  return transliterateLatinPhrase(row.name);
};

const marineTerms = new Map([
  ["Sea", "ทะเล"],
  ["Ocean", "มหาสมุทร"],
  ["Bay", "อ่าว"],
  ["Gulf", "อ่าว"],
  ["Channel", "ช่องแคบ"],
  ["Strait", "ช่องแคบ"],
  ["Sound", "ช่องแคบ"],
  ["Basin", "แอ่ง"],
  ["Ridge", "สันเขา"],
  ["Plateau", "ที่ราบสูง"],
  ["Rise", "เนิน"],
  ["Trench", "ร่องลึก"],
  ["Bank", "สันดอน"],
]);

const limitName = (name, maxLength = 20) => {
  if (characterLength(name) <= maxLength) return name;
  const numbered = name.match(/^(.+) (\d+)$/);
  if (!numbered) return [...name].slice(0, maxLength).join("").trim();

  const [, base, index] = numbered;
  const maxBaseLength = maxLength - index.length - 1;
  return `${[...base].slice(0, maxBaseLength).join("").trim()} ${index}`;
};

const translateRegion3Name = (row) => {
  let name = normalizeLatin(row.name);

  if (name === "Antarctic Continent") {
    return "แอนตาร์กติกา";
  }

  if (row.source === "natural-earth-marine") {
    const marineGridMatch = name.match(
      /^(.+) (Sea|Ocean|Bay|Gulf|Channel|Strait|Sound|Basin|Ridge|Plateau|Rise|Trench|Bank) (\d+)$/,
    );
    if (marineGridMatch) {
      const [, base, term, index] = marineGridMatch;
      const translatedBase = transliterateLatinPhrase(base);
      return limitName(
        `${marineTerms.get(term) ?? "ทะเล"}${translatedBase} ${index}`,
      );
    }
  }

  name = name
    .replace(/^Antarctic /, "แอนตาร์กติก ")
    .replace(/^Arctic /, "อาร์กติก ")
    .replace(/^Sahara /, "ซาฮารา ")
    .replace(/^Greenland /, "กรีนแลนด์ ")
    .replace(/^Desert /, "ทะเลทราย ")
    .replace(/^Forest /, "ป่า ")
    .replace(/^Island /, "เกาะ ")
    .replace(/^Lake /, "ทะเลสาบ ")
    .replace(/^Mount /, "ภูเขา ")
    .replace(/^River /, "แม่น้ำ ")
    .replace(/^Valley /, "หุบเขา ");

  return limitName(transliterateLatinPhraseWithNumericSuffix(name));
};

const planetaryPhraseOverrides = new Map([
  ["Mare Tranquillitatis", "ทะเลแห่งความสงบ"],
  ["Mare Serenitatis", "ทะเลเซเรนิตาติส"],
  ["Mare Imbrium", "ทะเลแห่งฝน"],
  ["Mare Crisium", "ทะเลคริเซียม"],
  ["Mare Nectaris", "ทะเลเนกตาร์"],
  ["Mare Nubium", "ทะเลเมฆ"],
  ["Mare Humorum", "ทะเลความชื้น"],
  ["Mare Frigoris", "ทะเลความหนาว"],
  ["Mare Orientale", "ทะเลตะวันออก"],
  ["Mare Australe", "ทะเลใต้"],
  ["Oceanus Procellarum", "มหาสมุทรพายุ"],
  ["Sinus Iridum", "อ่าวสายรุ้ง"],
  ["Lacus Somniorum", "ทะเลสาบความฝัน"],
  ["Olympus Mons", "ภูเขาโอลิมปัส"],
  ["Elysium Mons", "ภูเขาเอลิเซียม"],
  ["Ascraeus Mons", "ภูเขาแอสเครอัส"],
  ["Arsia Mons", "ภูเขาอาร์เซีย"],
  ["Pavonis Mons", "ภูเขาพาโวนิส"],
  ["Valles Marineris", "หุบเขามารีเนอริส"],
  ["Hellas Planitia", "ที่ราบเฮลลัส"],
  ["Utopia Planitia", "ที่ราบยูโทเปีย"],
  ["Amazonis Planitia", "ที่ราบแอมะโซนิส"],
  ["Isidis Planitia", "ที่ราบอิซิดิส"],
  ["Argyre Planitia", "ที่ราบอาร์ไจร์"],
  ["Borealis Planitia", "ที่ราบเหนือ"],
]);

const planetaryLeadingTerms = [
  ["Mare", "ทะเล"],
  ["Maria", "ทะเล"],
  ["Oceanus", "มหาสมุทร"],
  ["Sinus", "อ่าว"],
  ["Lacus", "ทะเลสาบ"],
  ["Palus", "บึง"],
  ["Mons", "ภูเขา"],
  ["Montes", "ภูเขา"],
  ["Vallis", "หุบเขา"],
  ["Valles", "หุบเขา"],
  ["Rima", "ร่อง"],
  ["Rimae", "ร่อง"],
  ["Rupes", "หน้าผา"],
  ["Dorsum", "สันเขา"],
  ["Dorsa", "สันเขา"],
  ["Planitia", "ที่ราบ"],
  ["Planum", "ที่ราบสูง"],
  ["Terra", "ดินแดน"],
  ["Chaos", "คาออส"],
  ["Chasma", "หุบเหว"],
  ["Chasmata", "หุบเหว"],
  ["Vastitas", "ที่ราบ"],
  ["Fossa", "ร่องลึก"],
  ["Fossae", "ร่องลึก"],
  ["Patera", "แอ่ง"],
  ["Scopulus", "หน้าผา"],
  ["Scopuli", "หน้าผา"],
  ["Sulcus", "ร่อง"],
  ["Sulci", "ร่อง"],
  ["Tholus", "โดม"],
  ["Tholi", "โดม"],
  ["Undae", "เนินทราย"],
];

const translatePlanetaryName = (name) => {
  const normalized = normalizeLatin(name);
  if (planetaryPhraseOverrides.has(normalized)) {
    return planetaryPhraseOverrides.get(normalized);
  }

  const craterMatch = normalized.match(/^(.+) Crater( \d+)?$/);
  if (craterMatch) {
    const [, base, index = ""] = craterMatch;
    return `หลุมอุกกาบาต${transliterateLatinPhrase(base)}${index}`;
  }

  for (const [latinTerm, thaiTerm] of planetaryLeadingTerms) {
    if (normalized.startsWith(`${latinTerm} `)) {
      return `${thaiTerm}${transliterateLatinPhrase(normalized.slice(latinTerm.length + 1))}`;
    }
  }

  for (const [latinTerm, thaiTerm] of planetaryLeadingTerms) {
    if (normalized.endsWith(` ${latinTerm}`)) {
      return `${thaiTerm}${transliterateLatinPhrase(normalized.slice(0, -latinTerm.length - 1))}`;
    }
  }

  return transliterateLatinPhrase(normalized);
};

const dedupeNames = (rows) => {
  const seen = new Set();
  return rows.map((row) => {
    const baseName = row.name;
    let name = baseName;
    let count = 2;
    while (seen.has(name.toLowerCase())) {
      const suffix = ` ${count}`;
      name = `${[...baseName]
        .slice(0, 20 - suffix.length)
        .join("")
        .trim()}${suffix}`;
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
      name = `${[...baseName]
        .slice(0, 20 - suffix.length)
        .join("")
        .trim()}${suffix}`;
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

writeJson("packages/codebook/codebook-dist/thai.json", buildThaiCodebook());

if (mode === "all") {
  buildLocalizedRows(
    "packages/geoint/region-dist/region-2.json",
    "packages/geoint/region-dist/region-2-thai.json",
    translateEarthRegionName,
  );
  buildLocalizedRows(
    "packages/geoint/region-dist/region-3.json",
    "packages/geoint/region-dist/region-3-thai.json",
    translateRegion3Name,
  );
  avoidNamedGapLookupCollisions(
    "packages/geoint/region-dist/region-3-thai.json",
    [
      "packages/geoint/region-dist/region-1.json",
      "packages/geoint/region-dist/region-2-thai.json",
    ],
  );
  buildLocalizedRows(
    "packages/geoint/region-dist/region-2-moon.json",
    "packages/geoint/region-dist/region-2-moon-thai.json",
    (row) => translatePlanetaryName(row.name),
  );
  buildLocalizedRows(
    "packages/geoint/region-dist/region-2-mars.json",
    "packages/geoint/region-dist/region-2-mars-thai.json",
    (row) => translatePlanetaryName(row.name),
  );
  buildLocalizedRows(
    "packages/geoint/region-dist/region-3-mars.json",
    "packages/geoint/region-dist/region-3-mars-thai.json",
    (row) => translatePlanetaryName(row.name),
  );

  for (const regionName of [
    "region-2-thai",
    "region-3-thai",
    "region-2-moon-thai",
    "region-2-mars-thai",
    "region-3-mars-thai",
  ]) {
    await buildEmbeddedRegionDb(regionName);
  }
}
