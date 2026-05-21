import { readFileSync } from "node:fs";

import { AGENT_REVIEWED_BLOCKLISTS } from "./codebook-policy-findings.mjs";

export const EXPECTED_COUNTS = {
  english: 6000,
  korean: 5630,
  chinese: 5140,
  japanese: 5000,
  spanish: 5000,
};

const CODEBOOK_FILES = {
  english: "../packages/codebook/codebook-dist/english.json",
  korean: "../packages/codebook/codebook-dist/korean.json",
  chinese: "../packages/codebook/codebook-dist/chinese.json",
  japanese: "../packages/codebook/codebook-dist/japanese.json",
  spanish: "../packages/codebook/codebook-dist/spanish.json",
};

const ENGLISH_BLOCKED_TERMS = [
  "Rough",
  "Bought",
  "Caught",
  "Enough",
  "School",
  "Sought",
  "Taught",
  "Though",
  "Brought",
  "Scholar",
  "Schools",
  "Thought",
  "Schoolbag",
  "Although",
  "Daughter",
  "Deadline",
  "Hardware",
  "Software",
  "Thoughts",
  "Warnings",
  "Warranty",
  "Discharge",
  "Scheduled",
  "Schedules",
  "Shareware",
  "Scheduling",
  "Throughout",
  "Scholarship",
  "Scholarships",
  "Accessibility",
  "Administrator",
  "Advertisement",
  "Announcements",
  "Architectural",
  "Authorization",
  "Automatically",
  "Biotechnology",
  "Certification",
  "Circumstances",
  "Collaboration",
  "Collaborative",
  "Communication",
  "Compatibility",
  "Comprehensive",
  "Concentration",
  "Configuration",
  "Consideration",
  "Contributions",
  "Corresponding",
  "Determination",
  "Documentation",
  "Entertainment",
  "Environmental",
  "Establishment",
  "Illustrations",
  "Informational",
  "Instructional",
  "International",
  "Investigation",
  "Manufacturers",
  "Manufacturing",
  "Miscellaneous",
  "Modifications",
  "Opportunities",
  "Organisations",
  "Organizations",
  "Participating",
  "Participation",
  "Professionals",
  "Relationships",
  "Significantly",
  "Specification",
  "Subscriptions",
  "Technological",
  "Understanding",
  "Accommodations",
  "Administration",
  "Administrative",
  "Communications",
  "Considerations",
  "Correspondence",
  "Identification",
  "Infrastructure",
  "Interpretation",
  "Organizational",
  "Qualifications",
  "Recommendation",
  "Representation",
  "Representative",
  "Responsibility",
  "Transformation",
  "Transportation",
];

