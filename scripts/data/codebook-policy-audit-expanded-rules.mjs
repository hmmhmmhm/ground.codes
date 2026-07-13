import { hasGeneratedPair } from "./codebook-policy-audit-european-rules.mjs";

export const THAI_AWKWARD_ATTRIBUTE_ROOTS = [
  "น้ำ",
  "ไฟ",
  "ลม",
  "ข้าว",
  "ปลา",
  "นก",
  "แมว",
  "ม้า",
  "ช้าง",
  "กวาง",
  "ผึ้ง",
  "ไก่",
  "เป็ด",
  "ห่าน",
  "กุ้ง",
  "ปู",
  "หอย",
];

export const THAI_AWKWARD_ATTRIBUTE_SUFFIXES = [
  "ดี",
  "ยาว",
  "สูง",
  "ต่ำ",
  "หนัก",
  "แบน",
  "กว้าง",
  "แคบ",
  "เย็น",
];

export const isAwkwardThaiCompound = (word) =>
  hasGeneratedPair(
    word,
    THAI_AWKWARD_ATTRIBUTE_ROOTS,
    THAI_AWKWARD_ATTRIBUTE_SUFFIXES,
  );

export const VIETNAMESE_AWKWARD_EXACT_COMPOUNDS = new Set([
  "nướccao",
  "lửacao",
  "nhàcao",
  "vườncao",
  "xanhxanh",
  "hoacao",
  "trecao",
  "camcao",
  "chimcao",
  "khoaicao",
  "lencao",
  "sencao",
  "thancao",
  "tranhcao",
  "khoaiđèn",
  "lácửa",
  "lạchồ",
  "chuôngbình",
  "ruộngthuyền",
  "nắngcam",
  "trăngđậu",
  "bànchảitrắng",
  "bànchảiđồng",
  "gốiớt",
  "chiếugạo",
  "mànhbút",
  "hộpxanh",
  "bútvàng",
  "cốcđen",
  "báttrắng",
  "vảitím",
  "lụahồng",
  "đènđen",
  "bìnhnâu",
  "vườnnắng",
  "ruộnggió",
  "đồngmát",
  "bãivàng",
  "sânxanh",
  "núimát",
  "đồinắng",
  "aomát",
  "hồxanh",
  "sôngmát",
]);

export const isAwkwardVietnameseCompound = (word) => {
  const lower = word.toLowerCase();
  if (VIETNAMESE_AWKWARD_EXACT_COMPOUNDS.has(lower)) return true;
  if (lower.length % 2 !== 0) return false;
  const half = lower.slice(0, lower.length / 2);
  return half.length >= 3 && lower === `${half}${half}`;
};

export const HINDI_AWKWARD_EXACT_COMPOUNDS = new Set([
  "किताबमाटी",
  "घड़ास्टेशन",
  "दीपकसड़क",
  "मोहल्लाकुर्सी",
  "मोहल्लातवा",
  "थालीकुर्सी",
  "कटोरामेज",
  "प्यालास्टेशन",
  "डिब्बासड़क",
  "मीठानमक",
  "मीठाप्याज",
  "ताजाकुर्सी",
  "गमलारोटी",
  "सुनहराकुर्सी",
  "सुनहरामेज",
  "रूपहलालहसुन",
  "रूपहलासत्तू",
  "रूपहलालस्सी",
  "रूपहलासूप",
  "रूपहलाहांडी",
  "सुनहरादान",
  "रूपहलाघर",
  "नदीघर",
  "नदीबाजार",
  "नदीलाल",
  "नदीसुनहरा",
  "झीलनीला",
  "लालघर",
  "नीलाकिताब",
  "छोटामिट्टी",
  "बड़ाहवा",
  "कागजकंबल",
  "कागजरजाई",
  "कपासदीया",
  "चांदीकुर्सी",
  "गांवमेड़",
  "बरामदाबाजार",
  "तालाबसुनहरा",
  "समुद्ररूपहला",
  "हवाकाला",
  "सूरजहरा",
  "चाँदपीला",
  "रास्तागुलाबी",
  "पीतलकंबल",
  "ईंटसाड़ी",
  "अपरस",
  "सुपली",
  "खिड़कीपट",
  "टोकरीढक्कन",
  "गरमपानी",
  "चावलदान",
  "मोडक",
  "पटल",
  "बखार",
  "सरौता",
  "बलुआ",
  "खर्रा",
  "पपीहा",
]);

export const isAwkwardHindiCompound = (word) =>
  HINDI_AWKWARD_EXACT_COMPOUNDS.has(word);

