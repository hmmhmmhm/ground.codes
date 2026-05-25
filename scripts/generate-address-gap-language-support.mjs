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
  burmese: /^[\p{Script=Myanmar}\p{Mark}]+$/u,
  khmer: /^[\p{Script=Khmer}\p{Mark}]+$/u,
  nepali: /^[\p{Script=Devanagari}\p{Mark}]+$/u,
  pashto: /^[\p{Script=Arabic}\p{Mark}]+$/u,
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

const expansionSeedWords = {
  burmese: [
    "ye","ein","myit","taung","pan","lahpet","saok","mee","mont","htamin","panthi","hnget","u","sabe","thit","zei","lan","tada","uyin","le","ywet","mye","kyauk","the","kan","in","pinle","kanbe","hle","yata","bas","ka","kwin","khwet","pagan","zun","kalam","ayaung","tein","nwe","la","kye","lay","moe","pawa","khalon","sabein","thitkha","panban","kyo","kanzin","liteka","taik","mote","min","myo","ywa","sain","gyin","pazin","nanam","saba","gandum","pe","alu","kayan","monlar","thagwa","nweu","pazun","nwa","ngar","kyet","kway","kyaung","hsi","thanakha","ban","seik","sone","tazaung","myauk","tadaing","myinkwin","yo","seikkan","sin","myaw","saya","sayama","hsayawun","miba","thangegyin","kale","ayeik","kabyar","kyoe","sebu","kabe","hnyin","kyaukpyar","khayan","shauk","thabyu","ohn","ngapi","kyar","thinbaw","zin","pale","yokthe","myatthar","shwe","ngwe","kyay",
  ],
  khmer: [
    "tuk","pteah","tonle","phnom","phka","tae","sievphov","phleung","nompang","bay","pom","chek","khnol","olive","daem","phsar","phlov","spean","suon","srae","sleuk","dei","thmor","ksach","boeng","samot","chhne","tukdo","rotphleng","lan","vela","kaev","chan","slappria","khmao","pophok","preahathit","chan","pkaray","khyol","phleang","kramah","kae","tok","prdab","kantrak","khsae","kantel","veng","chhnang","dambol","chamreang","phum","krong","hang","khnyay","chi","mareah","srov","sandek","dambong","krohom","trasak","tukdoh","phom","khmum","svaay","krouch","trabaek","lvea","khtum","chhkae","chhma","moan","ko","trey","baksay","pong","ambil","skor","kafe","pot","sbek","sabou","chas","kanseng","phuy","khnaey","knong","muk","thmenh","kru","vechobandit","kasekor","neakbork","phgneav","bank","sambot","kraom","tumneab","bangku","sramaol","khnong","rung","phleungtien","kda","dek","sang","kaong",
  ],
  nepali: [
    "pani","ghar","nadi","pahad","phul","chiya","kitab","batti","roti","bhat","syau","kera","khajur","jaitun","rukh","bajar","bato","pul","bagaincha","khet","pat","mato","dhunga","balua","tal","pokhari","samundra","kinar","nauka","rel","bas","gadi","chok","kap","katora","chamcha","kalam","rang","badal","surya","chandra","tara","hawa","paniyeko","kapada","kursi","mej","baksa","tokari","dori","chakati","parda","bhada","chhat","bhitta","sindhi","tol","sahar","gaun","pasal","aduwa","pudina","tulasi","chameli","gahu","dal","alu","golbheda","gajar","kakro","dudh","paneer","maha","mithai","badam","anar","angur","kagati","suntala","tarbuj","dalchini","chhaya","ujyalo","bihan","sanjh","basanta","garmi","sharad","jado","upatyaka","ban","tapoo","bandar","minar","dhoka","jhyal","sacho","naksa","chithi","tasbir","kapi","school","sangrahalaya","cafe","bakery","restaurant","kath","kapas","resham","chandi","tama","sun","sisa",
  ],
  somali: [
    "biyo","guri","webi","buur","ubax","shaah","buug","nal","rooti","bariis","tufaax","moos","timir","saytuun","geed","suuq","waddo","buundo","beer","dhul","caleen","carro","dhagax","ciid","haro","balli","bad","xeeb","doon","tareen","bas","gaari","fagaaro","koob","baaquli","qaaddo","qalin","midab","daruur","qorrax","dayax","xiddig","dabayl","roob","maro","kursi","miis","sanduuq","dambiil","xadhig","derin","daah","dheri","saqaf","derbi","jaranjar","xaafad","magaalo","tuulo","dukaan","sinjibiil","reexaanta","qamadiga","digir","baradho","yaanyo","karoot","qajaar","caano","farmaajo","malab","laws","rummaan","canab","liin","qaraha","qorfe","hoos","iftiin","subax","fiid","gu","xagaa","dayr","jiilaal","dooxo","kaynta","jasiirad","deked","munaarad","albaab","daaqad","furaha","khariidad","warqad","sawir","buugyar","dugsi","madxaf","kafe","foorno","makhaayad","alwaax","suuf","xariir","qalinjab","maar","dahab","muraayad","bisad","eey","digaag","lo","kalluun","shimbir","ukun","milix","sonkor","qaxwo","galley","basal","toon","kaabash","bocor","mindida",
  ],
  pashto: [
    "oba","kor","sind","ghar","gul","chai","kitab","chiragh","dodai","wriji","manra","kela","khajur","zaitun","wana","bazar","lar","pul","bagh","pati","pana","khawra","tiga","shga","dand","talab","samandar","ghara","kashti","rel","bas","motar","maidon","pyala","kasa","qashogha","qalam","rang","wraza","lmar","spogmai","stori","bad","baran","tukra","kursi","mez","sandoq","tokrai","rasai","satrangi","parda","degi","chat","dewal","zine","kali","shar","keli","dukan","adrak","podina","kashmali","ghanim","dal","kachalo","tamatar","gajar","badrang","shide","panir","shahd","khog","badam","anar","angor","limu","naranj","tarboz","darchini","sori","rana","sahar","makham","sperlai","dobai","manai","jami","dara","jangal","jazira","bandar","minar","war","kirkai","kilai","naksha","lik","anzoor","kitabcha","maktab","muzim","kafe","nanwai","restoran","laragi","malmal","resham","spinzar","mes","sra","shisha",
  ],
  lingala: [
    "mai","ndako","ebale","ngomba","fololo","ti","buku","mwinda","mapa","loso","pom","banana","mbila","olive","nzete","zando","nzela","pont","elanga","bilanga","lokasa","mabele","libanga","zelo","etima","liziba","mbu","libongo","bwato","tren","bisi","motuka","lopango","kopo","sani","lutu","ekomeli","langi","lipata","moyi","sanza","monzoto","mopepe","mbula","elamba","kiti","mesa","sanduku","kitunga","nsinga","lisolo","rido","nzungu","toit","efelo","emata","kartye","engumba","mboka","butiki","ngenge","menta","ble","masangu","loso","pomdetere","tomati","karoti","konkonbre","mabeleya","fromage","mafuta","amande","grenade","raisin","limo","orange","pastèque","kanela","elili","pole","ntongo","mpokwa","printemps","moi","automne","malili","lobwaku","zamba","esanga","libongo","ndakoelai","ekuke","fenetre","fungola","karte","mokanda","elilingi","kaye","kelasi","musee","kafe","boulangerie","restaurant","libaya","coton","soie","palata","motako","wolo","talatala","mbwa","nyau","nsoso","ngombe","mbisi","ndeke","likei","mungwa","sukali",
  ],
};

