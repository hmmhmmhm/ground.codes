import { appendFileSync, readFileSync } from "node:fs";

const DATASETS = [
  [
    "earth region-1 english",
    "english",
    "../packages/geoint/region-dist/region-1.json",
  ],
  [
    "earth region-2 english",
    "english",
    "../packages/geoint/region-dist/region-2.json",
  ],
  [
    "earth region-2 korean",
    "korean",
    "../packages/geoint/region-dist/region-2-korean.json",
  ],
  [
    "earth region-2 chinese",
    "chinese",
    "../packages/geoint/region-dist/region-2-chinese.json",
  ],
  [
    "earth region-2 japanese",
    "japanese",
    "../packages/geoint/region-dist/region-2-japanese.json",
  ],
  [
    "earth region-2 spanish",
    "spanish",
    "../packages/geoint/region-dist/region-2-spanish.json",
  ],
  [
    "earth region-2 french",
    "french",
    "../packages/geoint/region-dist/region-2-french.json",
  ],
  [
    "earth region-2 german",
    "german",
    "../packages/geoint/region-dist/region-2-german.json",
  ],
  [
    "earth region-2 portuguese",
    "portuguese",
    "../packages/geoint/region-dist/region-2-portuguese.json",
  ],
  [
    "earth region-2 indonesian",
    "indonesian",
    "../packages/geoint/region-dist/region-2-indonesian.json",
  ],
  [
    "earth region-2 thai",
    "thai",
    "../packages/geoint/region-dist/region-2-thai.json",
  ],
  [
    "earth region-2 vietnamese",
    "vietnamese",
    "../packages/geoint/region-dist/region-2-vietnamese.json",
  ],
  [
    "earth region-3 english",
    "english",
    "../packages/geoint/region-dist/region-3.json",
  ],
  [
    "earth region-3 korean",
    "korean",
    "../packages/geoint/region-dist/region-3-korean.json",
  ],
  [
    "earth region-3 chinese",
    "chinese",
    "../packages/geoint/region-dist/region-3-chinese.json",
  ],
  [
    "earth region-3 japanese",
    "japanese",
    "../packages/geoint/region-dist/region-3-japanese.json",
  ],
  [
    "earth region-3 spanish",
    "spanish",
    "../packages/geoint/region-dist/region-3-spanish.json",
  ],
  [
    "earth region-3 french",
    "french",
    "../packages/geoint/region-dist/region-3-french.json",
  ],
  [
    "earth region-3 german",
    "german",
    "../packages/geoint/region-dist/region-3-german.json",
  ],
  [
    "earth region-3 portuguese",
    "portuguese",
    "../packages/geoint/region-dist/region-3-portuguese.json",
  ],
  [
    "earth region-3 indonesian",
    "indonesian",
    "../packages/geoint/region-dist/region-3-indonesian.json",
  ],
  [
    "earth region-3 thai",
    "thai",
    "../packages/geoint/region-dist/region-3-thai.json",
  ],
  [
    "earth region-3 vietnamese",
    "vietnamese",
    "../packages/geoint/region-dist/region-3-vietnamese.json",
  ],
  [
    "moon region-2 english",
    "english",
    "../packages/geoint/region-dist/region-2-moon.json",
  ],
  [
    "moon region-2 korean",
    "korean",
    "../packages/geoint/region-dist/region-2-moon-korean.json",
  ],
  [
    "moon region-2 chinese",
    "chinese",
    "../packages/geoint/region-dist/region-2-moon-chinese.json",
  ],
  [
    "moon region-2 japanese",
    "japanese",
    "../packages/geoint/region-dist/region-2-moon-japanese.json",
  ],
  [
    "moon region-2 spanish",
    "spanish",
    "../packages/geoint/region-dist/region-2-moon-spanish.json",
  ],
  [
    "moon region-2 french",
    "french",
    "../packages/geoint/region-dist/region-2-moon-french.json",
  ],
  [
    "moon region-2 german",
    "german",
    "../packages/geoint/region-dist/region-2-moon-german.json",
  ],
  [
    "moon region-2 portuguese",
    "portuguese",
    "../packages/geoint/region-dist/region-2-moon-portuguese.json",
  ],
  [
    "moon region-2 indonesian",
    "indonesian",
    "../packages/geoint/region-dist/region-2-moon-indonesian.json",
  ],
  [
    "moon region-2 thai",
    "thai",
    "../packages/geoint/region-dist/region-2-moon-thai.json",
  ],
  [
    "moon region-2 vietnamese",
    "vietnamese",
    "../packages/geoint/region-dist/region-2-moon-vietnamese.json",
  ],
  [
    "mars region-2 english",
    "english",
    "../packages/geoint/region-dist/region-2-mars.json",
  ],
  [
    "mars region-2 korean",
    "korean",
    "../packages/geoint/region-dist/region-2-mars-korean.json",
  ],
  [
    "mars region-2 chinese",
    "chinese",
    "../packages/geoint/region-dist/region-2-mars-chinese.json",
  ],
  [
    "mars region-2 japanese",
    "japanese",
    "../packages/geoint/region-dist/region-2-mars-japanese.json",
  ],
  [
    "mars region-2 spanish",
    "spanish",
    "../packages/geoint/region-dist/region-2-mars-spanish.json",
  ],
  [
    "mars region-2 french",
    "french",
    "../packages/geoint/region-dist/region-2-mars-french.json",
  ],
  [
    "mars region-2 german",
    "german",
    "../packages/geoint/region-dist/region-2-mars-german.json",
  ],
  [
    "mars region-2 portuguese",
    "portuguese",
    "../packages/geoint/region-dist/region-2-mars-portuguese.json",
  ],
  [
    "mars region-2 indonesian",
    "indonesian",
    "../packages/geoint/region-dist/region-2-mars-indonesian.json",
  ],
  [
    "mars region-2 thai",
    "thai",
    "../packages/geoint/region-dist/region-2-mars-thai.json",
  ],
  [
    "mars region-2 vietnamese",
    "vietnamese",
    "../packages/geoint/region-dist/region-2-mars-vietnamese.json",
  ],
  [
    "mars region-3 english",
    "english",
    "../packages/geoint/region-dist/region-3-mars.json",
  ],
  [
    "mars region-3 korean",
    "korean",
    "../packages/geoint/region-dist/region-3-mars-korean.json",
  ],
  [
    "mars region-3 chinese",
    "chinese",
    "../packages/geoint/region-dist/region-3-mars-chinese.json",
  ],
  [
    "mars region-3 japanese",
    "japanese",
    "../packages/geoint/region-dist/region-3-mars-japanese.json",
  ],
  [
    "mars region-3 spanish",
    "spanish",
    "../packages/geoint/region-dist/region-3-mars-spanish.json",
  ],
  [
    "mars region-3 french",
    "french",
    "../packages/geoint/region-dist/region-3-mars-french.json",
  ],
  [
    "mars region-3 german",
    "german",
    "../packages/geoint/region-dist/region-3-mars-german.json",
  ],
  [
    "mars region-3 portuguese",
    "portuguese",
    "../packages/geoint/region-dist/region-3-mars-portuguese.json",
  ],
  [
    "mars region-3 indonesian",
    "indonesian",
    "../packages/geoint/region-dist/region-3-mars-indonesian.json",
  ],
  [
    "mars region-3 thai",
    "thai",
    "../packages/geoint/region-dist/region-3-mars-thai.json",
  ],
  [
    "mars region-3 vietnamese",
    "vietnamese",
    "../packages/geoint/region-dist/region-3-mars-vietnamese.json",
  ],
];