export const ARABIC_ABSTRACT_COMPOUND_PREFIXES = [
  "صفاء",
  "هدوء",
  "بسمة",
  "فرح",
  "أمل",
];

export const isAwkwardArabicCompound = (word) =>
  ARABIC_ABSTRACT_COMPOUND_PREFIXES.some(
    (prefix) => word.startsWith(prefix) && word !== prefix,
  );

export const CHINESE_GENERATED_COMPOUND_PATTERN =
  /^(木|梅|杉|竹|棉|麻|兰|草|玉|石|纸|藤|布|砂|花|豆|米|松|枫|琥珀|翡翠|玛瑙)(小)?(筐|篮|盏|架|匣|瓶|钵|盂|盒|盖|箔|盆|塞|芯|坠|槽|坯|扣子|箩|提篮|篓|笼|夹|杯|碗|盘|筷|板|片|块|挂件|罐|箸|盒盖|坠子|木勺|刷|梳|小罐|小盘|小盒|小盆|小槽|小箩|小篓|小笼|小夹|小板|小片|小块)$/u;

export const JAPANESE_GENERATED_COMPOUND_PATTERN =
  /^(き|すな|たけ|つた|かみ|ぬの|いと|すぎ|まめ|こめ|はな|くさ|あさ|きぬ|めのう|ひのき|もめん|はっぱ|もみじ|こはく|ひすい|ふじ|つち|よし|まつ|とう|たま|わら)(こ)?(とって|うけ|ぼう|こもの|はたき|こいた|こだい|こつぼ|さじ|すくい|めじるし|おけ|ふた|わく|はけ|くし|つつ|はこ|うちわ|ざる|へら|べら|つまみ|かご|かざり|とめ|いため|たば|かなぐ|ふだ|かさ|ひっかけ|ひきだし|づつみ|はりばこ|いとまき|おはじき|ちぎりえ|まめざら|ちゃたく|こざいく)$/u;

export const KOREAN_ALLOWED_ONE_SYLLABLE = new Set(
  `
    물 빛 별 꽃 숲 쌀 밥 떡 솜 꿀 깨 벼 밤 봄 달 옷 천 흙 삽 배 귤 논
    닭 말 개 벌 새 맛 잔 향 국 김 해 붓 땅 곰 돌 들 샘 잎 늪 솔 씨 굴
    빵 집 찜 초 띠 옥 벨 편 잠 햄 톳 쌈 알 잼 참 쑥 끈 틀 숯 솥 짚
    뿔 빗 젓 쌍 찬 색 무 소 밀 팥 차 문 담 창 감 비 실 철 양 돛 벽 탕
  `
    .trim()
    .split(/\s+/),
);

export const KOREAN_POETIC_ADJECTIVE_PATTERN =
  /^(정겨운|너른|푸른|따스한|고요한|소담한|포근한|새벽|밝은|고운|둥근|차분한|은빛|맑은)/u;

export const KOREAN_GENERATED_COMPOUND_ROOT_PATTERN =
  /^(도토리|솔방울|연잎|나뭇잎|조약돌|자갈|잔디|이끼|꽃잎|들꽃|갈대|버들|무명|비단|삼베|모시|한지|종이|색종이|나무|대나무|토기|청자|백자|자개|수정|구리|옥돌|호박|면(?:솔방울|나뭇잎))/u;

export const KOREAN_GENERATED_COMPOUND_ALLOWED_STANDALONE = new Set([
  "도토리",
  "솔방울",
  "연잎",
  "나뭇잎",
  "호박",
  "대나무",
  "조약돌",
]);

export const KOREAN_UNAPPROVED_LOANWORD_PATTERN =
  /(화이트|블랙|레드|그린|스퀘어|플레인|로컬|글로벌|럭셔리|내추럴|스포티|미니멀|플라워|스카이|아이스|스노클|슬레드|클로저|트위스트|리스트|리퀴드|트렌디|소프트|솔리드|심플|다크|오가닉|어쿠스틱|엘레강스|컨셉|커스텀|프리미엄|에디션|패키지|텍스처|클리너|스테이지|플래시|리모컨|노트북|헤드폰|이어폰|스마트|디지털|비주얼|이미지|그래픽|사운드|뮤직|라이브|게이트|업그레이드)/u;

export const KOREAN_ALLOWED_LOANWORDS = new Set([
  "테이블",
  "테이프",
  "스카프",
  "포스터",
  "스티커",
  "아이스크림",
  "피스타치오",
  "디저트",
  "피아노",
  "테니스",
  "마라톤",
  "콘서트",
  "클래식",
  "머그잔",
  "프라이팬",
  "시리얼",
  "티슈",
  "에코백",
  "토트백",
]);