Object.assign(baseWords, expansionSeedWords);

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

const expansionMoreWords = [
  "cat","dog","chicken","cow","fish","bird","egg","salt","sugar","coffee","corn","bean","peanut","mango","papaya","pineapple","pear","pepper","cabbage","pumpkin","onion","garlic","coconut","bamboo","knife","fork","plate","glass","bottle","bucket","stove","candle","soap","brush","towel","blanket","pillow","mattress","clock","radio","phone","computer","calendar","bag","hat","shoe","shirt","trousers","sock","ring","bracelet","necklace","hair","eye","ear","hand","foot","finger","face","tooth","family","friend","child","teacher","doctor","farmer","cook","fisher","driver","carpenter","guest","neighbor","office","post","bank","hotel","station","street","lane","well","spring","cave","hill","plain","ravine","grass","branch","root","bark","fence","shelf","cabinet","needle","thread","scissors","glue","paper","envelope","stamp","magazine","newspaper","story","song","drum","flute","piano","statue","brick","cement","iron","gravel","pearl","shell","tail","wing","nest","cage","umbrella","comb","mirror","toy","doll","bell","kite","bed","bench","ladder","market","school","clinic","garden","field","harbor","tower","gate","yard","path","shade","light","morning","evening","valley","forest","island","letter","picture","notebook","wood","cotton","silver","copper","gold","window","door","key","map",
];

