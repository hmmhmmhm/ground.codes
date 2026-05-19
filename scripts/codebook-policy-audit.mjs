import { readFileSync } from "node:fs";

export const EXPECTED_COUNTS = {
  english: 6000,
  korean: 5630,
  chinese: 5140,
  japanese: 5000,
};

const CODEBOOK_FILES = {
  english: "../packages/codebook/codebook-dist/english.json",
  korean: "../packages/codebook/codebook-dist/korean.json",
  chinese: "../packages/codebook/codebook-dist/chinese.json",
  japanese: "../packages/codebook/codebook-dist/japanese.json",
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

const EXACT_BLOCKLISTS = {
  english: ENGLISH_BLOCKED_TERMS,
  korean: KOREAN_BLOCKED_TERMS,
  chinese: CHINESE_BLOCKED_TERMS,
  japanese: JAPANESE_BLOCKED_TERMS,
};

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
              detail:
                "Guide rejects hard clusters and silent-letter patterns",
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