const KOREAN_BLOCKED_TERMS = [
  "강",
  "산",
  "술",
  "섬",
  "시",
  "관",
  "회",
  "약",
  "법",
  "스",
  "스탯",
  "스팟",
  "프레",
  "브람스",
  "브루크",
  "스튜디오",
  "프레이즈",
  "스타일링",
  "스테이션",
  "프로듀서",
  "잣",
  "플록스",
  "도토리토리",
  "도토리걸이",
  "토기묶음",
  "섞기",
  "자개쌀독",
  "호박자",
  "나무고리짝",
  "나무자배기",
  "나무옹배기",
  "들꽃동곳",
  "솔방울묶음",
  "연잎고리짝",
  "연잎자배기",
  "연잎옹배기",
  "호박끌",
  "솔방울꼬챙이",
  "솔방울꽂개",
  "솔방울걸개",
  "호박쌀독",
  "한지도장집",
  "솔방울꾸러미",
  "솔방울타래",
  "갈대실타래",
  "나무종발",
  "나무대패",
  "나무송곳",
  "솔방울덮개",
  "솔방울뚜껑",
  "솔방울받침대",
  "나무빗살",
  "호박송곳",
  "솔방울자",
  "솔방울함지",
  "솔방울광주리",
  "솔방울개비",
  "솔방울쪽",
  "나무토리",
  "나무말이",
  "연잎종발",
  "솔방울쪽지",
  "연잎목판",
  "대나무빗살",
  "연잎대패",
  "솔방울덮보",
  "솔방울손잡이",
  "솔방울굽",
  "솔방울받침돌",
  "대나무토리",
  "솔방울빗살",
  "솔방울토리",
  "솔방울말이",
  "나무함지",
  "나무목판",
  "대나무말이",
  "종이빗살",
  "나무받침대",
  "나무굽",
  "종이토리",
  "종이함지",
  "종이목판",
  "종이받침대",
  "한지붓통",
  "한지필통",
  "수정절구",
  "한지실패",
  "한지실타래",
  "한지꾸러미",
  "연잎송곳",
  "버들실타래",
  "종이말이",
  "수정자배기",
  "비단토리",
  "잔디함지",
  "잔디개비",
  "잔디덮보",
  "나무조롱",
  "나무광목포",
  "잔디토리",
  "무명토리",
  "나무동곳",
  "대나무고리짝",
  "대나무자배기",
  "대나무옹배기",
  "대나무종발",
  "대나무함지",
  "나무개비",
  "나무덮보",
  "대나무조롱",
  "대나무광목포",
  "삼베토리",
  "대나무개비",
  "대나무동곳",
  "종이고리짝",
  "이끼함지",
  "종이자배기",
  "한지함지",
  "종이옹배기",
  "종이종발",
  "이끼개비",
  "연잎함지",
  "대나무덮보",
  "종이개비",
  "연잎개비",
  "연잎덮보",
  "연잎토리",
  "이끼덮보",
  "종이조롱",
  "종이광목포",
  "이끼토리",
  "종이동곳",
  "비단고리짝",
  "비단자배기",
  "비단옹배기",
  "비단종발",
  "비단조롱",
  "구리조롱",
  "종이덮보",
  "비단광목포",
  "비단개비",
  "비단덮보",
  "나무받침돌",
  "나무공이",
  "들꽃막대",
  "나무자",
  "대나무받침대",
  "삼베붓통",
  "삼베필통",
  "대나무목판",
  "대나무대패",
  "대나무자",
  "연잎장식",
  "연잎막대",
  "대나무송곳",
  "갈대장식",
  "종이자",
  "삼베실패",
  "나무광주리",
  "나무쪽",
  "나무쪽지",
  "나무걸개",
  "대나무절구",
  "삼베빗살",
  "대나무공이",
  "대나무광주리",
  "정겨운물결",
  "정겨운냇물",
  "정겨운강물",
  "푸른달빛",
  "푸른붓끝",
  "푸른들녘",
  "푸른자갈",
  "푸른샘물",
  "푸른꽃잎",
  "고운가람",
  "고운미리내",
  "푸른나무",
  "고운한울",
  "푸른솔잎",
  "정겨운햇살",
  "결정",
  "과정",
  "안정",
  "노력",
  "공감",
  "선",
  "상",
  "면",
  "운",
  "대",
];

const CHINESE_BLOCKED_TERMS = [
  "山",
  "河",
  "湖",
  "城",
  "法",
  "园",
  "湾",
  "村",
  "溪",
  "港",
  "岭",
  "江",
  "塔",
  "奖",
  "骰",
  "书法",
  "方法",
  "神话",
  "手法",
  "奖品",
  "法师",
  "法杖",
  "奖杯",
  "奖项",
  "女神",
  "精神",
  "冠军",
  "法规",
  "法律",
  "酒店",
  "米酒",
  "法庭",
  "法官",
  "宪法",
  "奖励",
  "亚军",
  "季军",
  "奖牌",
  "奖章",
  "祝酒",
  "山药",
  "算法",
  "酒柜",
  "酒杯",
  "酒器",
  "酒席",
  "酒宴",
  "酒香",
  "酒水",
  "酒桶",
  "酒瓶",
  "梅枝",
  "芍药",
  "苦酒",
  "神舟",
  "四神",
  "神经",
  "火箭",
  "解法",
  "想法",
  "奖状",
  "技法",
  "酒楼",
  "语法",
  "神秘",
  "奖学金",
  "酒文化",
  "圣诞树",
  "书法家",
];

const JAPANESE_BLOCKED_TERMS = [
  "はは",
  "ちち",
  "つつ",
  "みみ",
  "ごご",
  "きき",
  "やや",
  "もも",
  "ばば",
  "たた",
  "しし",
  "じじ",
];

