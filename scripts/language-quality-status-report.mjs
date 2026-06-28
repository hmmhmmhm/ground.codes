import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const root = new URL("../", import.meta.url);
const readText = (relativePath) =>
  readFileSync(new URL(relativePath, root), "utf8");
const readJson = (relativePath) => JSON.parse(readText(relativePath));
const pathExists = (relativePath) => existsSync(new URL(relativePath, root));

const assertCurrent = process.argv.includes("--assert-current");
const outputJson = process.argv.includes("--json");
const categoryFilter = (() => {
  const index = process.argv.indexOf("--category");
  if (index === -1) return undefined;
  return process.argv[index + 1];
})();

const targetLanguages = readJson("config/language-expansion-targets.json")
  .languages.map((item) => item.language)
  .sort();
const targetSet = new Set(targetLanguages);

const qualityDoc = readText("packages/codebook/LANGUAGE_QUALITY.md");
const backlogDoc = pathExists("docs/language-native-review-backlog.md")
  ? readText("docs/language-native-review-backlog.md")
  : "";
const rows = [
  ...qualityDoc.matchAll(
    /^\|\s*([^|]+?)\s*\|\s*(\d+)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|$/gm,
  ),
].map(([, language, count, status, focus]) => ({
  language: language.trim(),
  count: Number(count),
  status: status.trim(),
  focus: focus.trim(),
}));

const rowByLanguage = new Map(rows.map((row) => [row.language, row]));
const missingFromQualityDoc = targetLanguages.filter(
  (language) => !rowByLanguage.has(language),
);
const extraQualityRows = rows
  .map((row) => row.language)
  .filter((language) => !targetSet.has(language))
  .sort();
const unknownStatuses = rows.filter(
  (row) => !["stable", "active cleanup"].includes(row.status),
);
const countMismatches = [];
const staleBacklogFacts = [];

for (const language of targetLanguages) {
  const row = rowByLanguage.get(language);
  const codebookPath = `packages/codebook/codebook-dist/${language}.json`;
  if (!row || !pathExists(codebookPath)) continue;

  const codebook = readJson(codebookPath);
  if (row.count !== codebook.length) {
    countMismatches.push({
      language,
      documented: row.count,
      actual: codebook.length,
    });
  }
}

const statusCounts = rows.reduce((counts, row) => {
  counts[row.status] = (counts[row.status] ?? 0) + 1;
  return counts;
}, {});
const activeCleanupLanguages = rows
  .filter((row) => row.status === "active cleanup")
  .map((row) => row.language)
  .sort();
const activeRows = rows.filter((row) => row.status === "active cleanup");
const reviewCategories = {
  "generated fallback vocabulary":
    /generated fallback vocabulary|generated fallback pairs|fallback pairs|fallback vocabulary/i,
  "native lexical review":
    /native lexical review|native naturalness|administrative-label naturalness|native review of administrative label naturalness|native speaker review|native-speaker naturalness|native review should/i,
  "region terminology": /region terminology/i,
  "fused pairs": /fused/i,
  "transliteration seeds": /transliterated seed/i,
  "standalone expansion":
    /expand natural standalone|should expand natural standalone|native review should expand/i,
  "script-specific review":
    /mixed-script|script-specific|script review|transliteration conventions|URL readability/i,
};
const categoryRows = Object.entries(reviewCategories).map(
  ([category, pattern]) => ({
    category,
    languages: activeRows
      .filter((row) => pattern.test(row.focus))
      .map((row) => row.language)
      .sort(),
  }),
);
const filteredCategory =
  categoryFilter === undefined
    ? undefined
    : categoryRows.find((row) => row.category === categoryFilter);