Object.assign(additionalStandaloneWords, {
  burmese: expansionMoreWords,
  khmer: expansionMoreWords,
  nepali: expansionMoreWords,
  somali: expansionMoreWords,
  pashto: expansionMoreWords,
  lingala: expansionMoreWords,
});

const blocked = {
  swahili: new Set(["vita","damu","silaha","ngono","kasino","pombe"]),
  filipino: new Set(["digma","dugo","baril","sugal","alak"]),
  hausa: new Set(["yaki","jini","bindiga","caca","giya"]),
  bengali: new Set(["যুদ্ধ","রক্ত","অস্ত্র","জুয়া","মদ"]),
  urdu: new Set(["جنگ","خون","ہتھیار","جوا","شراب"]),
  amharic: new Set(["ጦርነት","ደም","መሳሪያ","ቁማር","አልኮል"]),
  burmese: new Set(["စစ်","သွေး","လက်နက်"]),
  khmer: new Set(["សង្គ្រាម","ឈាម","អាវុធ"]),
  nepali: new Set(["युद्ध","रगत","हतियार","जुवा","रक्सी"]),
  somali: new Set(["Dagaal","Dhiig","Hub","Khamri"]),
  pashto: new Set(["جګړه","وینه","وسله","قمار","شراب"]),
  lingala: new Set(["Etumba","Makila","Mondoki","Masanga"]),
};

const codebookTransliterationMaps = {
  burmese: {
    pairs: [[/ng/gi, "င"], [/ny/gi, "ည"], [/th/gi, "သ"], [/sh/gi, "ရှ"], [/ch/gi, "ချ"], [/ph/gi, "ဖ"], [/kh/gi, "ခ"]],
    chars: { a:"အ", b:"ဗ", c:"က", d:"ဒ", e:"ေ", f:"ဖ", g:"ဂ", h:"ဟ", i:"ိ", j:"ဂျ", k:"က", l:"လ", m:"မ", n:"န", o:"ို", p:"ပ", q:"က", r:"ရ", s:"စ", t:"တ", u:"ု", v:"ဗ", w:"ဝ", x:"က်စ", y:"ယ", z:"ဇ" },
  },
  khmer: {
    pairs: [[/ng/gi, "ង"], [/ny/gi, "ញ"], [/th/gi, "ថ"], [/ch/gi, "ច"], [/ph/gi, "ផ"], [/kh/gi, "ខ"], [/tr/gi, "ត្រ"]],
    chars: { a:"អ", b:"ប", c:"ក", d:"ដ", e:"េ", f:"ហ្វ", g:"គ", h:"ហ", i:"ិ", j:"ជ", k:"ក", l:"ល", m:"ម", n:"ន", o:"ូ", p:"ព", q:"ក", r:"រ", s:"ស", t:"ត", u:"ុ", v:"វ", w:"វ", x:"ក្ស", y:"យ", z:"ហ្ស" },
  },
  nepali: {
    pairs: [[/chh/gi, "छ"], [/ch/gi, "च"], [/th/gi, "थ"], [/ph/gi, "फ"], [/kh/gi, "ख"], [/gh/gi, "घ"], [/bh/gi, "भ"], [/dh/gi, "ध"], [/sh/gi, "श"], [/ny/gi, "ञ"], [/ng/gi, "ङ"]],
    chars: { a:"अ", b:"ब", c:"क", d:"द", e:"े", f:"फ", g:"ग", h:"ह", i:"ि", j:"ज", k:"क", l:"ल", m:"म", n:"न", o:"ो", p:"प", q:"क", r:"र", s:"स", t:"त", u:"ु", v:"व", w:"व", x:"क्स", y:"य", z:"ज" },
  },
  pashto: {
    pairs: [[/sh/gi, "ش"], [/ch/gi, "چ"], [/th/gi, "ت"], [/ph/gi, "ف"], [/kh/gi, "خ"], [/gh/gi, "غ"], [/ng/gi, "نګ"], [/ny/gi, "نی"]],
    chars: { a:"ا", b:"ب", c:"ک", d:"د", e:"ې", f:"ف", g:"ګ", h:"ه", i:"ي", j:"ج", k:"ک", l:"ل", m:"م", n:"ن", o:"و", p:"پ", q:"ق", r:"ر", s:"س", t:"ت", u:"و", v:"و", w:"و", x:"کس", y:"ی", z:"ز" },
  },
};