const SPANISH_BLOCKED_TERMS = [
  "Sexo",
  "Casino",
  "Apuesta",
  "Arma",
  "Guerra",
  "Militar",
  "Droga",
  "Medico",
  "Politica",
  "Religion",
  "Crimen",
  "Muerte",
  "Odio",
  "Violencia",
];

const KOREAN_ALLOWED_ONE_SYLLABLE = new Set(
  `
    물 빛 별 꽃 숲 쌀 밥 떡 솜 꿀 깨 벼 밤 봄 달 옷 천 흙 삽 배 귤 논
    닭 말 개 벌 새 맛 잔 향 국 김 해 붓 땅 곰 돌 들 샘 잎 늪 솔 씨 굴
    빵 집 찜 초 띠 옥 벨 편 잠 햄 톳 쌈 알 잼 참 쑥 끈 틀 숯 솥 짚
    뿔 빗 젓 쌍 찬 색 무 소 밀 팥 차 문 담 창 감 비 실 철 양 돛 벽 탕
  `
    .trim()
    .split(/\s+/),
);

const KOREAN_POETIC_ADJECTIVE_PATTERN =
  /^(정겨운|너른|푸른|따스한|고요한|소담한|새벽|밝은|고운|둥근|차분한|은빛|맑은)/u;

const KOREAN_GENERATED_COMPOUND_ROOT_PATTERN =
  /^(도토리|솔방울|연잎|나뭇잎|조약돌|자갈|잔디|이끼|꽃잎|들꽃|갈대|버들|무명|비단|삼베|모시|한지|종이|나무|대나무|토기|청자|백자|자개|수정|구리|옥돌|호박)/u;

const KOREAN_GENERATED_COMPOUND_ALLOWED_STANDALONE = new Set([
  "도토리",
  "솔방울",
  "연잎",
  "나뭇잎",
  "호박",
  "대나무",
  "조약돌",
]);

const KOREAN_UNAPPROVED_LOANWORD_PATTERN =
  /(화이트|블랙|레드|그린|스퀘어|플레인|로컬|글로벌|럭셔리|내추럴|스포티|미니멀|플라워|스카이|아이스|스노클|슬레드|클로저|트위스트|리스트|리퀴드|트렌디|소프트|솔리드|심플|다크|오가닉|어쿠스틱|엘레강스|컨셉|커스텀|프리미엄|에디션|패키지|텍스처|클리너|스테이지|플래시|리모컨|노트북|헤드폰|이어폰|스마트|디지털|비주얼|이미지|그래픽|사운드|뮤직|라이브|게이트|업그레이드)/u;

const KOREAN_ALLOWED_LOANWORDS = new Set([
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

const GUIDE_REVIEWED_BLOCKLISTS = {
  english: ENGLISH_BLOCKED_TERMS,
  korean: KOREAN_BLOCKED_TERMS,
  chinese: CHINESE_BLOCKED_TERMS,
  japanese: JAPANESE_BLOCKED_TERMS,
  spanish: SPANISH_BLOCKED_TERMS,
};

const EXACT_BLOCKLISTS = Object.fromEntries(
  Object.entries(GUIDE_REVIEWED_BLOCKLISTS).map(([language, words]) => [
    language,
    [...words, ...(AGENT_REVIEWED_BLOCKLISTS[language] ?? [])],
  ]),
);

const HANGUL_BASE = 0xac00;
const HANGUL_END = 0xd7a3;
const HANGUL_VOWEL_COUNT = 21;
const HANGUL_FINAL_COUNT = 28;
const KOREAN_VOWEL_CONFUSION_GROUPS = new Map([
  [1, "E"], // ㅐ
  [5, "E"], // ㅔ
]);

const makeKoreanPronunciationKey = (word) =>
  [...word]
    .map((char) => {
      const code = char.codePointAt(0);
      if (code < HANGUL_BASE || code > HANGUL_END) return char;

      const offset = code - HANGUL_BASE;
      const initial = Math.floor(
        offset / (HANGUL_VOWEL_COUNT * HANGUL_FINAL_COUNT),
      );
      const vowel = Math.floor(
        (offset % (HANGUL_VOWEL_COUNT * HANGUL_FINAL_COUNT)) /
          HANGUL_FINAL_COUNT,
      );
      const final = offset % HANGUL_FINAL_COUNT;
      const normalizedVowel = KOREAN_VOWEL_CONFUSION_GROUPS.get(vowel) ?? vowel;

      return `${initial}:${normalizedVowel}:${final}`;
    })
    .join("|");

const readJson = (path) =>
  JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));

