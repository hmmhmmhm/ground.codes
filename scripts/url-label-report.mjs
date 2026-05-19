import { appendFileSync, readFileSync } from "node:fs";

const DATASETS = [
  ["earth region-1 english", "english", "../packages/geoint/region-dist/region-1.json"],
  ["earth region-2 english", "english", "../packages/geoint/region-dist/region-2.json"],
  ["earth region-2 korean", "korean", "../packages/geoint/region-dist/region-2-korean.json"],
  ["earth region-2 chinese", "chinese", "../packages/geoint/region-dist/region-2-chinese.json"],
  ["earth region-2 japanese", "japanese", "../packages/geoint/region-dist/region-2-japanese.json"],
  ["earth region-3 english", "english", "../packages/geoint/region-dist/region-3.json"],
  ["earth region-3 korean", "korean", "../packages/geoint/region-dist/region-3-korean.json"],
  ["earth region-3 chinese", "chinese", "../packages/geoint/region-dist/region-3-chinese.json"],
  ["earth region-3 japanese", "japanese", "../packages/geoint/region-dist/region-3-japanese.json"],
  ["moon region-2 english", "english", "../packages/geoint/region-dist/region-2-moon.json"],
  ["moon region-2 korean", "korean", "../packages/geoint/region-dist/region-2-moon-korean.json"],
  ["moon region-2 chinese", "chinese", "../packages/geoint/region-dist/region-2-moon-chinese.json"],
  ["moon region-2 japanese", "japanese", "../packages/geoint/region-dist/region-2-moon-japanese.json"],
  ["mars region-2 english", "english", "../packages/geoint/region-dist/region-2-mars.json"],
  ["mars region-2 korean", "korean", "../packages/geoint/region-dist/region-2-mars-korean.json"],
  ["mars region-2 chinese", "chinese", "../packages/geoint/region-dist/region-2-mars-chinese.json"],
  ["mars region-2 japanese", "japanese", "../packages/geoint/region-dist/region-2-mars-japanese.json"],
  ["mars region-3 english", "english", "../packages/geoint/region-dist/region-3-mars.json"],
  ["mars region-3 korean", "korean", "../packages/geoint/region-dist/region-3-mars-korean.json"],
  ["mars region-3 chinese", "chinese", "../packages/geoint/region-dist/region-3-mars-chinese.json"],
  ["mars region-3 japanese", "japanese", "../packages/geoint/region-dist/region-3-mars-japanese.json"],
];

const hasNonAscii = (value) => /[^\x20-\x7E]/.test(value);
const hasLatin = (value) => /[A-Za-z]/.test(value);

export const buildUrlLabelReport = (datasets) => {
  const reportDatasets = datasets.map(({ name, language, rows }) => {
    const names = rows.map((row) => String(row.name ?? ""));
    const englishNonAscii =
      language === "english" ? names.filter(hasNonAscii).length : 0;
    const localizedLatin =
      language === "english" ? 0 : names.filter(hasLatin).length;

    return {
      name,
      rows: rows.length,
      englishNonAscii,
      localizedLatin,
    };
  });

  return {
    totals: reportDatasets.reduce(
      (totals, dataset) => ({
        rows: totals.rows + dataset.rows,
        englishNonAscii: totals.englishNonAscii + dataset.englishNonAscii,
        localizedLatin: totals.localizedLatin + dataset.localizedLatin,
      }),
      { rows: 0, englishNonAscii: 0, localizedLatin: 0 },
    ),
    datasets: reportDatasets,
  };
};

export const formatUrlLabelReportMarkdown = (report) => {
  const rows = report.datasets
    .map(
      (dataset) =>
        `| ${dataset.name} | ${dataset.rows} | ${dataset.englishNonAscii} | ${dataset.localizedLatin} |`,
    )
    .join("\n");

  return [
    "## URL Label Data",
    "",
    `Total labels: ${report.totals.rows}`,
    "",
    "| Dataset | Labels | English non-ASCII | Localized Latin |",
    "| --- | ---: | ---: | ---: |",
    rows,
    "",
  ].join("\n");
};

const loadConfiguredDatasets = () =>
  DATASETS.map(([name, language, path]) => ({
    name,
    language,
    rows: JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8")),
  }));

if (import.meta.url === `file://${process.argv[1]}`) {
  const report = buildUrlLabelReport(loadConfiguredDatasets());
  const markdown = formatUrlLabelReportMarkdown(report);
  console.log(markdown);

  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, markdown);
  }
}