const transliterateCodeWord = (language, value) => {
  const spec = codebookTransliterationMaps[language];
  if (!spec) return String(value);
  let normalized = String(value).normalize("NFD").replace(/\p{Mark}/gu, "");
  for (const [pattern, replacement] of spec.pairs) {
    normalized = normalized.replace(pattern, replacement);
  }
  let output = "";
  for (const char of normalized) {
    if (/\d/.test(char) || /\s/.test(char)) {
      output += char;
      continue;
    }
    if (/[A-Za-z]/.test(char)) output += spec.chars[char.toLowerCase()] ?? "";
  }
  return output;
};

const normalizeCodeWord = (language, word) => {
  if (["swahili", "filipino", "hausa", "somali", "lingala"].includes(language)) {
    const candidate = titleAscii(word);
    if (!commonLatinPattern.test(candidate)) return "";
    if (candidate.length > 18) return "";
    return candidate;
  }
  let candidate = compactScript(word);
  if (!scriptPatterns[language]?.test(candidate)) {
    candidate = compactScript(transliterateCodeWord(language, word));
  }
  if (!scriptPatterns[language].test(candidate)) return "";
  if ([...candidate].length > 24) return "";
  return candidate;
};

const makeCodebookSoundKey = (language, word) => {
  if (["swahili", "filipino", "hausa", "somali", "lingala"].includes(language)) {
    return String(word)
      .normalize("NFKD")
      .replace(/\p{Mark}/gu, "")
      .toLowerCase()
      .replace(/c/g, "k")
      .replace(/q/g, "k")
      .replace(/ph/g, "f")
      .replace(/([a-z])\1+/g, "$1");
  }

  const normalized = String(word).normalize("NFC").replace(/[\u200c\u200d\s]/g, "");
  if (language === "urdu") {
    return normalized.replace(/[\u064b-\u065f\u0670]/g, "");
  }
  return normalized.replace(/(.)\1+/gu, "$1");
};