const hasNonAscii = (value) => /[^\x20-\x7E]/.test(value);
const hasLatin = (value) => /[A-Za-z]/.test(value);
const allowsLatinLabels = (language) =>
  language === "english" ||
  language === "spanish" ||
  language === "french" ||
  language === "german" ||
  language === "portuguese" ||
  language === "indonesian" ||
  language === "vietnamese";
const sampleLabels = (names, predicate) => names.filter(predicate).slice(0, 5);

export const buildUrlLabelReport = (datasets) => {
  const reportDatasets = datasets.map(({ name, language, rows }) => {
    const names = rows.map((row) => String(row.name ?? ""));
    const englishNonAsciiSamples = allowsLatinLabels(language)
      ? sampleLabels(names, hasNonAscii)
      : [];
    const localizedLatinSamples = allowsLatinLabels(language)
      ? []
      : sampleLabels(names, hasLatin);

    return {
      name,
      rows: rows.length,
      englishNonAscii: allowsLatinLabels(language)
        ? names.filter(hasNonAscii).length
        : 0,
      localizedLatin: allowsLatinLabels(language)
        ? 0
        : names.filter(hasLatin).length,
      englishNonAsciiSamples,
      localizedLatinSamples,
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
  const sampleRows = report.datasets
    .flatMap((dataset) => {
      const samples = [];
      if (dataset.englishNonAsciiSamples?.length) {
        samples.push(
          `- ${dataset.name}: English non-ASCII: ${dataset.englishNonAsciiSamples.join(", ")}`,
        );
      }
      if (dataset.localizedLatinSamples?.length) {
        samples.push(
          `- ${dataset.name}: Localized Latin: ${dataset.localizedLatinSamples.join(", ")}`,
        );
      }
      return samples;
    })
    .join("\n");

  const sections = [
    "## URL Label Data",
    "",
    `Total labels: ${report.totals.rows}`,
    "",
    "| Dataset | Labels | English non-ASCII | Localized Latin |",
    "| --- | ---: | ---: | ---: |",
    rows,
    "",
  ];

  if (sampleRows) {
    sections.push("### Sample Issues", "", sampleRows, "");
  }

  return sections.join("\n");
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
