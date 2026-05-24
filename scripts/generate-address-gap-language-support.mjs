import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
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

const commonLatinPattern = /^[A-Z][a-z]+$/u;
const scriptPatterns = {
  bengali: /^[\p{Script=Bengali}\p{Mark}]+$/u,
  urdu: /^[\p{Script=Arabic}\p{Mark}]+$/u,
  amharic: /^[\p{Script=Ethiopic}\p{Mark}]+$/u,
};

const titleAscii = (value) => {
  const compact = String(value)
    .normalize("NFD")
    .replace(/\p{Mark}/gu, "")
    .replace(/[^A-Za-z]/g, "")
    .toLowerCase();
  if (!compact) return "";
  return `${compact[0].toUpperCase()}${compact.slice(1)}`;
};

const compactScript = (value) =>
  String(value)
    .normalize("NFC")
    .replace(/[\s’'`´/#?\-.,،]/g, "")
    .trim();

const baseWords = {
  swahili: [
    "maji","nyumba","mto","mlima","ua","chai","kitabu","taa","mkate","wali","tufaha","ndizi","tende","zaituni","mti","soko","njia","daraja","bustani","shamba","jani","udongo","jiwe","mchanga","ziwa","bwawa","bahari","pwani","mashua","treni","basi","gari","uwanja","kikombe","bakuli","kijiko","kalamu","rangi","wingu","jua","mwezi","nyota","hewa","mvua","kitambaa","kiti","meza","sanduku","kikapu","kamba","mkeka","pazia","chungu","paa","ukuta","ngazi","mtaa","jiji","kijiji","duka","tangawizi","mnanaa","mrehani","yasmini","ngano","dengu","viazi","nyanya","karoti","tango","maziwa","jibini","asali","lozi","komamanga","zabibu","limau","chungwa","tikiti","mdalasini","upepo","umande","kivuli","mwanga","asubuhi","jioni","masika","kiangazi","vuli","baridi","bonde","msitu","kisiwa","bandari","mnara","lango","dirisha","mlango","ufunguo","ramani","barua","picha","daftari","maktaba","shule","makumbusho","mkahawa","mgahawa","fundi","mbao","pamba","hariri","fedha","shaba","dhahabu","kioo","kuni","marumaru",
  ],
  filipino: [
    "tubig","bahay","ilog","bundok","bulaklak","tsaa","aklat","ilaw","tinapay","kanin","mansanas","saging","datiles","olibo","puno","palengke","daan","tulay","hardin","bukid","dahon","lupa","bato","buhangin","lawa","dagat","baybayin","bangka","tren","bus","kotse","plaza","tasa","mangkok","kutsara","tinidor","lapis","kulay","ulap","araw","buwan","bituin","hangin","ulan","tela","upuan","mesa","kahon","basket","lubid","banig","kurtina","palayok","bubong","pader","hagdan","pasilyo","lungsod","nayon","tindahan","luya","pudina","balanoy","sampaguita","trigo","monggo","patatas","kamatis","karot","pipino","gatas","keso","pulot","matamis","almendras","ubas","limon","dalandan","pakwan","kanela","simoy","hamog","lilim","liwanag","umaga","gabi","tagsibol","taginit","taglagas","taglamig","lambak","gubat","isla","daungan","parola","tarangkahan","bintana","pinto","susi","mapa","liham","larawan","kuwaderno","paaralan","museo","kapihan","panaderya","restawran","kahoy","bulak","seda","pilak","tanso","ginto","salamin",
  ],
  hausa: [
    "ruwa","gida","kogi","tsauni","fure","shayi","littafi","fitila","burodi","shinkafa","tuffa","ayaba","dabino","zaitun","itace","kasuwa","hanya","gada","lambu","gona","ganye","kasa","dutse","yashi","tabki","tafki","teku","gaci","jirgi","mota","bas","filin","kofi","kwano","cokali","alkalami","launi","gajimare","rana","wata","tauraro","iska","ruwansama","zane","kujera","tebur","akwati","kwando","igiya","tabarma","labule","tukunya","rufi","bango","matakala","unguwa","birni","kauye","shago","citta","naanaa","albasa","alkama","wake","dankali","tumatir","karas","kokwamba","madara","cuku","zuma","alewa","gyada","rumman","inabi","lemo","kankana","kirfa","inuwa","haske","safiya","yamma","bazara","damina","sanyi","kwari","daji","tsibiri","tasha","hasumiya","kofa","taga","mabudi","taswira","wasika","hoto","kundin","makaranta","gidanlabari","kafe","biredi","abinci","katako","auduga","siliki","azurfa","tagulla","zinariya","gilashi","laka",
  ],
  bengali: [
    "জল","বাড়ি","নদী","পাহাড়","ফুল","চা","বই","বাতি","রুটি","ভাত","আপেল","কলা","খেজুর","জলপাই","গাছ","বাজার","পথ","সেতু","বাগান","মাঠ","পাতা","মাটি","পাথর","বালি","হ্রদ","পুকুর","সমুদ্র","তীর","নৌকা","ট্রেন","বাস","গাড়ি","চত্বর","কাপ","বাটি","চামচ","কলম","রং","মেঘ","সূর্য","চাঁদ","তারা","বাতাস","বৃষ্টি","কাপড়","চেয়ার","টেবিল","বাক্স","ঝুড়ি","দড়ি","মাদুর","পর্দা","হাঁড়ি","ছাদ","দেয়াল","সিঁড়ি","পাড়া","শহর","গ্রাম","দোকান","আদা","পুদিনা","তুলসি","জুঁই","গম","ডাল","আলু","টমেটো","গাজর","শসা","দুধ","পনির","মধু","মিষ্টি","বাদাম","ডালিম","আঙুর","লেবু","কমলা","তরমুজ","দারুচিনি","ছায়া","আলো","সকাল","সন্ধ্যা","বসন্ত","গ্রীষ্ম","শরৎ","শীত","উপত্যকা","বন","দ্বীপ","বন্দর","মিনার","ফটক","জানালা","দরজা","চাবি","মানচিত্র","চিঠি","ছবি","খাতা","স্কুল","জাদুঘর","ক্যাফে","বেকারি","রেস্তোরাঁ","কাঠ","তুলা","রেশম","রূপা","তামা","সোনা","কাচ",
  ],
  urdu: [
    "پانی","گھر","دریا","پہاڑ","پھول","چائے","کتاب","چراغ","روٹی","چاول","سیب","کیلا","کھجور","زیتون","درخت","بازار","راستہ","پل","باغ","کھیت","پتا","مٹی","پتھر","ریت","جھیل","تالاب","سمندر","ساحل","کشتی","ریل","بس","گاڑی","میدان","کپ","پیالہ","چمچ","قلم","رنگ","بادل","سورج","چاند","ستارہ","ہوا","بارش","کپڑا","کرسی","میز","صندوق","ٹوکری","رسی","چٹائی","پردہ","دیگ","چھت","دیوار","سیڑھی","محلہ","شہر","گاؤں","دکان","ادرک","پودینہ","تلسی","چنبیلی","گندم","دال","آلو","ٹماٹر","گاجر","کھیرا","دودھ","پنیر","شہد","مٹھائی","بادام","انار","انگور","لیموں","مالٹا","تربوز","دارچینی","سایہ","روشنی","صبح","شام","بہار","گرمی","خزاں","سردی","وادی","جنگل","جزیرہ","بندرگاہ","مینار","دروازہ","کھڑکی","چابی","نقشہ","خط","تصویر","کاپی","مدرسہ","عجائبگھر","قہوہ","بیکری","ریسٹورنٹ","لکڑی","روئی","ریشم","چاندی","تانبا","سونا","شیشہ",
  ],
  amharic: [
    "ውሃ","ቤት","ወንዝ","ተራራ","አበባ","ሻይ","መጽሐፍ","መብራት","ዳቦ","ሩዝ","ፖም","ሙዝ","ቴምር","ወይራ","ዛፍ","ገበያ","መንገድ","ድልድይ","መናፈሻ","ሜዳ","ቅጠል","አፈር","ድንጋይ","አሸዋ","ሐይቅ","ኩሬ","ባሕር","ዳርቻ","ጀልባ","ባቡር","አውቶቡስ","መኪና","አደባባይ","ኩባያ","ሳህን","ማንኪያ","ብዕር","ቀለም","ደመና","ፀሐይ","ጨረቃ","ኮከብ","ነፋስ","ዝናብ","ጨርቅ","ወንበር","ጠረጴዛ","ሳጥን","ቅርጫት","ገመድ","ምንጣፍ","መጋረጃ","ድስት","ጣሪያ","ግድግዳ","ደረጃ","ከተማ","መንደር","ሱቅ","ዝንጅብል","ናና","ባዚል","ስንዴ","ባቄላ","ድንች","ቲማቲም","ካሮት","ኪያር","ወተት","አይብ","ማር","ጣፋጭ","ለውዝ","ሮማን","ወይን","ሎሚ","ብርቱካን","ሐብሐብ","ቀረፋ","ጥላ","ብርሃን","ጠዋት","ማታ","ፀደይ","በጋ","መኸር","ክረምት","ሸለቆ","ጫካ","ደሴት","ወደብ","ማማ","በር","መስኮት","ቁልፍ","ካርታ","ደብዳቤ","ስዕል","ደብተር","ትምህርትቤት","ሙዚየም","ካፌ","ዳቦቤት","ምግብቤት","እንጨት","ጥጥ","ሐር","ብር","መዳብ","ወርቅ","መስታወት",
  ],
};

const additionalStandaloneWords = {
  swahili: [
    "paka","mbwa","kuku","ngombe","samaki","ndege","yai","chumvi","sukari","kahawa","maharage","mahindi","mtama","ufuta","karanga","embe","papai","parachichi","nanasi","fenesi","pera","plamu","pilipili","kabichi","boga","birika","chupa","sahani","sufuria","kisu","uma","beseni","ndoo","jiko","mshumaa","sabuni","brashi","taulo","shuka","blanketi","mto","godoro","saa","redio","simu","kompyuta","kalenda","mfuko","begi","kofia","viatu","shati","suruali","sketi","kanzu","soksi","pete","bangili","mkufu","nywele","jicho","sikio","mkono","mguu","kidole","uso","meno","familia","rafiki","mtoto","mwalimu","daktari","mkulima","mpishi","mvuvi","dereva","fundi","mgeni","jirani","ofisi","posta","benki","hoteli","soko","uwanja","stendi","kituo","barabara","njia","kijia","kisima","chemchemi","mapango","kilima","tambarare","korongo","kichaka","nyasi","maua","mbegu","tawi","mzizi","gome","kivuko","darubini","kizingiti","rafu","kabati","droo","kifungo","sindano","uzi","mkasi","gundi","karatasi","bahasha","stempu","jarida","gazeti","hadithi","wimbo","ngoma","filimbi","kinanda","picha","sanamu","udongo","tofali","saruji","chuma","bati","kokoto",
  ],
  filipino: [
    "aso","pusa","manok","baka","isda","ibon","itlog","asin","asukal","kape","mais","sitaw","mani","mangga","papaya","abokado","pinya","langka","peras","kaakit","sili","repolyo","kalabasa","sibuyas","bawang","luya","palay","niyog","kawayan","palayok","kutsilyo","tinidor","plato","baso","bote","timba","palanggana","kalan","kandila","sabon","sipilyo","tuwalya","kumot","unan","kutson","orasan","radyo","telepono","kompyuter","kalendaryo","supot","bag","sumbrero","sapatos","damit","baro","pantalon","palda","medyas","singsing","pulseras","kuwintas","buhok","mata","tainga","kamay","paa","daliri","mukha","ngipin","pamilya","kaibigan","bata","guro","doktor","magsasaka","kusinero","mangingisda","tsuper","karpintero","panauhin","kapitbahay","opisina","koreo","bangko","hotel","istasyon","kalsada","eskinitas","balon","bukal","kuweba","burol","kapatagan","bangin","damuhan","sanga","ugat","balat","pantalan","tulay","bakod","aparador","estante","kabit","karayom","sinulid","gunting","pandikit","papel","sobre","selyo","magasin","pahayagan","kuwento","awit","tambol","plawta","piyano","larawan","rebulto","luwad","ladrilyo","semento","bakal","yero","graba","perlas","kabibe","buntot","pakpak","pugad","kulungan","silong",
  ],
  hausa: [
    "kare","mage","kaza","saniya","kifi","tsuntsu","kwai","gishiri","sukari","kofi","masara","wake","gyada","mangwaro","gwanda","avocado","abarba","gwaza","pear","barkono","kabeji","kabewa","albasa","tafarnuwa","shinkafa","kwakwa","kwarya","wuka","faranti","gilashi","kwalba","guga","murhu","kyandir","sabulu","burushi","tawul","bargo","matashi","agogo","rediyo","waya","kwamfuta","kalanda","jaka","hula","takalmi","riga","wando","siket","safa","zobe","munduwa","sarka","gashi","ido","kunne","hannu","kafa","yatsa","fuska","hakori","iyali","aboki","yaro","malami","likita","manomi","maiabinci","masunci","direba","kafinta","bako","makwabci","ofis","wasiku","banki","otal","tasha","titi","rijiya","marmaro","kogo","tudu","filato","kwazazzabo","ciyawa","reshe","saiwa","bawo","katanga","shinge","shiryayye","maajiya","allura","zare","makasi","manne","takarda","ambulaf","tambari","mujalla","jarida","labari","waka","ganga","algaita","piyano","zane","mutumumi","bulo","siminti","karfe","kwano","tsakuwa","luuluu","kwari","fuka","gidauniya","rumbu","rumfa","inuwa","matashi","mayafi","zumunci","kasko","murfi","tukunya","tabarau","madubi","goge",
  ],
  bengali: [
    "বিড়াল","কুকুর","মুরগি","গরু","মাছ","পাখি","ডিম","লবণ","চিনি","কফি","ভুট্টা","শিম","চিনাবাদাম","আম","পেঁপে","আনারস","কাঁঠাল","নাশপাতি","বরই","মরিচ","বাঁধাকপি","কুমড়া","পেঁয়াজ","রসুন","নারকেল","বাঁশ","ছুরি","কাঁটা","প্লেট","গ্লাস","বোতল","বালতি","চুলা","মোমবাতি","সাবান","ব্রাশ","তোয়ালে","কম্বল","বালিশ","গদি","ঘড়ি","রেডিও","ফোন","কম্পিউটার","ক্যালেন্ডার","থলে","ব্যাগ","টুপি","জুতা","জামা","প্যান্ট","মোজা","আংটি","বালা","হার","চুল","চোখ","কান","হাত","পা","আঙুল","মুখ","দাঁত","পরিবার","বন্ধু","শিশু","শিক্ষক","ডাক্তার","কৃষক","রাঁধুনি","জেলে","চালক","কারিগর","অতিথি","প্রতিবেশী","অফিস","ডাকঘর","ব্যাংক","হোটেল","স্টেশন","রাস্তা","গলি","কূপ","ঝরনা","গুহা","টিলা","সমতল","খাদ","ঘাস","শাখা","মূল","ছাল","ঘাট","বেড়া","তাক","আলমারি","সুঁই","সুতা","কাঁচি","আঠা","কাগজ","খাম","টিকিট","পত্রিকা","সংবাদপত্র","গল্প","গান","ঢোল","বাঁশি","পিয়ানো","মূর্তি","ইট","সিমেন্ট","লোহা","কঙ্কর","মুক্তা","ঝিনুক","লেজ","ডানা","বাসা","খাঁচা","ছাতা","চিরুনি","আয়না","বালুচর","চৌকি","বিছানা","কাঠি","ঘণ্টা","ঘুড়ি","খেলনা","পুতুল",
  ],
  urdu: [
    "بلی","کتا","مرغی","گائے","مچھلی","پرندہ","انڈا","نمک","چینی","کافی","مکئی","لوبیا","مونگفلی","آم","پپیتا","انناس","ناشپاتی","آلوبخارا","مرچ","بندگوبھی","کدو","پیاز","لہسن","ناریل","بانس","چھری","کانٹا","پلیٹ","گلاس","بوتل","بالٹی","چولہا","مومبتی","صابن","برش","تولیہ","کمبل","تکیہ","گدا","گھڑی","ریڈیو","فون","کمپیوٹر","کیلنڈر","تھیلا","بیگ","ٹوپی","جوتا","قمیض","پتلون","جراب","انگوٹھی","کنگن","ہار","بال","آنکھ","کان","ہاتھ","پاؤں","انگلی","چہرہ","دانت","خاندان","دوست","بچہ","استاد","ڈاکٹر","کسان","باورچی","ماہیگیر","ڈرائیور","بڑھئی","مہمان","پڑوسی","دفتر","ڈاکخانہ","بینک","ہوٹل","اسٹیشن","سڑک","گلی","کنواں","چشمہ","غار","ٹیلا","میدان","گھاٹی","گھاس","شاخ","جڑ","چھال","گھاٹ","باڑ","شیلف","الماری","سوئی","دھاگا","قینچی","گوند","کاغذ","لفافہ","ٹکٹ","رسالہ","اخبار","کہانی","گیت","ڈھول","بانسری","پیانو","مجسمہ","اینٹ","سیمنٹ","لوہا","کنکر","موتی","سیپی","دم","پر","گھونسلا","پنجرہ","چھتری","کنگھی","آئینہ","کھلونا","گڑیا","گھنٹی","پتنگ","بستر","چارپائی",
  ],
  amharic: [
    "ድመት","ውሻ","ዶሮ","ላም","ዓሣ","ወፍ","እንቁላል","ጨው","ስኳር","ቡና","በቆሎ","ሽንብራ","ለውዝ","ማንጎ","ፓፓያ","አናናስ","ኮኮናት","ቀይሽንኩርት","ነጭሽንኩርት","ቃሪያ","ጎመን","ዱባ","ቢላዋ","ሹካ","ሳህን","ብርጭቆ","ጠርሙስ","ባልዲ","ምድጃ","ሻማ","ሳሙና","ብሩሽ","ፎጣ","ብርድልብስ","ትራስ","ፍራሽ","ሰዓት","ሬዲዮ","ስልክ","ኮምፒዩተር","ቀንመቁጠሪያ","ቦርሳ","ኮፍያ","ጫማ","ሸሚዝ","ሱሪ","ካልሲ","ቀለበት","አምባር","ሀብል","ፀጉር","ዓይን","ጆሮ","እጅ","እግር","ጣት","ፊት","ጥርስ","ቤተሰብ","ጓደኛ","ልጅ","መምህር","ሐኪም","ገበሬ","አብሳይ","ዓሣአጥማጅ","አሽከርካሪ","አናጺ","እንግዳ","ጎረቤት","ቢሮ","ፖስታቤት","ባንክ","ሆቴል","ጣቢያ","መንገድ","ቅያስ","ጉድጓድ","ምንጭ","ዋሻ","ኮረብታ","ሜዳ","ገደል","ሣር","ቅርንጫፍ","ሥር","ቅርፊት","አጥር","መደርደሪያ","ቁምሳጥን","መርፌ","ክር","መቀስ","ሙጫ","ወረቀት","ፖስታ","ቴምብር","መጽሔት","ጋዜጣ","ታሪክ","ዘፈን","ከበሮ","ዋሽንት","ፒያኖ","ሐውልት","ጡብ","ሲሚንቶ","ብረት","ጠጠር","ዕንቁ","ቀንድ","ክንፍ","ጎጆ","ቤትእንስሳ","ጃንጥላ","ማበጠሪያ","መስተዋት","መጫወቻ","አሻንጉሊት","ደወል","ካይት","አልጋ","መቀመጫ",
  ],
};

const blocked = {
  swahili: new Set(["vita","damu","silaha","ngono","kasino","pombe"]),
  filipino: new Set(["digma","dugo","baril","sugal","alak"]),
  hausa: new Set(["yaki","jini","bindiga","caca","giya"]),
  bengali: new Set(["যুদ্ধ","রক্ত","অস্ত্র","জুয়া","মদ"]),
  urdu: new Set(["جنگ","خون","ہتھیار","جوا","شراب"]),
  amharic: new Set(["ጦርነት","ደም","መሳሪያ","ቁማር","አልኮል"]),
};

const normalizeCodeWord = (language, word) => {
  if (["swahili", "filipino", "hausa"].includes(language)) {
    const candidate = titleAscii(word);
    if (!commonLatinPattern.test(candidate)) return "";
    if (candidate.length > 18) return "";
    return candidate;
  }
  const candidate = compactScript(word);
  if (!scriptPatterns[language].test(candidate)) return "";
  if ([...candidate].length > 24) return "";
  return candidate;
};

const buildCodebook = (language) => {
  const words = [];
  const seen = new Set();
  const add = (word) => {
    const candidate = normalizeCodeWord(language, word);
    if (!candidate) return;
    if (blocked[language].has(candidate.toLowerCase?.() ?? candidate)) return;
    if (blocked[language].has(candidate)) return;
    if (seen.has(candidate)) return;
    seen.add(candidate);
    words.push(candidate);
  };

  const list = [
    ...baseWords[language],
    ...(additionalStandaloneWords[language] ?? []),
  ];
  for (const word of list) add(word);
  for (const prefix of list) {
    for (const suffix of list) {
      if (prefix === suffix) continue;
      add(`${prefix}${suffix}`);
      if (words.length >= 5000) break;
    }
    if (words.length >= 5000) break;
  }

  if (words.length < 5000) {
    throw new Error(`${language} codebook generated ${words.length} words`);
  }
  return words.slice(0, 5000);
};

const latinPairs = [
  [/sh/gi, "শ"], [/ch/gi, "চ"], [/th/gi, "থ"], [/ph/gi, "ফ"],
  [/kh/gi, "খ"], [/gh/gi, "ঘ"], [/ng/gi, "ং"], [/ny/gi, "ন্য"],
];
const bengaliMap = new Map(Object.entries({
  a:"া", b:"ব", c:"ক", d:"দ", e:"ে", f:"ফ", g:"গ", h:"হ", i:"ি", j:"জ",
  k:"ক", l:"ল", m:"ম", n:"ন", o:"ো", p:"প", q:"ক", r:"র", s:"স", t:"ত",
  u:"ু", v:"ভ", w:"ও", x:"ক্স", y:"য়", z:"জ",
}));
const urduPairs = [
  [/sh/gi, "ش"], [/ch/gi, "چ"], [/th/gi, "ت"], [/ph/gi, "ف"],
  [/kh/gi, "خ"], [/gh/gi, "غ"], [/ng/gi, "نگ"], [/ny/gi, "نی"],
];
const urduMap = new Map(Object.entries({
  a:"ا", b:"ب", c:"ک", d:"د", e:"ے", f:"ف", g:"گ", h:"ہ", i:"ی", j:"ج",
  k:"ک", l:"ل", m:"م", n:"ن", o:"و", p:"پ", q:"ق", r:"ر", s:"س", t:"ت",
  u:"و", v:"و", w:"و", x:"کس", y:"ی", z:"ز",
}));
const amharicPairs = [
  [/sh/gi, "ሽ"], [/ch/gi, "ች"], [/th/gi, "ት"], [/ph/gi, "ፍ"],
  [/kh/gi, "ክ"], [/gh/gi, "ግ"], [/ng/gi, "ንግ"], [/ny/gi, "ኝ"],
];
const amharicMap = new Map(Object.entries({
  a:"አ", b:"ብ", c:"ክ", d:"ድ", e:"ኤ", f:"ፍ", g:"ግ", h:"ህ", i:"ኢ", j:"ጅ",
  k:"ክ", l:"ል", m:"ም", n:"ን", o:"ኦ", p:"ፕ", q:"ቅ", r:"ር", s:"ስ", t:"ት",
  u:"ኡ", v:"ቭ", w:"ው", x:"ክስ", y:"ይ", z:"ዝ",
}));

const foldLatin = (value) =>
  String(value)
    .normalize("NFD")
    .replace(/\p{Mark}/gu, "")
    .replace(/[’'`´/#?\-]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const transliterate = (value, pairs, map) => {
  let normalized = foldLatin(value);
  for (const [pattern, replacement] of pairs) normalized = normalized.replace(pattern, replacement);
  let output = "";
  for (const char of normalized) {
    if (/\d/.test(char) || /\s/.test(char)) {
      output += char;
      continue;
    }
    output += map.get(char.toLowerCase()) ?? "";
  }
  return output.replace(/\s+/g, " ").trim();
};

const languageSpecs = {
  swahili: {
    region: (name) => foldLatin(name)
      .replace(/\bOcean\b/g, "Bahari")
      .replace(/\bSea\b/g, "Bahari")
      .replace(/\bBay\b/g, "Ghuba")
      .replace(/\bGulf\b/g, "Ghuba")
      .replace(/\bLake\b/g, "Ziwa")
      .replace(/\bRiver\b/g, "Mto"),
    overrides: { 1642911: "Jakarta", 1835848: "Seoul", 1273294: "Delhi", 360630: "Kairo" },
  },
  filipino: {
    region: (name) => foldLatin(name)
      .replace(/\bOcean\b/g, "Karagatan")
      .replace(/\bSea\b/g, "Dagat")
      .replace(/\bBay\b/g, "Look")
      .replace(/\bGulf\b/g, "Golpo")
      .replace(/\bLake\b/g, "Lawa")
      .replace(/\bRiver\b/g, "Ilog"),
    overrides: { 1642911: "Jakarta", 1835848: "Seoul", 1273294: "Delhi", 360630: "Cairo" },
  },
  hausa: {
    region: (name) => foldLatin(name)
      .replace(/\bOcean\b/g, "Teku")
      .replace(/\bSea\b/g, "Teku")
      .replace(/\bBay\b/g, "Guba")
      .replace(/\bGulf\b/g, "Guba")
      .replace(/\bLake\b/g, "Tabki")
      .replace(/\bRiver\b/g, "Kogi"),
    overrides: { 1642911: "Jakarta", 1835848: "Seoul", 1273294: "Delhi", 360630: "Alkahira" },
  },
  bengali: {
    region: (name) => transliterate(name, latinPairs, bengaliMap)
      .replace(/োকেআন/g, "সমুদ্র")
      .replace(/সো/g, "সমুদ্র"),
    overrides: { 1642911: "জাকার্তা", 1835848: "সিউল", 1273294: "দিল্লি", 360630: "কায়রো" },
  },
  urdu: {
    region: (name) => transliterate(name, urduPairs, urduMap)
      .replace(/وکین/g, "سمندر")
      .replace(/سی/g, "سمندر"),
    overrides: { 1642911: "جکارتہ", 1835848: "سیول", 1273294: "دہلی", 360630: "قاہرہ" },
  },
  amharic: {
    region: (name) => transliterate(name, amharicPairs, amharicMap)
      .replace(/ኦክኤአን/g, "ባሕር")
      .replace(/ስኤአ/g, "ባሕር"),
    overrides: { 1642911: "ጃካርታ", 1835848: "ሴኡል", 1273294: "ዴሊ", 360630: "ካይሮ" },
  },
};

const webLocaleByLanguage = {
  swahili: { locale: "sw", languageName: "Kiswahili" },
  filipino: { locale: "fil", languageName: "Filipino" },
  hausa: { locale: "ha", languageName: "Hausa" },
  bengali: { locale: "bn", languageName: "বাংলা" },
  urdu: { locale: "ur", languageName: "اردو" },
  amharic: { locale: "am", languageName: "አማርኛ" },
};

const normalizeRegionLabel = (value) =>
  String(value)
    .replace(/[’'`´/#?\-]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const dedupeNames = (rows, maxLength) => {
  const seen = new Set();
  return rows.map((row) => {
    let base = normalizeRegionLabel(row.name);
    if ([...base].length > maxLength) base = [...base].slice(0, maxLength).join("").trim();
    let candidate = base || String(row.code);
    let index = 2;
    while (seen.has(candidate.toLocaleLowerCase())) {
      const suffix = ` ${index}`;
      const trimmed = [...base].slice(0, Math.max(1, maxLength - suffix.length)).join("").trim();
      candidate = `${trimmed}${suffix}`;
      index += 1;
    }
    seen.add(candidate.toLocaleLowerCase());
    return { ...row, name: candidate };
  });
};

const translateName = (language, row) => {
  const spec = languageSpecs[language];
  return spec.overrides[String(row.code)] ?? spec.region(row.name);
};

const buildLocalizedRows = (language, inputPath, outputPath, maxLength) => {
  const rows = readJson(inputPath).map((row) => ({
    ...row,
    name: translateName(language, row),
  }));
  writeJson(outputPath, dedupeNames(rows, maxLength));
};

const buildEmbeddedRegionDb = async (regionName) => {
  const regions = readJson(`packages/geoint/region-dist/${regionName}.json`);
  const regionDbPath = new URL("packages/geoint/region-db/", root);
  const regionLevelDbPath = path.join(regionDbPath.pathname, regionName);
  const indexPath = path.join(regionDbPath.pathname, `${regionName}.index`);

  rmSync(regionLevelDbPath, { recursive: true, force: true });
  rmSync(indexPath, { force: true });
  mkdirSync(regionLevelDbPath, { recursive: true });

  const db = new Level(regionLevelDbPath);
  const index = new KDBush(regions.length);
  for (const [indexKey, region] of regions.entries()) {
    index.add(region.long, region.lat);
    await db.put(`I-${indexKey}`, JSON.stringify(region));
    await db.put(`N-${region.name}`, `I-${indexKey}`);
  }
  index.finish();
  writeFileSync(indexPath, Buffer.from(index.data));
  await db.close();
};

const mode = process.argv[2] ?? "all";
if (!["all", "codebook-only"].includes(mode)) {
  throw new Error(`Unsupported mode: ${mode}`);
}

for (const language of Object.keys(baseWords)) {
  writeJson(
    `packages/codebook/codebook-dist/${language}.json`,
    buildCodebook(language),
  );
  if (mode === "codebook-only") continue;

  const suffix = `-${language}`;
  buildLocalizedRows(language, "packages/geoint/region-dist/region-2.json", `packages/geoint/region-dist/region-2${suffix}.json`, 36);
  buildLocalizedRows(language, "packages/geoint/region-dist/region-3.json", `packages/geoint/region-dist/region-3${suffix}.json`, 20);
  buildLocalizedRows(language, "packages/geoint/region-dist/region-2-moon.json", `packages/geoint/region-dist/region-2-moon${suffix}.json`, 48);
  buildLocalizedRows(language, "packages/geoint/region-dist/region-2-mars.json", `packages/geoint/region-dist/region-2-mars${suffix}.json`, 48);
  buildLocalizedRows(language, "packages/geoint/region-dist/region-3-mars.json", `packages/geoint/region-dist/region-3-mars${suffix}.json`, 48);

  for (const regionName of [
    `region-2${suffix}`,
    `region-3${suffix}`,
    `region-2-moon${suffix}`,
    `region-2-mars${suffix}`,
    `region-3-mars${suffix}`,
  ]) {
    await buildEmbeddedRegionDb(regionName);
  }
}

const englishMessages = readJson("apps/web/messages/en/index.json");
const englishPlaceTypes = readJson("apps/web/messages/en/placeTypes.json");
for (const [language, { locale, languageName }] of Object.entries(
  webLocaleByLanguage,
)) {
  const messagesDir = new URL(`apps/web/messages/${locale}/`, root);
  if (!existsSync(messagesDir)) mkdirSync(messagesDir, { recursive: true });
  writeJson(`apps/web/messages/${locale}/index.json`, {
    ...englishMessages,
    common: {
      ...englishMessages.common,
      languageName,
      languageCode: locale,
    },
  });
  writeJson(`apps/web/messages/${locale}/placeTypes.json`, englishPlaceTypes);
}