const buildCodebook = (language) => {
  const words = [];
  const seen = new Set();
  const seenSoundKeys = new Map();
  const add = (word) => {
    const candidate = normalizeCodeWord(language, word);
    if (!candidate) return;
    if (blocked[language].has(candidate.toLowerCase?.() ?? candidate)) return;
    if (blocked[language].has(candidate)) return;
    if (seen.has(candidate)) return;
    const soundKey = makeCodebookSoundKey(language, candidate);
    const soundMatch = seenSoundKeys.get(soundKey);
    if (soundMatch && soundMatch !== candidate) return;
    seen.add(candidate);
    seenSoundKeys.set(soundKey, candidate);
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
  burmese: {
    region: (name) => transliterateCodeWord("burmese", name),
    overrides: { 1642911: "ဂျာကာတာ", 1835848: "ဆိုးလ်", 1273294: "ဒေလီ", 360630: "ကိုင်ရို" },
  },
  khmer: {
    region: (name) => transliterateCodeWord("khmer", name),
    overrides: { 1642911: "ចាការតា", 1835848: "សេអ៊ូល", 1273294: "ដេលី", 360630: "កែរ" },
  },
  nepali: {
    region: (name) => transliterateCodeWord("nepali", name),
    overrides: { 1642911: "जकार्ता", 1835848: "सोल", 1273294: "दिल्ली", 360630: "काहिरा" },
  },
  somali: {
    region: (name) => foldLatin(name)
      .replace(/\bOcean\b/g, "Bad")
      .replace(/\bSea\b/g, "Bad")
      .replace(/\bBay\b/g, "Gacanka")
      .replace(/\bGulf\b/g, "Gacanka")
      .replace(/\bLake\b/g, "Haro")
      .replace(/\bRiver\b/g, "Webi"),
    overrides: { 1642911: "Jakarta", 1835848: "Seoul", 1273294: "Delhi", 360630: "Qaahira" },
  },
  pashto: {
    region: (name) => transliterateCodeWord("pashto", name),
    overrides: { 1642911: "جاکارتا", 1835848: "سیول", 1273294: "ډیلي", 360630: "قاهره" },
  },
  lingala: {
    region: (name) => foldLatin(name)
      .replace(/\bOcean\b/g, "Mbu")
      .replace(/\bSea\b/g, "Mbu")
      .replace(/\bBay\b/g, "Libongo")
      .replace(/\bGulf\b/g, "Libongo")
      .replace(/\bLake\b/g, "Etima")
      .replace(/\bRiver\b/g, "Ebale"),
    overrides: { 1642911: "Jakarta", 1835848: "Seoul", 1273294: "Delhi", 360630: "Kairo" },
  },
};

const webLocaleByLanguage = {
  swahili: { locale: "sw", languageName: "Kiswahili" },
  filipino: { locale: "fil", languageName: "Filipino" },
  hausa: { locale: "ha", languageName: "Hausa" },
  bengali: { locale: "bn", languageName: "বাংলা" },
  urdu: { locale: "ur", languageName: "اردو" },
  amharic: { locale: "am", languageName: "አማርኛ" },
  burmese: { locale: "my", languageName: "မြန်မာ" },
  khmer: { locale: "km", languageName: "ខ្មែរ" },
  nepali: { locale: "ne", languageName: "नेपाली" },
  somali: { locale: "so", languageName: "Soomaali" },
  pashto: { locale: "ps", languageName: "پښتو" },
  lingala: { locale: "ln", languageName: "Lingála" },
};

const normalizeRegionLabel = (value) =>
  String(value)
    .replace(/[’'`´/#?\-]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const truncateLabel = (value, maxLength) => {
  if ([...value].length <= maxLength) return value;

  const suffixMatch = value.match(/^(.*?)( \d+)$/);
  if (suffixMatch) {
    const [, head, suffix] = suffixMatch;
    const headLength = Math.max(1, maxLength - [...suffix].length);
    return `${[...head].slice(0, headLength).join("").trim()}${suffix}`;
  }

  return [...value].slice(0, maxLength).join("").trim();
};

const dedupeNames = (rows, maxLength) => {
  const seen = new Set();
  return rows.map((row) => {
    let base = normalizeRegionLabel(row.name);
    base = truncateLabel(base, maxLength);
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

const numericSuffixSources = new Set([
  "natural-earth-marine",
  "synthetic-antarctic-grid",
  "synthetic-arctic-grid",
  "synthetic-sahara-grid",
]);

const stableNumericSuffix = (row, index) => {
  const digits = String(row.code ?? "").match(/\d+/g)?.join("");
  return digits || String(index + 1);
};

const withRequiredSuffix = (row, index) => {
  if (numericSuffixSources.has(row.source) && !/ \d+$/.test(row.name)) {
    return {
      ...row,
      name: `${row.name} ${stableNumericSuffix(row, index)}`,
    };
  }

  if (row.source === "synthetic-named-gap") {
    return {
      ...row,
      name: `${row.name} ${stableNumericSuffix(row, index)}`,
    };
  }

  return row;
};

const buildLocalizedRows = (language, inputPath, outputPath, maxLength) => {
  const rows = readJson(inputPath).map((row, index) =>
    withRequiredSuffix(
      {
        ...row,
        name: translateName(language, row),
      },
      index,
    ),
  );
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
