import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  buildUrlLabelReport,
  formatUrlLabelReportMarkdown,
} from "./url-label-report.mjs";

describe("URL label report", () => {
  test("summarizes unsafe English labels and Latin localized labels", () => {
    const report = buildUrlLabelReport([
      {
        name: "earth region-2 english",
        language: "english",
        rows: [{ name: "Seoul" }, { name: "Möllereisstrom" }],
      },
      {
        name: "earth region-2 korean",
        language: "korean",
        rows: [{ name: "서울" }, { name: "Seoul" }],
      },
    ]);

    assert.deepEqual(report.datasets.map((dataset) => dataset.name), [
      "earth region-2 english",
      "earth region-2 korean",
    ]);
    assert.equal(report.totals.rows, 4);
    assert.equal(report.totals.englishNonAscii, 1);
    assert.equal(report.totals.localizedLatin, 1);
    assert.deepEqual(report.datasets[0].englishNonAsciiSamples, ["Möllereisstrom"]);
    assert.deepEqual(report.datasets[1].localizedLatinSamples, ["Seoul"]);
  });

  test("formats a compact markdown report for CI summaries", () => {
    const markdown = formatUrlLabelReportMarkdown({
      totals: {
        rows: 2,
        englishNonAscii: 0,
        localizedLatin: 0,
      },
      datasets: [
        {
          name: "earth region-2 english",
          rows: 2,
          englishNonAscii: 0,
          localizedLatin: 0,
          englishNonAsciiSamples: [],
          localizedLatinSamples: [],
        },
        {
          name: "moon region-2 english",
          rows: 3,
          englishNonAscii: 1,
          localizedLatin: 0,
          englishNonAsciiSamples: ["Möllereisstrom"],
          localizedLatinSamples: [],
        },
      ],
    });

    assert.match(markdown, /^## URL Label Data/);
    assert.match(markdown, /\| earth region-2 english \| 2 \| 0 \| 0 \|/);
    assert.match(markdown, /### Sample Issues/);
    assert.match(markdown, /moon region-2 english: English non-ASCII: Möllereisstrom/);
  });
});
