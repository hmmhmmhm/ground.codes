import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const root = new URL("../", import.meta.url);
const readText = (relativePath) =>
  readFileSync(new URL(relativePath, root), "utf8");
const readJson = (relativePath) => JSON.parse(readText(relativePath));
const pathExists = (relativePath) => existsSync(new URL(relativePath, root));

const outputJson = process.argv.includes("--json");
const assertMinIndex = process.argv.indexOf("--assert-min");
const assertMin =
  assertMinIndex === -1 ? undefined : Number(process.argv[assertMinIndex + 1]);
const limitIndex = process.argv.indexOf("--limit");
const limit = limitIndex === -1 ? 10 : Number(process.argv[limitIndex + 1]);

const targetLanguages = readJson("config/language-expansion-targets.json")
  .languages.map((item) => item.language)
  .sort();

const qualityDoc = readText("packages/codebook/LANGUAGE_QUALITY.md");
const qualityRows = [
  ...qualityDoc.matchAll(
    /^\|\s*([^|]+?)\s*\|\s*(\d+)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|$/gm,
  ),
].map(([, language, documentedCount, status, focus]) => ({
  language: language.trim(),
  documentedCount: Number(documentedCount),
  status: status.trim(),
  focus: focus.trim(),
}));
const qualityByLanguage = new Map(
  qualityRows.map((row) => [row.language, row]),
);

const hasReviewEvidence = (focus) =>
  /removes exact English|free of reviewed|front-loads|reviewed everyday|localized region datasets|pass|Extended cleanup keeps|ships .*everyday nouns|keeps all .*entries/i.test(
    focus,
  );
const hasNativeReviewBacklog = (focus) =>
  /long-tail native lexical review|native review|administrative label naturalness/i.test(
    focus,
  );
const hasKnownWeakness = (focus) =>
  /rough[^.;]*remain|weak[^.;]*remain|fallback[^.;]*remain|overlap[^.;]*remain|artifact[^.;]*remain|should replace/i.test(
    focus,
  );

const scoreLanguage = (language) => {
  const row = qualityByLanguage.get(language);
  assert.ok(row, `${language} missing from LANGUAGE_QUALITY.md`);

  const codebookPath = `packages/codebook/codebook-dist/${language}.json`;
  assert.ok(pathExists(codebookPath), `${language} codebook missing`);

  const words = readJson(codebookPath);
  const uniqueCount = new Set(words).size;
  const urlUnsafeCount = words.filter((word) => !word || /\s|-/.test(word))
    .length;

  const expectedCount = row.documentedCount;
  const countScore =
    words.length >= expectedCount
      ? 15
      : Math.max(0, (words.length / expectedCount) * 15);
  const uniqueScore =
    uniqueCount === words.length ? 15 : (uniqueCount / words.length) * 15;
  const urlScore =
    urlUnsafeCount === 0
      ? 15
      : Math.max(0, 15 - (urlUnsafeCount / words.length) * 15);
  const statusScore = row.status === "stable" ? 35 : 18;
  const reviewBonus = hasReviewEvidence(row.focus) ? 6 : 0;

  let penalty = 0;
  if (row.status !== "stable" && hasNativeReviewBacklog(row.focus)) penalty += 8;
  if (row.status !== "stable" && hasKnownWeakness(row.focus)) penalty += 6;

  const score = Math.max(
    0,
    Math.min(
      100,
      Math.round(countScore + uniqueScore + urlScore + statusScore + reviewBonus - penalty),
    ),
  );

  const blockers = [];
  if (row.status !== "stable") blockers.push("not stable");
  if (urlUnsafeCount) blockers.push(`${urlUnsafeCount} URL-unsafe entries`);
  if (uniqueCount !== words.length) blockers.push("duplicate entries");
  if (words.length < expectedCount) blockers.push("short codebook");
  if (row.status !== "stable" && hasNativeReviewBacklog(row.focus)) {
    blockers.push("native review backlog");
  }
  if (row.status !== "stable" && hasKnownWeakness(row.focus)) {
    blockers.push("known cleanup focus");
  }

  return {
    language,
    score,
    status: row.status,
    count: words.length,
    expectedCount,
    uniqueCount,
    urlUnsafeCount,
    blockers,
    focus: row.focus,
  };
};

const rows = targetLanguages
  .map(scoreLanguage)
  .sort((a, b) => b.score - a.score || a.language.localeCompare(b.language));
const ascending = [...rows].sort(
  (a, b) => a.score - b.score || a.language.localeCompare(b.language),
);
const belowMin =
  assertMin === undefined ? [] : rows.filter((row) => row.score < assertMin);
const average =
  rows.reduce((sum, row) => sum + row.score, 0) / Math.max(rows.length, 1);

const report = {
  targetLanguages: rows.length,
  averageScore: Number(average.toFixed(1)),
  minimumScore: ascending[0]?.score,
  maximumScore: rows[0]?.score,
  under80: rows.filter((row) => row.score < 80).length,
  top: rows.slice(0, limit),
  bottom: ascending.slice(0, limit),
  rows,
};

if (outputJson) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log(`Language quality score rows: ${rows.length}`);
  console.log(`Average score: ${report.averageScore}%`);
  console.log(`Score range: ${report.minimumScore}%..${report.maximumScore}%`);
  console.log(`Under 80%: ${report.under80}`);
  console.log("");
  console.log(`Top ${limit}:`);
  for (const row of report.top) {
    console.log(
      `${row.language.padEnd(20)} ${String(row.score).padStart(3)}% ${row.status}`,
    );
  }
  console.log("");
  console.log(`Bottom ${limit}:`);
  for (const row of report.bottom) {
    console.log(
      `${row.language.padEnd(20)} ${String(row.score).padStart(3)}% ${row.status} (${row.blockers.join(", ")})`,
    );
  }
}

if (assertMin !== undefined) {
  assert.deepEqual(
    belowMin.map((row) => `${row.language}=${row.score}%`),
    [],
    `languages below ${assertMin}%`,
  );
}