if (backlogDoc) {
  for (const [label, count] of [
    ["`stable`", statusCounts.stable ?? 0],
    ["`active cleanup`", statusCounts["active cleanup"] ?? 0],
  ]) {
    if (!backlogDoc.includes(`${label}: ${count}`)) {
      staleBacklogFacts.push(`${label}: ${count}`);
    }
  }

  for (const { category, languages } of categoryRows) {
    if (
      !backlogDoc.includes(
        `| ${category[0].toUpperCase()}${category.slice(1)} |`,
      )
    ) {
      continue;
    }
    const categoryPattern = new RegExp(
      `\\|\\s*${category[0].toUpperCase()}${category
        .slice(1)
        .replace(
          /[.*+?^${}()|[\]\\]/g,
          "\\$&",
        )}\\s*\\|\\s*${languages.length}\\s*\\|`,
    );
    if (!categoryPattern.test(backlogDoc)) {
      staleBacklogFacts.push(`${category}: ${languages.length}`);
    }
  }
}

const report = {
  targetLanguages: targetLanguages.length,
  qualityRows: rows.length,
  statusCounts,
  activeCleanupLanguages,
  categories: Object.fromEntries(
    categoryRows.map((row) => [row.category, row.languages]),
  ),
  problems: {
    missingFromQualityDoc,
    extraQualityRows,
    unknownStatuses: unknownStatuses.map((row) => ({
      language: row.language,
      status: row.status,
    })),
    countMismatches,
    staleBacklogFacts,
  },
};

if (categoryFilter !== undefined && filteredCategory === undefined) {
  const available = categoryRows.map((row) => row.category).join(", ");
  throw new Error(
    `Unknown review category "${categoryFilter}". Use: ${available}`,
  );
}

if (outputJson) {
  const jsonReport =
    filteredCategory === undefined
      ? report
      : {
          category: filteredCategory.category,
          count: filteredCategory.languages.length,
          languages: filteredCategory.languages,
        };
  console.log(JSON.stringify(jsonReport, null, 2));
} else if (filteredCategory !== undefined) {
  console.log(
    `${filteredCategory.category}: ${filteredCategory.languages.length}`,
  );
  for (const language of filteredCategory.languages) {
    console.log(language);
  }
} else {
  console.log(
    `Language quality rows: ${rows.length}/${targetLanguages.length}`,
  );
  for (const [status, count] of Object.entries(statusCounts).sort()) {
    console.log(`${status}: ${count}`);
  }
  console.log(
    `active cleanup review backlog: ${activeCleanupLanguages.length}` +
      (activeCleanupLanguages.length
        ? ` (${activeCleanupLanguages.slice(0, 12).join(", ")}${activeCleanupLanguages.length > 12 ? "..." : ""})`
        : ""),
  );
  for (const { category, languages } of categoryRows) {
    console.log(
      `${category}: ${languages.length}` +
        (languages.length
          ? ` (${languages.slice(0, 12).join(", ")}${languages.length > 12 ? "..." : ""})`
          : ""),
    );
  }

  if (missingFromQualityDoc.length) {
    console.log(`missing quality rows: ${missingFromQualityDoc.join(", ")}`);
  }
  if (extraQualityRows.length) {
    console.log(`extra quality rows: ${extraQualityRows.join(", ")}`);
  }
  if (unknownStatuses.length) {
    console.log(
      `unknown statuses: ${unknownStatuses
        .map((row) => `${row.language}=${row.status}`)
        .join(", ")}`,
    );
  }
  if (countMismatches.length) {
    console.log(
      `count mismatches: ${countMismatches
        .map(
          (item) =>
            `${item.language} documented=${item.documented} actual=${item.actual}`,
        )
        .join(", ")}`,
    );
  }
  if (staleBacklogFacts.length) {
    console.log(`stale backlog facts: ${staleBacklogFacts.join(", ")}`);
  }
}

if (assertCurrent) {
  assert.deepEqual(missingFromQualityDoc, [], "missing quality rows");
  assert.deepEqual(extraQualityRows, [], "extra quality rows");
  assert.deepEqual(unknownStatuses, [], "unknown quality statuses");
  assert.deepEqual(countMismatches, [], "quality count mismatches");
  assert.deepEqual(staleBacklogFacts, [], "stale native review backlog facts");
  assert.equal(rows.length, targetLanguages.length, "quality row count");
}
