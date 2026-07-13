import { readFileSync } from "node:fs";

import { auditEastAsianWord } from "./data/codebook-policy-audit-east-validator.mjs";
import { auditExpandedWord } from "./data/codebook-policy-audit-expanded-validator.mjs";
import { auditLatinWord } from "./data/codebook-policy-audit-latin-validator.mjs";

import {
  ADDRESS_GAP_LANGUAGES,
  ADDRESS_GAP_MAX_LENGTHS,
  ADDRESS_GAP_SCRIPT_PATTERNS,
  CODEBOOK_FILES,
  EXPECTED_COUNTS,
  makeAddressGapPronunciationKey,
} from "./data/codebook-policy-audit-base.mjs";
import { EXACT_BLOCKLISTS } from "./data/codebook-policy-audit-blocklists.mjs";

import {
  FRENCH_COMPOUND_SATURATION_LIMIT,
  FRENCH_TEMPLATE_COMPOUND_PATTERN,
  SPANISH_COMPOUND_SATURATION_LIMIT,
  SPANISH_REVIEWED_STANDALONE_WORDS,
  SPANISH_TEMPLATE_COMPOUND_PATTERN,
} from "./data/codebook-policy-audit-blocked-east-europe.mjs";
import {
  GERMAN_COMPOUND_SATURATION_LIMIT,
  GERMAN_TEMPLATE_COMPOUND_PATTERN,
  PORTUGUESE_COMPOUND_SATURATION_LIMIT,
  PORTUGUESE_TEMPLATE_COMPOUND_PATTERN,
} from "./data/codebook-policy-audit-european-rules.mjs";

export { EXPECTED_COUNTS };

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

    if (language === "spanish") {
      const templateCompoundCount = words.filter(
        (word) =>
          !SPANISH_REVIEWED_STANDALONE_WORDS.has(word) &&
          SPANISH_TEMPLATE_COMPOUND_PATTERN.test(word),
      ).length;

      if (templateCompoundCount > SPANISH_COMPOUND_SATURATION_LIMIT) {
        violations.push(
          makeViolation({
            language,
            index: -1,
            word: `${templateCompoundCount}`,
            rule: "spanish-compound-saturation",
            detail: `Spanish codebooks should not be saturated with fused template compounds; limit is ${SPANISH_COMPOUND_SATURATION_LIMIT}`,
          }),
        );
      }
    }

    if (language === "french") {
      const templateCompoundCount = words.filter((word) =>
        FRENCH_TEMPLATE_COMPOUND_PATTERN.test(word),
      ).length;

      if (templateCompoundCount > FRENCH_COMPOUND_SATURATION_LIMIT) {
        violations.push(
          makeViolation({
            language,
            index: -1,
            word: `${templateCompoundCount}`,
            rule: "french-compound-saturation",
            detail: `French codebooks should not be saturated with fused template compounds; limit is ${FRENCH_COMPOUND_SATURATION_LIMIT}`,
          }),
        );
      }
    }

    if (language === "german") {
      const templateCompoundCount = words.filter((word) =>
        GERMAN_TEMPLATE_COMPOUND_PATTERN.test(word),
      ).length;

      if (templateCompoundCount > GERMAN_COMPOUND_SATURATION_LIMIT) {
        violations.push(
          makeViolation({
            language,
            index: -1,
            word: `${templateCompoundCount}`,
            rule: "german-compound-saturation",
            detail: `German codebooks should not be saturated with fused template compounds; limit is ${GERMAN_COMPOUND_SATURATION_LIMIT}`,
          }),
        );
      }
    }

    if (language === "portuguese") {
      const templateCompoundCount = words.filter((word) =>
        PORTUGUESE_TEMPLATE_COMPOUND_PATTERN.test(word),
      ).length;

      if (templateCompoundCount > PORTUGUESE_COMPOUND_SATURATION_LIMIT) {
        violations.push(
          makeViolation({
            language,
            index: -1,
            word: `${templateCompoundCount}`,
            rule: "portuguese-compound-saturation",
            detail: `Portuguese codebooks should not be saturated with fused template compounds; limit is ${PORTUGUESE_COMPOUND_SATURATION_LIMIT}`,
          }),
        );
      }
    }

    const koreanPronunciationKeys = new Map();
    const addressGapPronunciationKeys = new Map();

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

      auditLatinWord({ language, index, word, violations, makeViolation });
      auditExpandedWord({ language, index, word, violations, makeViolation });
      auditEastAsianWord({
        language,
        index,
        word,
        violations,
        makeViolation,
        addressGapPronunciationKeys,
        koreanPronunciationKeys,
      });
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