export const loadCodebooks = () =>
  Object.fromEntries(
    Object.entries(CODEBOOK_FILES).map(([language, path]) => [
      language,
      readJson(path),
    ]),
  );

const makeViolation = ({ language, index, word, rule, detail }) => ({
  language,
  index,
  word,
  rule,
  detail,
});

export const auditCodebooks = (codebooks = loadCodebooks()) => {
  const violations = [];
  const summary = {};

  for (const [language, words] of Object.entries(codebooks)) {
    const seen = new Map();
    summary[language] = {
      count: words.length,
      expectedCount: EXPECTED_COUNTS[language],
      unique: new Set(words).size,
      blanks: words.filter((word) => word.trim() === "").length,
    };

    if (words.length !== EXPECTED_COUNTS[language]) {
      violations.push(
        makeViolation({
          language,
          index: -1,
          word: `${words.length}`,
          rule: "expected-count",
          detail: `Expected ${EXPECTED_COUNTS[language]} entries`,
        }),
      );
    }

    const koreanPronunciationKeys = new Map();

    for (const [index, word] of words.entries()) {
      if (word.trim() === "") {
        violations.push(
          makeViolation({
            language,
            index,
            word,
            rule: "blank",
            detail: "Codebook entries must not be blank",
          }),
        );
      }

      const previous = seen.get(word);
      if (previous !== undefined) {
        violations.push(
          makeViolation({
            language,
            index,
            word,
            rule: "duplicate",
            detail: `Duplicate of index ${previous}`,
          }),
        );
      }
      seen.set(word, index);

      const exactBlocklist = new Set(EXACT_BLOCKLISTS[language] ?? []);
      if (exactBlocklist.has(word)) {
        violations.push(
          makeViolation({
            language,
            index,
            word,
            rule: "reviewed-blocklist",
            detail: "Rejected by the codebook authoring guide review pass",
          }),
        );
      }

      if (language === "english") {
        if (!/^[A-Z][a-z]+$/.test(word)) {
          violations.push(
            makeViolation({
              language,
              index,
              word,
              rule: "english-shape",
              detail: "English entries should use ordinary title-case words",
            }),
          );
        }
        if (word.length > 12) {
          violations.push(
            makeViolation({
              language,
              index,
              word,
              rule: "english-too-long",
              detail: "English entries should stay short for URL readability",
            }),
          );
        }
        if (/(ough|augh|psy|sch|corps)/i.test(word)) {
          violations.push(
            makeViolation({
              language,
              index,
              word,
              rule: "english-hard-pronunciation",
              detail: "Guide rejects hard clusters and silent-letter patterns",
            }),
          );
        }
      }

      if (language === "spanish") {
        if (!/^[A-Z][a-z]+$/.test(word)) {
          violations.push(
            makeViolation({
              language,
              index,
              word,
              rule: "spanish-shape",
              detail:
                "Spanish URL codebook entries should use ASCII title-case words",
            }),
          );
        }
        if (word.length > 14) {
          violations.push(
            makeViolation({
              language,
              index,
              word,
              rule: "spanish-too-long",
              detail: "Spanish entries should stay short for URL readability",
            }),
          );
        }
      }

      if (language === "korean" && !/^[\p{Script=Hangul}]+$/u.test(word)) {
        violations.push(
          makeViolation({
            language,
            index,
            word,
            rule: "korean-script",
            detail: "Korean entries should be written in Hangul",
          }),
        );
      }

      if (language === "korean") {
        if (
          KOREAN_GENERATED_COMPOUND_ROOT_PATTERN.test(word) &&
          [...word].length >= 4 &&
          !KOREAN_GENERATED_COMPOUND_ALLOWED_STANDALONE.has(word)
        ) {
          violations.push(
            makeViolation({
              language,
              index,
              word,
              rule: "korean-generated-material-compound",
              detail:
                "Korean entries should avoid generated material/nature compounds",
            }),
          );
        }

        if (KOREAN_POETIC_ADJECTIVE_PATTERN.test(word)) {
          violations.push(
            makeViolation({
              language,
              index,
              word,
              rule: "korean-poetic-adjective-compound",
              detail:
                "Korean entries should avoid poetic adjective compounds in public address words",
            }),
          );
        }

        if ([...word].length === 1 && !KOREAN_ALLOWED_ONE_SYLLABLE.has(word)) {
          violations.push(
            makeViolation({
              language,
              index,
              word,
              rule: "korean-weak-one-syllable",
              detail:
                "Korean one-syllable entries need explicit review and should be familiar standalone nouns",
            }),
          );
        }

        if ([...word].length >= 6) {
          violations.push(
            makeViolation({
              language,
              index,
              word,
              rule: "korean-too-long",
              detail:
                "Korean entries should stay short enough for readable share URLs",
            }),
          );
        }

        if (
          KOREAN_UNAPPROVED_LOANWORD_PATTERN.test(word) &&
          !KOREAN_ALLOWED_LOANWORDS.has(word)
        ) {
          violations.push(
            makeViolation({
              language,
              index,
              word,
              rule: "korean-unapproved-loanword",
              detail:
                "Korean loanword-style entries should be reviewed allowlist items, not style or product jargon",
            }),
          );
        }

        if (/[채체]반/.test(word)) {
          violations.push(
            makeViolation({
              language,
              index,
              word,
              rule: "korean-obscure-household-term",
              detail:
                "Korean entries should avoid uncommon 채반/체반 family terms",
            }),
          );
        }

        const pronunciationKey = makeKoreanPronunciationKey(word);
        const previous = koreanPronunciationKeys.get(pronunciationKey);
        if (previous !== undefined && previous.word !== word) {
          violations.push(
            makeViolation({
              language,
              index,
              word,
              rule: "korean-pronunciation-collision",
              detail: `Sounds like index ${previous.index} "${previous.word}" under Korean confusion groups`,
            }),
          );
        } else {
          koreanPronunciationKeys.set(pronunciationKey, { index, word });
        }
      }

      if (language === "chinese" && !/^[\p{Script=Han}]+$/u.test(word)) {
        violations.push(
          makeViolation({
            language,
            index,
            word,
            rule: "chinese-script",
            detail: "Chinese entries should be written in Han characters",
          }),
        );
      }

      if (language === "japanese") {
        if (!/^[\p{Script=Hiragana}]+$/u.test(word)) {
          violations.push(
            makeViolation({
              language,
              index,
              word,
              rule: "japanese-script",
              detail: "Japanese entries should remain hiragana-visible",
            }),
          );
        }
        if (/[っん]$/u.test(word)) {
          violations.push(
            makeViolation({
              language,
              index,
              word,
              rule: "japanese-ending",
              detail: "Japanese entries should not end with small tsu or n",
            }),
          );
        }
        if (/^([\p{Script=Hiragana}])\1$/u.test(word)) {
          violations.push(
            makeViolation({
              language,
              index,
              word,
              rule: "japanese-repeated-kana",
              detail: "Repeated-syllable filler should be rejected",
            }),
          );
        }
      }
    }
  }

  return { summary, violations };
};

export const formatAuditMarkdown = ({ summary, violations }) => {
  const rows = Object.entries(summary)
    .map(
      ([language, item]) =>
        `| ${language} | ${item.count} | ${item.expectedCount} | ${item.unique} | ${item.blanks} |`,
    )
    .join("\n");

  const samples = violations
    .slice(0, 80)
    .map(
      (item) =>
        `- ${item.language}[${item.index}] ${item.word}: ${item.rule} (${item.detail})`,
    )
    .join("\n");

  return [
    "# Codebook Policy Audit",
    "",
    "| Language | Count | Expected | Unique | Blanks |",
    "| --- | ---: | ---: | ---: | ---: |",
    rows,
    "",
    `Violations: ${violations.length}`,
    samples ? `\n${samples}` : "",
  ].join("\n");
};

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = auditCodebooks();
  console.log(formatAuditMarkdown(result));
  process.exitCode = result.violations.length === 0 ? 0 : 1;
}
